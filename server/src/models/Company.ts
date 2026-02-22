import { model, models, Schema } from 'mongoose';
import { ICompany } from '../types/company.types';
import { generateSlug } from '../utils/slugify';

const companySchema = new Schema<ICompany>(
  {
    recruiter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    industry: {
      type: String,
      required: true,
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '1-10',
    },
    foundedYear: {
      type: Number,
    },
    website: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    headquarters: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    locations: [
      {
        city: String,
        state: String,
        country: String,
      },
    ],
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    benefits: [
      {
        type: String,
      },
    ],
    techStack: [
      {
        type: String,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

companySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
  next();
});

export const Company = models.Company || model<ICompany>('Company', companySchema);
