import { Types } from 'mongoose';

export interface ISavedJob {
  seeker: Types.ObjectId;
  job: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
