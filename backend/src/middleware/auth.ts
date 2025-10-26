import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Middleware to require authentication.
 * Verifies the JWT from cookies and attaches `req.userId` and `req.user`.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId?: string; sub?: string }

    // ✅ normalize the user id (handle both `userId` and `sub` fields)
    const uid = payload.userId || payload.sub
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' })

    ;(req as any).userId = uid
    ;(req as any).user = { id: uid }

    next()
  } catch (err) {
    console.error('Auth verification error:', err)
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

/**
 * Middleware to optionally attach the user (no rejection if invalid).
 * Useful for routes that work both logged in and logged out.
 */
export const attachUserIfPresent = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token
  if (!token) return next()

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId?: string; sub?: string }
    const uid = payload.userId || payload.sub
    if (uid) {
      ;(req as any).userId = uid
      ;(req as any).user = { id: uid }
    }
  } catch (err) {
    // Silently ignore invalid/expired token
  }

  next()
}
