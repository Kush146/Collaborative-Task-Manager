// backend/src/app.ts
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env.js'
import { router as authRouter } from './modules/auth/auth.controller.js'
import { router as taskRouter } from './modules/task/task.controller.js'
import { router as notificationRouter } from './modules/notification/notification.controller.js'
import { router as userRouter } from './modules/user/user.controller.js'
import { attachUserIfPresent } from './middleware/auth.js'

export const createApp = () => {
  const app = express()

  // If running behind Render/Proxy, trust it so secure cookies work
  app.set('trust proxy', 1)

  /**
   * CORS allow-list
   * - Put your production FE origin(s) into env.CORS_ORIGINS as a comma-separated list
   *   e.g. "https://collaborative-task-manager-psi.vercel.app,https://your-domain.com"
   * - We also accept any *.vercel.app preview by default (useful while iterating).
   */
  const allowlist = (env.CORS_ORIGINS || env.CLIENT_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const corsMw = cors({
    origin(origin, cb) {
      // Allow server-to-server / curl / health (no Origin header)
      if (!origin) return cb(null, true)

      if (allowlist.includes(origin)) return cb(null, true)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true)

      cb(new Error(`Not allowed by CORS: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // CORS must be before routes; include explicit preflight handler
  app.use(corsMw)
  app.options('*', corsMw)

  // Core middleware
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use(morgan('dev'))

  // Attach user if token exists (reads JWT from cookie or header)
  app.use(attachUserIfPresent)

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }))

  // Routers
  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/tasks', taskRouter)
  app.use('/api/v1/notifications', notificationRouter)
  app.use('/api/v1/users', userRouter)

  // 404 (optional)
  app.use((_req, res) => res.status(404).json({ message: 'Not Found' }))

  // Error handler (Zod-aware + safe default)
  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const isZod = err?.issues && Array.isArray(err.issues)
      const status = err.status ?? (isZod ? 400 : 500)
      const payload: any = { message: err.message || 'Internal Server Error' }
      if (isZod) payload.issues = err.issues
      res.status(status).json(payload)
    }
  )

  return app
}
