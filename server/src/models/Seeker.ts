import { Schema, model, models } from 'mongoose';
import { ISeeker } from '../types/seeker.types';

const seekerProfileSchema = new Schema<ISeeker>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      maxlength: 150,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    skills: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    customSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    experience: [
      {
        jobTitle: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: { type: String, maxlength: 1000 },
      },
    ],
    education: [
      {
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        fieldOfStudy: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        grade: { type: String },
      },
    ],
    certifications: [
      {
        name: { type: String, required: true },
        issuingOrganization: { type: String, required: true },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        credentialUrl: { type: String },
      },
    ],
    languages: [
      {
        language: { type: String, required: true },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'native'],
        },
      },
    ],
    resume: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      originalName: { type: String, default: '' },
      uploadedAt: { type: Date },
    },
    portfolio: {
      type: String,
      default: '',
    },
    socialLinks: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    preferredJobType: [
      {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'remote'],
      },
    ],
    expectedSalary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
    },
    totalExperienceYears: {
      type: Number,
      default: 0,
    },
    availability: {
      type: String,
      enum: ['immediate', '1-week', '2-weeks', '1-month', 'more-than-1-month'],
      default: 'immediate',
    },
    isProfilePublic: {
      type: Boolean,
      default: true,
    },
    profileCompletionPercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const SeekerProfile =
  models.SeekerProfile || model<ISeeker>('SeekerProfile', seekerProfileSchema);
