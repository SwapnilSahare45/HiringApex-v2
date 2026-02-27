import { z } from 'zod';

export const createReviewSchema = z.object({
  company: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid company ID'),
  rating: z.number().min(1, 'Rating must be at lest 1').max(5, 'Rating must be at most 5'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be at most 100 characters')
    .trim(),
  pros: z.string().max(1000, 'Pros must be at most 1000 characters').optional(),
  cons: z.string().max(1000, 'Cons must be at most 1000 characters').optional(),
  review: z
    .string()
    .min(1, 'Review is required')
    .max(2000, 'Review must be at most 2000 characters'),
  employmentStatus: z.enum(['current', 'former', 'interviewing'], {
    message: 'Employment status must be current, former, or interviewing',
  }),
  jobTitle: z.string().max(100).optional(),
});

export const updateReviewSchema = createReviewSchema.omit({ company: true }).partial();
