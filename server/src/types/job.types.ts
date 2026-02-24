import { Types } from 'mongoose';

type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance' | 'temporary';

type WorkMode = 'onsite' | 'remote' | 'hybrid';

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

interface IExperienceYears {
  min: number;
  max: number;
}

interface ISalary {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
  isNegotiable: boolean;
  showSalary: boolean;
}

interface ILocation {
  city: string;
  state: string;
  country: string;
}

type Status = 'draft' | 'pending' | 'active' | 'paused' | 'closed' | 'rejected';

type ApplicationMethod = 'internal' | 'external';

export interface IJob {
  recruiter: Types.ObjectId;
  company: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  category: Types.ObjectId;
  skills: Types.ObjectId[];
  jobType: JobType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  experienceYears: IExperienceYears;
  salary: ISalary;
  location: ILocation;
  benefits: string[];
  numberOfOpenings: number;
  applicationDeadline: Date;
  status: Status;
  adminRemarks: string;
  isFeatured: boolean;
  isUrgent: boolean;
  totalApplications: number;
  views: number;
  tags: string[];
  applicationMethod: ApplicationMethod;
  externalApplicationUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
