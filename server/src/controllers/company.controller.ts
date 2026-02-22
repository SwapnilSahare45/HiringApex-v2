import { Request, Response } from 'express';
import { Company } from '../models/Company';
import { AuthRequest } from '../types/user.types';
import { createCompanySchema, updateCompanySchema } from '../validators/company.validator';

// TODO: Company logo and cover image upload implementation
export const createCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = createCompanySchema.safeParse(req.body);

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

    const existingCompany = await Company.findOne({ recruiter: req.user?.id });
    if (existingCompany) {
      res.status(400).json({ message: 'You already have company' });
      return;
    }

    const company = await Company.create({
      ...result.data,
      recruiter: req.user?.id,
    });

    res.status(201).json({ message: 'Company created successfully', company });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { industry, companySize, isVerified, page = '1', limit = '10' } = req.query;

    const filter: Record<string, any> = { isActive: true };

    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (companySize) filter.companySize = companySize;
    if (isVerified) filter.isVerified = isVerified === 'true';

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .select('-logo.publicId -coverImage.publicId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Company.countDocuments(filter),
    ]);

    res.status(200).json({
      companies,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const company = await Company.findOne({ isVerified: true, isActive: true, slug }).select(
      '-logo.publicId -coverImage.publicId'
    );
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.status(200).json({ company });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getMyCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const company = await Company.findOne({ recruiter: req.user?.id });
    if (!company) {
      res.status(404).json({ message: 'You have not created a company yet' });
      return;
    }

    res.status(200).json({ company });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = updateCompanySchema.safeParse(req.body);
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

    const company = await Company.findOne({ _id: id, recruiter: req.user?.id });
    if (!company) {
      res.status(404).json({ message: 'Company not found or you are not the Admin' });
      return;
    }

    Object.assign(company, result.data);
    await company.save();

    res.status(200).json({ message: 'Company updated successfully', company });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    // TODO: Delete logo and cover image from cloudinary

    await Company.findByIdAndDelete(id);

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// TODO: Upload logo controller
// TODO: Upload cover image controller
// TODO: Get company jobs
