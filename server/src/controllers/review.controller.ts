import { Request, Response } from 'express';
import { Company } from '../models/Company';
import { Review } from '../models/Review';
import { AuthRequest } from '../types/user.types';
import { createReviewSchema, updateReviewSchema } from '../validators/review.validator';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = createReviewSchema.safeParse(req.body);
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

    const seekerId = req.user?.id;
    const { company: companyId, ...rest } = result.data;

    const company = await Company.findById(companyId);
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    const existingReview = await Review.findOne({ company: companyId, seeker: seekerId });
    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this company' });
      return;
    }

    const review = await Review.create({
      ...rest,
      company: companyId,
      seeker: seekerId,
      isApproved: false,
    });

    res
      .status(201)
      .json({ message: 'Review submitted successfully and is pending approval', review });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getCompanyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { page = '1', limit = '15' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter = { company: companyId, isApproved: true, isActive: true };

    const [reviews, total, ratingStats] = await Promise.all([
      Review.find(filter)
        .populate('seeker', 'firstName lastName avatar')
        .select('-isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    res.status(200).json({
      reviews,
      ratingStats: ratingStats[0] ?? {
        averageRating: 0,
        totalReviews: 0,
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
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

export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '15' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter = { seeker: req.user?.id };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('company', 'name logo slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      reviews,
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

export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = updateReviewSchema.safeParse(req.body);
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

    const review = await Review.findOne({ _id: id, seeker: req.user?.id });
    if (!review) {
      res.status(404).json({ message: 'Review not found or you are not the reviewer' });
      return;
    }

    Object.assign(review, result.data);
    review.isApproved = false;
    await review.save();

    res
      .status(200)
      .json({ message: 'Review updated successfully and is pending re-approval', review });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
