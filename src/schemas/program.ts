import { z } from 'zod';

export const updateProgramSchema = z.object({
  icon: z.string().optional(),
  badge: z.string().optional(),
  badgeColor: z.string().optional(),
  name: z.string().min(1).optional(),
  degree: z.string().min(1).optional(),
  accreditation: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  highlights: z.array(z.string()).optional(),
  color: z.string().optional(),
  bgGradient: z.string().optional(),
  alumni: z.string().optional(),
  status: z.enum(['aktif', 'nonaktif']).optional(),
});

export const patchStatusSchema = z.object({
  status: z.enum(['aktif', 'nonaktif']),
});

export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
