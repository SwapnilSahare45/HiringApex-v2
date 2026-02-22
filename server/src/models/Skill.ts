import { model, models, Schema } from 'mongoose';
import { ISkill } from '../types/skill.types';
import { generateSlug } from '../utils/slugify';

const skillsSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

skillsSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
  next();
});

export const Skill = models.Skill || model<ISkill>('Skill', skillsSchema);
