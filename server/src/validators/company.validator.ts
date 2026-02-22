import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(5000).optional(),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  website: z.string().url('Invalid website URL').or(z.literal('')).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  headquarters: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
    })
    .optional(),
  locations: z
    .array(
      z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url().or(z.literal('')).optional(),
      twitter: z.string().url().or(z.literal('')).optional(),
      facebook: z.string().url().or(z.literal('')).optional(),
      instagram: z.string().url().or(z.literal('')).optional(),
    })
    .optional(),
  benefits: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();
