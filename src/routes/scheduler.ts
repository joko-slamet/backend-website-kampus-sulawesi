import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { reloadScheduler, runNow } from '../lib/scheduler';

const router = Router();

const updateSchema = z.object({
  enabled: z.boolean(),
  times: z
    .array(z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'))
    .min(1, 'Minimal 1 jadwal')
    .max(10, 'Maksimal 10 jadwal'),
});

// GET /api/scheduler — ambil konfigurasi
router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  let config = await prisma.schedulerConfig.findUnique({ where: { id: 'default' } });
  if (!config) {
    config = await prisma.schedulerConfig.create({
      data: { id: 'default', enabled: true, times: ['06:00', '12:00', '18:00'] },
    });
  }
  res.json({ enabled: config.enabled, times: config.times });
});

// PUT /api/scheduler — update konfigurasi
router.put('/', requireAuth, validate(updateSchema), async (req: Request, res: Response): Promise<void> => {
  const { enabled, times } = req.body as { enabled: boolean; times: string[] };

  const config = await prisma.schedulerConfig.upsert({
    where: { id: 'default' },
    update: { enabled, times },
    create: { id: 'default', enabled, times },
  });

  reloadScheduler(config.enabled, config.times);

  res.json({ enabled: config.enabled, times: config.times });
});

// POST /api/scheduler/run — jalankan generate sekarang
router.post('/run', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Generate dimulai' });
  // Jalankan di background agar response tidak menunggu
  runNow().catch(err => console.error('[scheduler/run]', err));
});

export default router;
