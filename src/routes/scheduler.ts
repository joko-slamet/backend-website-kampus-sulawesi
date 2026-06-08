import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { reloadScheduler, runNow } from '../lib/scheduler';

const router = Router();

const updateSchema = z.object({
  enabled: z.boolean(),
  times: z
    .array(z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'))
    .min(1, 'Minimal 1 jadwal')
    .max(10, 'Maksimal 10 jadwal'),
});

router.get('/', requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  let config = await prisma.schedulerConfig.findUnique({ where: { id: 'default' } });
  if (!config) {
    config = await prisma.schedulerConfig.create({
      data: { id: 'default', enabled: true, times: ['06:00', '12:00', '18:00'] },
    });
  }
  res.json({ enabled: config.enabled, times: config.times });
}));

router.put('/', requireAuth, validate(updateSchema), asyncHandler(async (req: Request, res: Response) => {
  const { enabled, times } = req.body as { enabled: boolean; times: string[] };

  const config = await prisma.schedulerConfig.upsert({
    where: { id: 'default' },
    update: { enabled, times },
    create: { id: 'default', enabled, times },
  });

  reloadScheduler(config.enabled, config.times);

  res.json({ enabled: config.enabled, times: config.times });
}));

// Response dikirim duluan, generate jalan di background
router.post('/run', requireAuth, (_req: Request, res: Response) => {
  res.json({ message: 'Generate dimulai' });
  runNow().catch(err => console.error('[scheduler/run]', err));
});

export default router;
