import { Request, Response } from 'express';
import { Skill } from '../models/Skill';
import { createSkillSchema, updateSkillSchema } from '../validators/skill.validator';

export const getSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const skills = await Skill.find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ name: 1 });

    res.status(200).json({ skills });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const searchSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    const skills = await Skill.find({
      isActive: true,
      name: { $regex: q.trim(), $options: 'i' },
    })
      .populate('category', 'name slug')
      .sort({ name: 1 })
      .limit(20);

    res.status(200).json({ skills });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const createSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = createSkillSchema.safeParse(req.body);

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

    const { name, category } = result.data;
    const existingSkill = await Skill.findOne({ name });
    if (existingSkill) {
      res.status(400).json({ message: 'Skill already exists' });
      return;
    }

    const skill = await Skill.create({ name, category });
    await skill.populate('category', 'name slug');

    res.status(201).json({
      message: 'Skill created successfully',
      skill,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = updateSkillSchema.safeParse(req.body);

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

    const { name, category, isActive } = result.data;

    const skill = await Skill.findById(id);
    if (!skill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    if (name !== undefined) skill.name = name;
    if (category !== undefined) skill.category = category;
    if (isActive !== undefined) skill.isActive = isActive;

    await skill.save();

    await skill.populate('category', 'name slug');

    res.status(200).json({ message: 'Skill updated successfully', skill });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);
    if (!skill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    await Skill.findByIdAndDelete(id);

    res.status(200).json({ message: 'Skill deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
