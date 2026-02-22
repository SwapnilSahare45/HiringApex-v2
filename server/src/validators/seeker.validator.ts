import { z } from 'zod';

export const experienceSchema = z
  .object({
    jobTitle: z.string().min(1, 'Job title is required'),
    company: z.string().min(1, 'Company is required'),
    location: z.string().optional(),
    startDate: z.coerce.date({ error: 'Start date is required' }),
    endDate: z
      .union([z.coerce.date(), z.literal(''), z.null()])
      .optional()
      .transform((val) => {
        if (val === '' || val === null) return undefined;
        return val;
      }),
    isCurrent: z.boolean().default(false),
    description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  })
  .refine(
    (data) => {
      if (data.isCurrent) return true;
      return !!data.endDate;
    },
    {
      message: 'End date is required when not current, and must be empty when current',
      path: ['endDate'],
    }
  );

export const educationSchema = z
  .object({
    degree: z.string().min(1, 'Degree is required'),
    institution: z.string().min(1, 'Institution is required'),
    fieldOfStudy: z.string().optional(),
    startDate: z.coerce.date({ error: 'Start date is required' }),
    endDate: z
      .union([z.coerce.date(), z.literal(''), z.null()])
      .optional()
      .transform((val) => {
        if (val === '' || val === null) return undefined;
        return val;
      }),
    isCurrent: z.boolean().default(false),
    grade: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isCurrent) return true;
      return !!data.endDate;
    },
    {
      message: 'End date is required when not current, and must be empty when current',
      path: ['endDate'],
    }
  );

export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuingOrganization: z.string().min(1, 'Issuing organization is required'),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  credentialUrl: z.string().url('Invalid credential URL').optional(),
});

export const languageSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'native']),
});

// TODO: Update resume schema
export const resumeSchema = z.object({
  url: z.string().url('Invalid resume URL').optional(),
  uploadedAt: z.coerce.date().optional(),
});

export const socialLinksSchema = z.object({
  linkedin: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  github: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
  twitter: z.string().url('Invalid Twitter URL').or(z.literal('')).optional(),
  website: z.string().url('Invalid website URL').or(z.literal('')).optional(),
});

export const locationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export const expectedSalarySchema = z
  .object({
    min: z.number().nonnegative('Minimum salary must be non-negative').optional(),
    max: z.number().nonnegative('Maximum salary must be non-negative').optional(),
    currency: z.string().default('INR'),
  })
  .refine(
    (data) => {
      if (data.min !== undefined && data.max !== undefined) {
        return data.max >= data.min;
      }
      return true;
    },
    { message: 'Maximum salary must be greater than or equal to minimum salary' }
  );

export const seekerProfileUpdateSchema = z.object({
  headline: z.string().max(150, 'Headline must be at most 150 characters').optional(),
  bio: z.string().max(2000, 'Bio must be at most 2000 characters').optional(),
  skills: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid skill ID')).optional(),
  customSkills: z.array(z.string().trim()).optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  resume: resumeSchema.optional(),
  portfolio: z.string().url('Invalid portfolio URL').or(z.literal('')).optional(),
  socialLinks: socialLinksSchema.optional(),
  location: locationSchema.optional(),
  preferredJobType: z
    .array(z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance', 'remote']))
    .optional(),
  expectedSalary: expectedSalarySchema.optional(),
  totalExperienceYears: z.number().nonnegative('Experience years must be non-negative').optional(),
  availability: z
    .enum(['immediate', '1-week', '2-weeks', '1-month', 'more-than-1-month'])
    .optional(),
  isProfilePublic: z.boolean().optional(),
});
