import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true });

    res.status(200).json(categories);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true });

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.status(200).json(category);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = createCategorySchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { name, description } = result.data;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.status(400).json({ message: 'Category already exists' });
      return;
    }

    const category = await Category.create({ name, description });

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = updateCategorySchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { name, description, isActive } = result.data;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
