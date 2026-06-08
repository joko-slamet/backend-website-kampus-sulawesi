import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createNewsSchema, updateNewsSchema } from '../schemas/news';
import { uploadNewsImage } from '../lib/upload';
import { generateNewsContent } from '../lib/openrouter';
import path from 'path';
import fs from 'fs';

const router = Router();

// Public: list news (published only unless ?all=true with bearer token)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { type, category, search, page = '1', limit = '20', all, sort } = req.query as Record<string, string>;

  const isAdmin = all === 'true' && req.headers.authorization?.startsWith('Bearer ');
  const where: Record<string, unknown> = isAdmin ? {} : { published: true };

  if (type && (type === 'news' || type === 'announcement')) where.type = type;
  if (category) where.category = category;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: sort === 'views'
        ? [{ pinned: 'desc' }, { views: 'desc' }]
        : [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: parseInt(limit),
    }),
    prisma.news.count({ where }),
  ]);

  res.json({ data: items, total, page: parseInt(page), limit: parseInt(limit) });
}));

// Admin: generate news content from title using AI
router.post('/generate', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { title, type } = req.body as { title?: string; type?: string };
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ message: 'Judul wajib diisi' });
    return;
  }
  const newsType: 'news' | 'announcement' = type === 'announcement' ? 'announcement' : 'news';
  const result = await generateNewsContent({ title: title.trim(), type: newsType });
  res.json(result);
}));

// Admin: upload image
router.post('/upload-image', requireAuth, (req: Request, res: Response): void => {
  uploadNewsImage(req, res, (err) => {
    if (err) { res.status(400).json({ message: err.message }); return; }
    if (!req.file) { res.status(400).json({ message: 'File gambar wajib diunggah' }); return; }
    res.status(201).json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
  });
});

// Admin: delete image file
router.delete('/upload-image/:filename', requireAuth, (req: Request, res: Response): void => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(process.cwd(), 'uploads', filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ message: 'File tidak ditemukan' }); return; }
  fs.unlinkSync(filePath);
  res.json({ message: 'Gambar berhasil dihapus' });
});

// Public: get single news item
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.news.findUnique({ where: { id: req.params.id } });
  if (!item) { res.status(404).json({ message: 'Berita tidak ditemukan' }); return; }
  await prisma.news.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
  res.json({ ...item, views: item.views + 1 });
}));

// Admin: create
router.post('/', requireAuth, validate(createNewsSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.news.findUnique({ where: { id: req.body.id } });
  if (existing) { res.status(409).json({ message: 'ID sudah digunakan' }); return; }
  const item = await prisma.news.create({ data: req.body });
  res.status(201).json(item);
}));

// Admin: update
router.put('/:id', requireAuth, validate(updateNewsSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.news.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ message: 'Berita tidak ditemukan' }); return; }
  const item = await prisma.news.update({ where: { id: req.params.id }, data: req.body });
  res.json(item);
}));

// Admin: delete
router.delete('/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.news.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ message: 'Berita tidak ditemukan' }); return; }

  await prisma.news.delete({ where: { id: req.params.id } });

  if (existing.image && existing.image.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), existing.image);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  res.json({ message: 'Berita berhasil dihapus' });
}));

export default router;
