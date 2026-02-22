// validators/category.validator.ts

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  isActive: z.boolean().optional(),
});
