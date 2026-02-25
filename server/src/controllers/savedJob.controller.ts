import { Response } from 'express';
import { Job } from '../models/Job';
import { SavedJob } from '../models/SavedJob';
import { AuthRequest } from '../types/user.types';

export const saveJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const seekerId = req.user?.id;

    const job = await Job.findOne({ _id: jobId, status: 'active' });
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const alreadySaved = await SavedJob.findOne({ seeker: seekerId, job: jobId });
    if (alreadySaved) {
      res.status(400).json({ message: 'Job already saved' });
      return;
    }

    await SavedJob.create({ seeker: seekerId, job: jobId });

    res.status(201).json({ message: 'Job saved successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getSavedJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const seekerId = req.user?.id;
    const { page = '1', limit = '15' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [savedJobs, total] = await Promise.all([
      SavedJob.find({ seeker: seekerId })
        .populate({
          path: 'job',
          select: 'title slug jobType workMode location salary applicationDeadline status company',
          populate: {
            path: 'company',
            select: 'name logo slug',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      SavedJob.countDocuments({ seeker: seekerId }),
    ]);

    // Filter out saved jobs where job has been deleted or closed
    const activeSavedJobs = savedJobs.filter((saved) => saved.job !== null);

    res.status(200).json({
      savedJobs: activeSavedJobs,
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

export const removeSavedJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const seekerId = req.user?.id;

    const savedJob = await SavedJob.findOneAndDelete({ seeker: seekerId, job: jobId });
    if (!savedJob) {
      res.status(404).json({ message: 'Saved job not found' });
      return;
    }

    res.status(200).json({ message: 'Job removed from saved list' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const checkIfSaved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const seekerId = req.user?.id;

    const savedJob = await SavedJob.findOne({ seeker: seekerId, job: jobId });

    res.status(200).json({
      isSaved: !!savedJob,
      savedJob: savedJob ?? null,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
