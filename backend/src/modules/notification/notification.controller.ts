import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../utils/prisma.js';

export const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ notifications });
});

router.patch('/:id/read', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true }
  });
  res.json({ notification: updated });
});
