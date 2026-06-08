import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createArticleSchema, updateArticleSchema, generateArticleSchema } from '../schemas/article';
import { generateArticle } from '../lib/openrouter';
import { uploadArticleImage } from '../lib/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

// Public: list articles (published only), or all articles for authenticated dashboard requests (?all=true)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, search, page = '1', limit = '20', all } = req.query as Record<string, string>;

  const isAdmin = all === 'true' && req.headers.authorization?.startsWith('Bearer ');
  const where: Record<string, unknown> = isAdmin ? {} : { published: true };

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
}));

// Admin: upload article image
router.post('/upload-image', requireAuth, (req: Request, res: Response): void => {
  uploadArticleImage(req, res, (err) => {
    if (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'File gambar wajib diunggah' });
      return;
    }

    res.status(201).json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
  });
});

// Admin: delete article image
router.delete('/upload-image/:filename', requireAuth, (req: Request, res: Response): void => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(process.cwd(), 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: 'File tidak ditemukan' });
    return;
  }

  fs.unlinkSync(filePath);
  res.json({ message: 'Gambar berhasil dihapus' });
});

// Admin: auto-generate article content using AI
router.post('/generate', requireAuth, validate(generateArticleSchema), asyncHandler(async (req: Request, res: Response) => {
  const { topic, category } = req.body as { topic?: string; category?: string };

  const generated = await generateArticle({ topic, category });

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const base = (topic ?? generated.title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  const id = `${base}-${Date.now()}`;

  const article = await prisma.article.create({
    data: {
      id,
      image: generated.image ?? null,
      title: generated.title,
      excerpt: generated.excerpt,
      titleEn: generated.titleEn,
      excerptEn: generated.excerptEn,
      content: generated.content || undefined,
      contentEn: generated.contentEn || undefined,
      category: generated.category,
      categoryColor: generated.categoryColor,
      tag: generated.tag || null,
      tagColor: generated.tagColor || null,
      readTime: generated.readTime,
      date: dateStr,
      published: false,
    },
  });

  res.status(201).json(article);
}));

// Public: get single article
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const article = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!article) {
    res.status(404).json({ message: 'Artikel tidak ditemukan' });
    return;
  }
  // increment views
  await prisma.article.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
  res.json({ ...article, views: article.views + 1 });
}));

// Admin: create article
router.post('/', requireAuth, validate(createArticleSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { id: req.body.id } });
  if (existing) {
    res.status(409).json({ message: 'ID artikel sudah digunakan' });
    return;
  }

  const article = await prisma.article.create({ data: req.body });
  res.status(201).json(article);
}));

// Admin: update article
router.put('/:id', requireAuth, validate(updateArticleSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Artikel tidak ditemukan' });
    return;
  }

  const article = await prisma.article.update({ where: { id: req.params.id }, data: req.body });
  res.json(article);
}));

// Admin: delete article
router.delete('/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Artikel tidak ditemukan' });
    return;
  }

  await prisma.article.delete({ where: { id: req.params.id } });
  res.json({ message: 'Artikel berhasil dihapus' });
}));

export default router;
