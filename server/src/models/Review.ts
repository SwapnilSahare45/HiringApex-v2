import { model, models, Schema } from 'mongoose';
import { IReview } from '../types/review.types';

const reviewSchema = new Schema<IReview>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    seeker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    pros: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    cons: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    review: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    employmentStatus: {
      type: String,
      enum: ['current', 'former', 'interviewing'],
      required: true,
    },
    jobTitle: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// prevent duplicate review
reviewSchema.index({ company: 1, seeker: 1 }, { unique: true });

export const Review = models.Review || model<IReview>('Review', reviewSchema);
