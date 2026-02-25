import { Document, Types } from 'mongoose';

export type ApplicationStatus =
  | 'applied'
  | 'reviewed'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export type InterviewType = 'in-person' | 'phone' | 'video';

export interface IStatusHistory {
  status: ApplicationStatus;
  changedAt: Date;
  changedBy: Types.ObjectId;
  remarks: string;
}

export interface IInterviewDetails {
  date?: Date;
  time?: string;
  location?: string;
  type?: InterviewType;
  meetingLink?: string;
  notes?: string;
}

export interface IApplication extends Document {
  job: Types.ObjectId;
  seeker: Types.ObjectId;
  recruiter: Types.ObjectId;
  company: Types.ObjectId;
  resume: {
    url: string;
    originalName?: string;
  };
  coverLetter: string;
  status: ApplicationStatus;
  statusHistory: IStatusHistory[];
  interviewDetails: IInterviewDetails;
  recruiterNotes: string;
  rating?: number;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
