import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { createProgramSchema, updateProgramSchema, patchStatusSchema } from '../schemas/program';

const router = Router();

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const programs = await prisma.program.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(programs);
}));

router.post('/', requireAuth, validate(createProgramSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.program.findUnique({ where: { id: req.body.id } });
  if (existing) {
    res.status(409).json({ message: 'ID program sudah digunakan' });
    return;
  }
  const program = await prisma.program.create({ data: req.body });
  res.status(201).json(program);
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

router.delete('/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Program tidak ditemukan' });
    return;
  }
  await prisma.program.delete({ where: { id: req.params.id } });
  res.json({ message: 'Program berhasil dihapus' });
}));

export default router;
