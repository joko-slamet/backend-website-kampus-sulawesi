import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createArticleSchema, updateArticleSchema } from '../schemas/article';

const router = Router();

// Public: list all published articles
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { category, search, page = '1', limit = '20' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { published: true };

  if (category && category !== 'Semua') {
    where.category = category;
  }
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.article.count({ where }),
  ]);

  res.json({ data: articles, total, page: parseInt(page), limit: parseInt(limit) });
});

// Public: get single article
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const article = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!article) {
    res.status(404).json({ message: 'Artikel tidak ditemukan' });
    return;
  }
  // increment views
  await prisma.article.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
  res.json({ ...article, views: article.views + 1 });
});

// Admin: create article
router.post('/', requireAuth, validate(createArticleSchema), async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.article.findUnique({ where: { id: req.body.id } });
  if (existing) {
    res.status(409).json({ message: 'ID artikel sudah digunakan' });
    return;
  }

  const article = await prisma.article.create({ data: req.body });
  res.status(201).json(article);
});

// Admin: update article
router.put('/:id', requireAuth, validate(updateArticleSchema), async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Artikel tidak ditemukan' });
    return;
  }

  const article = await prisma.article.update({ where: { id: req.params.id }, data: req.body });
  res.json(article);
});

// Admin: delete article
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Artikel tidak ditemukan' });
    return;
  }

  await prisma.article.delete({ where: { id: req.params.id } });
  res.json({ message: 'Artikel berhasil dihapus' });
});

export default router;
