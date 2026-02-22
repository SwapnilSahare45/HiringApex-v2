import { Types } from 'mongoose';

export interface ICompanyLogo {
  url: string;
  publicId: string;
}

export interface IHeadquarters {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface ILocation {
  city: string;
  state: string;
  country: string;
}

export interface ICompanySocialLinks {
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
}

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';

export interface ICompany {
  recruiter: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  logo: ICompanyLogo;
  coverImage: ICompanyLogo;
  industry: string;
  companySize: CompanySize;
  foundedYear?: number;
  website: string;
  email: string;
  phone: string;
  headquarters: IHeadquarters;
  locations: ILocation[];
  socialLinks: ICompanySocialLinks;
  benefits: string[];
  techStack: string[];
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  totalJobs: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
