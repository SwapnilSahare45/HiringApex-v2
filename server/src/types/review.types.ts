import { Types } from 'mongoose';

type EmploymentStatus = 'current' | 'former' | 'interviewing';

export interface IReview {
  company: Types.ObjectId;
  seeker: Types.ObjectId;
  rating: number;
  title: string;
  pros: string;
  cons: string;
  review: string;
  employmentStatus: EmploymentStatus;
  jobTitle: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
