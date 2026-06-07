import { z } from 'zod';

export const generateArticleSchema = z.object({
  topic: z.string().min(3).optional(),
  category: z.string().optional(),
});

export type GenerateArticleInput = z.infer<typeof generateArticleSchema>;

export const createArticleSchema = z.object({
  id: z.string().min(1),
  image: z.string().nullable().optional(),
  category: z.string().min(1),
  categoryColor: z.string().min(1),
  date: z.string().min(1),
  readTime: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  tag: z.string().nullable().optional(),
  tagColor: z.string().nullable().optional(),
  titleEn: z.string().min(1),
  excerptEn: z.string().min(1),
  published: z.boolean().optional(),
});

export const updateArticleSchema = createArticleSchema.partial().omit({ id: true });

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
