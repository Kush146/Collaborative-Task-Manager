// backend/src/modules/user/user.controller.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../utils/prisma.js';
import { UpdateMeDto } from './dto.js';

export const router = Router();

// PATCH /api/v1/users/me  -> update display name
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name } = UpdateMeDto.parse(req.body);
    const userId = (req as any).userId as string;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});
