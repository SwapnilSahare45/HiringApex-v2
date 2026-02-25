import { model, models, Schema } from 'mongoose';
import { IApplication } from '../types/application.types';

const applicationSchema = new Schema<IApplication>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    seeker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    resume: {
      url: { type: String, required: true },
      originalName: { type: String },
    },
    coverLetter: {
      type: String,
      maxlength: 3000,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'applied',
        'reviewed',
        'shortlisted',
        'interview',
        'offered',
        'hired',
        'rejected',
        'withdrawn',
      ],
      default: 'applied',
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String, default: '' },
      },
    ],
    interviewDetails: {
      date: Date,
      time: String,
      location: String,
      type: {
        type: String,
        enum: ['in-person', 'phone', 'video'],
      },
      meetingLink: String,
      notes: String,
    },
    recruiterNotes: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, seeker: 1 }, { unique: true });

export const Application =
  models.Application || model<IApplication>('Application', applicationSchema);
