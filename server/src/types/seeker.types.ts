import { Types } from 'mongoose';

export interface IExperience {
  _id?: Types.ObjectId;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
}

export interface IEducation {
  _id?: Types.ObjectId;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  grade?: string;
}

export interface ICertification {
  _id?: Types.ObjectId;
  name: string;
  issuingOrganization: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialUrl?: string;
}

export interface ILanguage {
  _id?: Types.ObjectId;
  language: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
}

export interface IResume {
  url: string;
  uploadedAt?: Date;
}

export interface ISocialLinks {
  linkedin: string;
  github: string;
  twitter: string;
  website: string;
}

export interface ILocation {
  city: string;
  state: string;
  country: string;
}

export interface IExpectedSalary {
  min?: number;
  max?: number;
  currency: string;
}

export type JobType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'internship'
  | 'freelance'
  | 'remote';
export type Availability = 'immediate' | '1-week' | '2-weeks' | '1-month' | 'more-than-1-month';

export interface ISeeker {
  user: Types.ObjectId;
  headline: string;
  bio: string;
  skills: Types.ObjectId;
  customSkills: string[];
  experience: IExperience[];
  education: IEducation[];
  certifications: ICertification[];
  languages: ILanguage[];
  resume: IResume;
  portfolio: string;
  socialLinks: ISocialLinks;
  location: ILocation;
  preferredJobType: JobType[];
  expectedSalary: IExpectedSalary;
  totalExperienceYears: number;
  availability: Availability;
  isProfilePublic: boolean;
  profileCompletionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}
