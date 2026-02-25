import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createApplicationSchema = z.object({
  job: z.string().regex(objectIdRegex, 'Invalid job ID'),
  resume: z.object({
    url: z.string().url('Invalid resume URL'),
    originalName: z.string().optional(),
  }),
  coverLetter: z.string().max(3000, 'Cover letter must be at most 3000 characters').optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'applied',
    'reviewed',
    'shortlisted',
    'interview',
    'offered',
    'hired',
    'rejected',
  ]),
  remarks: z.string().max(500, 'Remarks must be at most 500 characters').optional(),
});

export const recruiterFeedbackSchema = z.object({
  recruiterNotes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
});

export const interviewDetailsSchema = z
  .object({
    date: z.coerce.date().refine((date) => date > new Date(), {
      message: 'Interview date must be in the future',
    }),
    time: z.string().min(1, 'Time is required'),
    location: z.string().optional(),
    type: z.enum(['in-person', 'phone', 'video']),
    meetingLink: z.string().url('Invalid meeting link').or(z.literal('')).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'video' && !data.meetingLink) {
        return false;
      }
      return true;
    },
    {
      message: 'Meeting link is required for video interviews',
      path: ['meetingLink'],
    }
  );
