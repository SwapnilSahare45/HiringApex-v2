import { z } from 'zod';

const jobBaseSchema = z.object({
  company: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid company ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title must be at most 150 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(10000, 'Description must be at most 10000 characters'),
  requirements: z.array(z.string().trim()).optional(),
  responsibilities: z.array(z.string().trim()).optional(),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID'),
  skills: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid skill ID')).optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary']),
  workMode: z.enum(['onsite', 'remote', 'hybrid']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
  experienceYears: z
    .object({
      min: z.number().min(0).default(0),
      max: z.number().min(0).default(0),
    })
    .refine((data) => data.max >= data.min, {
      message: 'Max experience must be greater than or equal to min experience',
    })
    .optional(),
  salary: z
    .object({
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
      currency: z.string().default('INR'),
      period: z.enum(['hourly', 'monthly', 'yearly']).default('yearly'),
      isNegotiable: z.boolean().default(false),
      showSalary: z.boolean().default(true),
    })
    .refine(
      (data) => {
        if (data?.min !== undefined && data?.max !== undefined) {
          return data.max >= data.min;
        }
        return true;
      },
      { message: 'Max salary must be greater than or equal to min salary' }
    )
    .optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
  }),
  benefits: z.array(z.string().trim()).optional(),
  numberOfOpenings: z.number().min(1, 'At least one opening is required').default(1),
  applicationDeadline: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Application deadline must be in the future',
  }),
  status: z.enum(['draft', 'pending', 'active', 'paused', 'closed', 'rejected']).default('pending'),
  isUrgent: z.boolean().default(false),
  tags: z.array(z.string().trim()).optional(),
  applicationMethod: z.enum(['internal', 'external']).default('internal'),
  externalApplicationUrl: z
    .string()
    .url('Invalid external application URL')
    .or(z.literal(''))
    .optional(),
});

export const createJobSchema = jobBaseSchema.refine(
  (data) => {
    if (data.applicationMethod === 'external' && !data.externalApplicationUrl) {
      return false;
    }
    return true;
  },
  {
    message: 'External application URL is required when application method is external',
    path: ['externalApplicationUrl'],
  }
);

export const updateJobSchema = jobBaseSchema
  .omit({ company: true })
  .partial()
  .refine(
    (data) => {
      if (data.applicationMethod === 'external' && !data.externalApplicationUrl) {
        return false;
      }
      return true;
    },
    {
      message: 'External application URL is required when application method is external',
      path: ['externalApplicationUrl'],
    }
  );
