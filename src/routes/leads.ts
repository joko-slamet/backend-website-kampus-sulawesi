import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public: submit inquiry
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, program, school, message } = req.body as {
      name?: string; phone?: string; program?: string; school?: string; message?: string;
    };
    if (!name?.trim() || !phone?.trim()) {
      res.status(400).json({ message: 'Nama dan nomor HP wajib diisi' });
      return;
    }
    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        program: program?.trim() || null,
        school: school?.trim() || null,
        message: message?.trim() || null,
      },
    });
    res.json({ ok: true, id: lead.id });
  } catch (err) {
    next(err);
  }
});

// Admin: daily leads chart data
router.get('/daily', requireAuth, async (req, res, next) => {
  try {
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
      FROM "Lead"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY day
      ORDER BY day ASC
    `;
    res.json(rows.map(r => ({ day: r.day, count: Number(r.count) })));
  } catch (err) {
    next(err);
  }
});

// Admin: list all leads
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count(),
    ]);
    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

export default router;
