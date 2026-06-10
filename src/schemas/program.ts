import { z } from 'zod';

const lecturerSchema = z.object({
  name: z.string().min(1),
  qualifications: z.string().default(''),
});

export const createProgramSchema = z.object({
  id: z.string().min(1),
  icon: z.string().default('🎓'),
  badge: z.string().default(''),
  badgeColor: z.string().default('#0f2d6b'),
  name: z.string().min(1),
  degree: z.string().min(1),
  degreeTitle: z.string().default(''),
  accreditation: z.string().min(1),
  description: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  careerPaths: z.array(z.string()).default([]),
  lecturers: z.array(lecturerSchema).default([]),
  color: z.string().default('#0f2d6b'),
  bgGradient: z.string().default('linear-gradient(135deg, #0f2d6b 0%, #1a4aad 100%)'),
  status: z.enum(['aktif', 'nonaktif']).default('aktif'),
});

export const updateProgramSchema = z.object({
  icon: z.string().optional(),
  badge: z.string().optional(),
  badgeColor: z.string().optional(),
  name: z.string().min(1).optional(),
  degree: z.string().min(1).optional(),
  degreeTitle: z.string().optional(),
  accreditation: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  highlights: z.array(z.string()).optional(),
  careerPaths: z.array(z.string()).optional(),
  lecturers: z.array(lecturerSchema).optional(),
  color: z.string().optional(),
  bgGradient: z.string().optional(),
  status: z.enum(['aktif', 'nonaktif']).optional(),
});

export const patchStatusSchema = z.object({
  status: z.enum(['aktif', 'nonaktif']),
});

export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
