import { z } from 'zod';

export const createNewsSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['news', 'announcement']),
  title: z.string().min(1),
  image: z.string().nullable().optional(),
  content: z.string().optional(),
  category: z.string().min(1),
  tag: z.string().nullable().optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
});

export const updateNewsSchema = createNewsSchema.partial().omit({ id: true });

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
