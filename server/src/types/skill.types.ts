import { Types } from 'mongoose';

export interface ISkill {
  name: string;
  slug: string;
  category: Types.ObjectId;
  isActive: boolean;
}
