import { model, models, Schema } from 'mongoose';
import { ISavedJob } from '../types/savedJob.types';

const savedJobSchema = new Schema<ISavedJob>(
  {
    seeker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate saves
savedJobSchema.index({ seeker: 1, job: 1 }, { unique: true });

export const SavedJob = models.SavedJob || model<ISavedJob>('SavedJob', savedJobSchema);
