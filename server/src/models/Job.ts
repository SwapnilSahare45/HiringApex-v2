import { model, models, Schema } from 'mongoose';
import { IJob } from '../types/job.types';
import { generateSlug } from '../utils/slugify';

const jobSchema = new Schema<IJob>(
  {
    recruiter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    skills: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary'],
      required: true,
    },
    workMode: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
      required: true,
    },
    experienceYears: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
      period: {
        type: String,
        enum: ['hourly', 'monthly', 'yearly'],
        default: 'yearly',
      },
      isNegotiable: { type: Boolean, default: false },
      showSalary: { type: Boolean, default: true },
    },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, required: true },
    },
    benefits: [{ type: String }],
    numberOfOpenings: {
      type: Number,
      default: 1,
      min: 1,
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'paused', 'closed', 'rejected'],
      default: 'pending',
    },
    adminRemarks: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    totalApplications: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [{ type: String, trim: true }],
    applicationMethod: {
      type: String,
      enum: ['internal', 'external'],
      default: 'internal',
    },
    externalApplicationUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = generateSlug(`${this.title}-${Date.now()}`);
  }
  next();
});

export const Job = models.Job || model<IJob>('Job', jobSchema);
