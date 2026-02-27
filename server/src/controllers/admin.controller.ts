import { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Company } from '../models/Company';
import { Job } from '../models/Job';
import { Review } from '../models/Review';
import { SavedJob } from '../models/SavedJob';
import { SeekerProfile } from '../models/Seeker';
import { User } from '../models/User';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalSeekers,
      totalRecruiters,
      totalJobs,
      activeJobs,
      totalApplications,
      totalCompanies,
      verifiedCompanies,
      pendingRecruiters,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seeker' }),
      User.countDocuments({ role: 'recruiter' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Application.countDocuments(),
      Company.countDocuments(),
      Company.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'recruiter', isApproved: false }),
    ]);

    // new registrations in last 30 days
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [newUsers, newJobs, newApplications] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: last30Days } }),
      Job.countDocuments({ createdAt: { $gte: last30Days } }),
      Application.countDocuments({ createdAt: { $gte: last30Days } }),
    ]);

    res.status(200).json({
      stats: {
        users: {
          total: totalUsers,
          seekers: totalSeekers,
          recruiters: totalRecruiters,
          pendingApproval: pendingRecruiters,
        },
        jobs: { total: totalJobs, active: activeJobs },
        applications: { total: totalApplications },
        companies: { total: totalCompanies, verified: verifiedCompanies },
        last30Days: { newUsers, newJobs, newApplications },
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

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, isEmailVerified, isApproved, keyword, page = '1', limit = '15' } = req.query;

    const filter: Record<string, any> = {};

    if (role) filter.role = role;
    if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified === 'true';
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (keyword) {
      filter.$or = [
        { firstName: { $regex: keyword, $options: 'i' } },
        { lastName: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          '-password -otp -otpExpires -otpVerificationToken -otpVerificationTokenExpires -passwordResetToken -passwordResetExpires'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      users,
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

export const getUserDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      '-password -otp -otpExpires -otpVerificationToken -otpVerificationTokenExpires -passwordResetToken -passwordResetExpires'
    );
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ message: 'isActive must be a boolean' });
      return;
    }

    const user = await User.findByIdAndUpdate(id, { $set: { isActive } }, { new: true }).select(
      '-password'
    );
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const approveRecruiter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role !== 'recruiter') {
      res.status(400).json({ message: 'User is not a recruiter' });
      return;
    }

    if (user.isApproved) {
      res.status(400).json({ message: 'Recruiter is already approved' });
      return;
    }

    user.isApproved = true;
    await user.save();

    res.status(200).json({ message: 'Recruiter approved successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // delete all related data
    // TODO: There is also other data which need to delete
    await Promise.all([
      User.findByIdAndDelete(id),
      SeekerProfile.deleteOne({ user: id }),
      Application.deleteMany({ seeker: id }),
      SavedJob.deleteMany({ seeker: id }),
      Job.deleteMany({ recruiter: id }),
    ]);

    res.status(200).json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, keyword, page = '1', limit = '15' } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (keyword) filter.title = { $regex: keyword, $options: 'i' };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name logo')
        .populate('category', 'name')
        .populate('recruiter', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(filter),
    ]);

    res.status(200).json({
      jobs,
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

export const getJobDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate('company', 'name logo slug')
      .populate('category', 'name slug')
      .populate('skills', 'name slug')
      .populate('recruiter', 'firstName lastName email');
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.status(200).json({ job });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const approveJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndUpdate(id, { $set: { status: 'active' } }, { new: true });
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.status(200).json({ message: 'Job approved successfully', job });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const rejectJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: { status: 'rejected', adminRemarks: remarks || '' } },
      { new: true }
    );
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.status(200).json({ message: 'Job rejected successfully', job });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const toggleFeaturedJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    job.isFeatured = !job.isFeatured;
    await job.save();

    res.status(200).json({
      message: `Job ${job.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      isFeatured: job.isFeatured,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // delete all related data
    // TODO: There is also other data which need to delete
    await Promise.all([
      Job.findByIdAndDelete(id),
      Application.deleteMany({ job: id }),
      SavedJob.deleteMany({ job: id }),
    ]);

    res.status(200).json({ message: 'Job and related data deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '15' } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('seeker', 'firstName lastName email')
        .populate('job', 'title slug')
        .populate('company', 'name logo')
        .select('-statusHistory -recruiterNotes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Application.countDocuments(filter),
    ]);

    res.status(200).json({
      applications,
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

export const getAllCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isVerified, keyword, page = '1', limit = '15' } = req.query;

    const filter: Record<string, any> = {};
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (keyword) filter.name = { $regex: keyword, $options: 'i' };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate('recruiter', 'firstName lastName email')
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

export const verifyCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    if (company.isVerified) {
      res.status(400).json({ message: 'Company is already verified' });
      return;
    }

    company.isVerified = true;
    await company.save();

    res.status(200).json({ message: 'Company verified successfully' });
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

    // delete related data
    // TODO: There is more related data which is need to delete
    await Promise.all([
      Company.findByIdAndDelete(id),
      Job.deleteMany({ company: id }),
      Application.deleteMany({ company: id }),
    ]);

    res.status(200).json({ message: 'Company and related data deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isApproved, keyword, page = '1', limit = '15' } = req.query;

    const filter: Record<string, any> = {};
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (keyword) filter.title = { $regex: keyword, $options: 'i' };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('company', 'name logo')
        .populate('seeker', 'firstName lastName email')
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

export const approveReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: { isApproved: true } },
      { new: true }
    );

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Update company average rating
    const stats = await Review.aggregate([
      { $match: { company: review.company, isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Company.findByIdAndUpdate(review.company, {
        $set: {
          averageRating: Math.round(stats[0].avg * 10) / 10,
          totalReviews: stats[0].total,
        },
      });
    }

    res.status(200).json({ message: 'Review approved successfully', review });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getOverviewReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalApplications,
      totalCompanies,
      applicationsByStatus,
      jobsByStatus,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Company.countDocuments(),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.status(200).json({
      overview: {
        totalUsers,
        totalJobs,
        totalApplications,
        totalCompanies,
        applicationsByStatus,
        jobsByStatus,
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

export const getJobsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          count: 1,
          category: { name: '$category.name', slug: '$category.slug' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ data });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
