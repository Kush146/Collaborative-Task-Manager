import { Router } from 'express';
import createError from 'http-errors';
import { RegisterDto, LoginDto } from './dto.js';
import { createUser, findUserByEmail, comparePassword, signJwt } from './auth.service.js';
import { env } from '../../config/env.js';
import { prisma } from '../../utils/prisma.js';
import { UpdateProfileDto } from './dto.js';
import { attachUserIfPresent, requireAuth } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken'
import { userService } from './auth.service.js'
import bcrypt from 'bcryptjs'


export const router = Router();

router.use(attachUserIfPresent);

router.post('/register', async (req, res, next) => {
  try {
    const dto = RegisterDto.parse(req.body);
    const existing = await findUserByEmail(dto.email);
    if (existing) throw createError(409, 'Email already in use');
    const user = await createUser(dto.email, dto.name, dto.password);
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await userService.findByEmail(email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // ✅ sign correct payload
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' })

    // ✅ set HttpOnly cookie (the critical part)
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',                // 'none' if you use HTTPS + cross-origin
      secure: !!env.COOKIE_SECURE, // ensure it's boolean
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return res.json({ user })
  } catch (err) {
    console.error('POST /auth/login error:', err)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

router.post('/logout', async (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!env.COOKIE_SECURE, // ensure it's boolean

  })
  res.json({ ok: true })
})


router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as any
    // 👇 support multiple payload shapes (id | userId | sub)
    const userId: string | undefined = payload?.userId ?? payload?.id ?? payload?.sub
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const user = await userService.findById(userId)
    if (!user) {
      return res.status(401).json({ message: 'Session invalid' })
    }

    return res.json({ user })
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authenticated' })
    }
    console.error('GET /auth/me error:', err)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
})


router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const dto = UpdateProfileDto.parse(req.body);
    const userId = (req as any).userId as string;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: dto.name }
    });
    res.json({ id: updated.id, email: updated.email, name: updated.name });
  } catch (e) { next(e); }
});
