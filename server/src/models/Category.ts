import { model, models, Schema } from 'mongoose';
import { ICategory } from '../types/category.types';
import { generateSlug } from '../utils/slugify';

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    jobCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
  next();
});

export const Category = models.Category || model<ICategory>('Category', categorySchema);
