import { Router, type CookieOptions } from 'express'
import createError from 'http-errors'
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto.js'
import { createUser, findUserByEmail, comparePassword, signJwt, userService } from './auth.service.js'
import { env } from '../../config/env.js'
import { prisma } from '../../utils/prisma.js'
import { attachUserIfPresent, requireAuth } from '../../middleware/auth.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const router = Router()

router.use(attachUserIfPresent)

/** Cookie options shared by login/register/logout */
const isProd = process.env.NODE_ENV === 'production'
const weekMs = 1000 * 60 * 60 * 24 * 7

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd || !!env.COOKIE_SECURE, // true on Render
  sameSite: isProd ? 'none' : 'lax',     // cross-site cookie in production
  path: '/',
  maxAge: weekMs,
}

/** POST /auth/register */
router.post('/register', async (req, res, next) => {
  try {
    const dto = RegisterDto.parse(req.body)

    const existing = await findUserByEmail(dto.email)
    if (existing) throw createError(409, 'Email already in use')

    const user = await createUser(dto.email, dto.name, dto.password)

    // issue jwt & set cookie
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' })
    res.cookie('token', token, authCookieOptions)

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (e) {
    next(e)
  }
})

/** POST /auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginDto.parse(req.body)

    const user = await userService.findByEmail(email)
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' })
    res.cookie('token', token, authCookieOptions)

    return res.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    console.error('POST /auth/login error:', err)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

/** POST /auth/logout */
router.post('/logout', async (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: authCookieOptions.secure,
    sameSite: authCookieOptions.sameSite,
    path: authCookieOptions.path,
  })
  res.json({ ok: true })
})

/** GET /auth/me */
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined)
    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const payload = jwt.verify(token, env.JWT_SECRET) as any
    const userId: string | undefined = payload?.userId ?? payload?.id ?? payload?.sub
    if (!userId) return res.status(401).json({ message: 'Not authenticated' })

    const user = await userService.findById(userId)
    if (!user) return res.status(401).json({ message: 'Session invalid' })

    return res.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authenticated' })
    }
    console.error('GET /auth/me error:', err)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
})

/** PATCH /auth/profile */
router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const dto = UpdateProfileDto.parse(req.body)
    const userId = (req as any).userId as string
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
    })
    res.json({ user: { id: updated.id, email: updated.email, name: updated.name } })
  } catch (e) {
    next(e)
  }
})
