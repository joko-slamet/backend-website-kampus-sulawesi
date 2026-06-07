import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/track', async (req: Request, res: Response): Promise<void> => {
  const { page } = req.body as { page?: string };
  await prisma.whatsappClickLog.create({ data: { page: page ?? '/' } });
  res.json({ ok: true });
});

router.get('/stats', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query as { from?: string; to?: string };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dateFilter = from && to
    ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
    : {};

  const [total, last7Days, byPage] = await Promise.all([
    prisma.whatsappClickLog.count({ where: dateFilter }),
    prisma.whatsappClickLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.whatsappClickLog.groupBy({
      by: ['page'],
      _count: { id: true },
      where: dateFilter,
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  res.json({
    total,
    last7Days,
    byPage: byPage.map((p) => ({ page: p.page, count: p._count.id })),
  });
});

export default router;
