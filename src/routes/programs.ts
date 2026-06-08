import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { updateProgramSchema, patchStatusSchema } from '../schemas/program';

const router = Router();

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const programs = await prisma.program.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(programs);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const program = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!program) {
    res.status(404).json({ message: 'Program tidak ditemukan' });
    return;
  }
  res.json(program);
}));

router.put('/:id', requireAuth, validate(updateProgramSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Program tidak ditemukan' });
    return;
  }

  const program = await prisma.program.update({ where: { id: req.params.id }, data: req.body });
  res.json(program);
}));

router.patch('/:id/status', requireAuth, validate(patchStatusSchema), asyncHandler(async (req: Request, res: Response) => {
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
}));

export default router;
