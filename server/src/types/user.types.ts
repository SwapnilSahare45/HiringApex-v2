import { Request } from 'express';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'seeker' | 'recruiter' | 'admin';
  avatar: { url: string; publicId: string };
  phone: string;
  isEmailVerified: boolean;
  otp: string;
  otpExpires: Date;
  otpVerificationToken: string;
  otpVerificationTokenExpires: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenParams {
  token: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
