import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/track', asyncHandler(async (req: Request, res: Response) => {
  const { page } = req.body as { page?: string };
  await prisma.whatsappClickLog.create({ data: { page: page ?? '/' } });
  res.json({ ok: true });
}));

router.get('/stats', requireAuth, asyncHandler(async (req: Request, res: Response) => {
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
}));

router.get('/daily', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };

  const defaultTo = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 29);

  const start = from ? new Date(from) : defaultFrom;
  const end = to ? new Date(to) : defaultTo;

  type DayRow = { day: string; count: bigint };
  const rows = await prisma.$queryRaw<DayRow[]>`
    SELECT
      TO_CHAR(("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Makassar'), 'YYYY-MM-DD') AS day,
      COUNT(*)::bigint AS count
    FROM "WhatsappClickLog"
    WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
    GROUP BY day
    ORDER BY day ASC
  `;

  res.json(rows.map(r => ({ day: r.day, count: Number(r.count) })));
}));

export default router;
