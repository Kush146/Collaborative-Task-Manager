// backend/src/modules/auth/cookies.ts
import type { CookieOptions } from 'express'
import { env } from '../../config/env.js'

// We’re behind a proxy on Render; app.set('trust proxy', 1) is already in app.ts

const isProd = process.env.NODE_ENV === 'production'

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd || !!env.COOKIE_SECURE, // true on Render
  sameSite: isProd ? 'none' : 'lax',     // 'none' is required for cross-site cookies
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7,       // 7 days
}
