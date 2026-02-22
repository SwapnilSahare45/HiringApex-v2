import { z } from 'zod';

export const createSkillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters').trim(),
  category: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid category ID')
    .optional(),
});

export const updateSkillSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be at most 50 characters')
    .trim()
    .optional(),
  category: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid category ID')
    .optional(),
  isActive: z.boolean().optional(),
});
