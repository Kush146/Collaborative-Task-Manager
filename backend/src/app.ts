import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { router as authRouter } from './modules/auth/auth.controller.js';
import { router as taskRouter } from './modules/task/task.controller.js';
import { router as notificationRouter } from './modules/notification/notification.controller.js';
import { attachUserIfPresent } from './middleware/auth.js';   // ✅ added import
import { router as userRouter } from './modules/user/user.controller.js';


export const createApp = () => {
  const app = express();

  // Middleware setup
  app.use(cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan('dev'));

  // ✅ attach user if token exists (reads JWT from cookie or header)
  app.use(attachUserIfPresent);

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/tasks', taskRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/users', userRouter);
  // Error handler
  // backend/src/app.ts  (your existing file: just replace the error handler)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isZod = err?.issues && Array.isArray(err.issues)
  const status = err.status ?? (isZod ? 400 : 500)
  const payload: any = { message: err.message || 'Internal Server Error' }
  if (isZod) payload.issues = err.issues
  res.status(status).json(payload)})


  return app;
};
