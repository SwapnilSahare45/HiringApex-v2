import { Request, Response } from 'express';
import { Company } from '../models/Company';
import { Job } from '../models/Job';
import { AuthRequest } from '../types/user.types';
import { createJobSchema, updateJobSchema } from '../validators/job.validator';

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = createJobSchema.safeParse(req.body);
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

    const company = await Company.findById(result.data.company).select('recruiter');
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    const isOwner = company.recruiter.toString() === req.user?.id;
    if (!isOwner) {
      res.status(403).json({ message: 'You do not belong to this company' });
      return;
    }

    const job = await Job.create({
      ...result.data,
      recruiter: req.user?.id,
    });

    res.status(201).json({
      message: 'Job created successfully',
      job,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      keyword,
      category,
      skills,
      jobType,
      workMode,
      experienceLevel,
      minSalary,
      maxSalary,
      country,
      city,
      isUrgent,
      page = '1',
      limit = '15',
    } = req.query;

    const filter: Record<string, any> = { status: 'active' };

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $elemMatch: { $regex: keyword, $options: 'i' } } },
      ];
    }

    if (category) filter.category = category;
    if (jobType) filter.jobType = jobType;
    if (workMode) filter.workMode = workMode;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (isUrgent) filter.isUrgent = isUrgent === 'true';
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (country) filter['location.country'] = { $regex: country, $options: 'i' };

    if (skills) {
      const skillsArray = (skills as string).split(',');
      filter.skills = { $in: skillsArray };
    }

    if (minSalary || maxSalary) {
      filter['salary.showSalary'] = true;
      if (minSalary) filter['salary.min'] = { $gte: Number(minSalary) };
      if (maxSalary) filter['salary.max'] = { $lte: Number(maxSalary) };
    }

    filter.applicationDeadline = { $gte: new Date() };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name logo slug')
        .populate('category', 'name slug')
        .populate('skills', 'name slug')
        .select('-recruiter')
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

export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ _id: id, status: 'active' })
      .populate('company', 'name logo slug location')
      .populate('category', 'name slug')
      .populate('skills', 'name slug')
      .select('-recruiter');
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    await Job.findByIdAndUpdate(job._id, { $inc: { views: 1 } });

    res.status(200).json({ job });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = updateJobSchema.safeParse(req.body);
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

    const job = await Job.findOne({ _id: id, recruiter: req.user?.id });
    if (!job) {
      res.status(404).json({ message: 'Job not found or you are not the owner' });
      return;
    }

    Object.assign(job, result.data);
    await job.save();

    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ _id: id });
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    await Job.findByIdAndDelete(id);

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getMyJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '15' } = req.query;

    const filter: Record<string, any> = { recruiter: req.user?.id };
    if (status) filter.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = Math.ceil(pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      await Job.find(filter)
        .populate('company', 'name logo')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      await Job.countDocuments(filter),
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

export const updateJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'paused', 'closed', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    job.status = status;
    await job.save();

    res.status(200).json({ message: 'Job status updated successfully', status: job.status });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getFeaturedJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({
      status: 'active',
      isFeatured: true,
      applicationDeadline: { $gte: new Date() },
    })
      .populate('company', 'name logo slug')
      .populate('category', 'name slug')
      .populate('skills', 'name slug')
      .select('-recruiter')
      .sort({ createdAr: -1 })
      .limit(15);

    res.status(200).json({ jobs });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getLatestJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '15' } = req.params;

    const jobs = await Job.find({
      status: 'active',
      applicationDeadline: { $gte: new Date() },
    })
      .populate('company', 'name logo slug')
      .populate('category', 'name slug')
      .populate('skills', 'name slug')
      .select('-recruiter')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json({ jobs });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getSimilarJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const currentJob = await Job.findById(id);
    if (!currentJob) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const jobs = await Job.find({
      _id: { $ne: id },
      status: 'active',
      applicationDeadline: { $gte: new Date() },
      $or: [
        { category: currentJob.category },
        { skills: { $in: currentJob.skills } },
        { jobType: currentJob.jobType },
        { workMode: currentJob.workMode },
      ],
    })
      .populate('company', 'name logo slug')
      .populate('category', 'name slug')
      .populate('skills', 'name slug')
      .select('-recruiter')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ jobs });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getJobCountByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const counts = await Job.aggregate([
      {
        $match: {
          status: 'active',
          applicationDeadline: { $gte: new Date() },
        },
      },
      {
        $group: {
          _id: '$category',
          jobCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          _id: 0,
          jobCount: 1,
          category: {
            _id: '$category._id',
            name: '$category.name',
            slug: '$category.slug',
          },
        },
      },
      {
        $sort: { jobCount: -1 },
      },
    ]);

    res.status(200).json({ counts });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
