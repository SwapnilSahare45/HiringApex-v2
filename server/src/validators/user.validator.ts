import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().max(50, 'First name must be at most 50 characters').optional(),
  lastName: z.string().max(50, 'Last name must be at most 50 characters').optional(),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits')
    .optional(),
});
