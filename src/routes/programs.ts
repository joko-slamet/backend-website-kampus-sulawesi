import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProgramSchema, patchStatusSchema } from '../schemas/program';

const router = Router();

// Public: list all programs
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const programs = await prisma.program.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(programs);
});

// Public: get single program
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const program = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!program) {
    res.status(404).json({ message: 'Program tidak ditemukan' });
    return;
  }
  res.json(program);
});

// Admin: update program details
router.put('/:id', requireAuth, validate(updateProgramSchema), async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Program tidak ditemukan' });
    return;
  }

  const program = await prisma.program.update({ where: { id: req.params.id }, data: req.body });
  res.json(program);
});

// Admin: toggle status
router.patch('/:id/status', requireAuth, validate(patchStatusSchema), async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Program tidak ditemukan' });
    return;
  }

  const program = await prisma.program.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.json(program);
});

export default router;
