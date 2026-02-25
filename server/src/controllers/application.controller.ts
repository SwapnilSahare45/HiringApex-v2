import { Response } from 'express';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { AuthRequest } from '../types/user.types';
import {
  createApplicationSchema,
  interviewDetailsSchema,
  recruiterFeedbackSchema,
  updateApplicationStatusSchema,
} from '../validators/application.validator';

// TODO: Resume upload functionality
export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = createApplicationSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => {
          field: err.path[0];
          message: err.message;
        }),
      });
      return;
    }

    const { job: jobId, resume, coverLetter } = result.data;

    const job = await Job.findOne({
      _id: jobId,
      status: 'active',
      applicationDeadline: { $gte: new Date() },
    });
    if (!job) {
      res.status(404).json({ message: 'Job not found or no longer accepting applications' });
      return;
    }

    const existingApplication = await Application.findOne({ job: jobId, seeker: req.user?.id });
    if (existingApplication) {
      res.status(400).json({ message: 'You have already applied to this job' });
      return;
    }

    const application = await Application.create({
      job: jobId,
      seeker: req.user?.id,
      recruiter: job.recruiter,
      company: job.company,
      resume,
      coverLetter,
      status: 'applied',
      statusHistory: [
        {
          status: 'applied',
          changedAt: new Date(),
          changedBy: req.user?.id,
          remarks: 'Application submitted',
        },
      ],
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { totalApplications: 1 } });

    res.status(201).json({
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '15' } = req.query;

    const filter: Record<string, any> = { seeker: req.user?.id };
    if (status) filter.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = Math.ceil(pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('job', 'title slug jobType workMode location applicationDeadline')
        .populate('company', 'name logo slug')
        .select('-statusHistory -recruiterNotes -rating')
        .sort({ appliedAt: -1 })
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

export const getApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const application = await Application.findById(id)
      .populate('job', 'title slug jobType workMode location salary')
      .populate('company', 'name logo slug')
      .populate('seeker', 'firstName lastName email avatar')
      .populate('statusHistory.changedBy', 'firstName lastName role');

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const isSeeker = application.seeker._id.toString() === userId;
    const isRecruiter = application.recruiter.toString() === userId;

    if (!isSeeker && !isRecruiter) {
      res.status(403).json({ message: 'You do not have permission to view this application' });
      return;
    }

    // hide recruiter notes and rating from seeker
    if (userRole === 'seeker') {
      const { recruiterNotes, rating, ...rest } = application as any;
      res.status(200).json({ application: rest });
      return;
    }

    res.status(200).json({ application });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const withdrawApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await Application.findOne({ _id: id, seeker: req.user?.id });
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (['hired', 'rejected', 'withdrawn'].includes(application.status)) {
      res
        .status(400)
        .json({ message: `Cannot withdraw an application that is already ${application.status}` });
      return;
    }

    application.status = 'withdrawn';
    application.statusHistory.push({
      status: 'withdrawn',
      changedAt: new Date(),
      changedBy: req.user?.id,
      remarks: 'Application withdrawn by seeker',
    });

    await application.save();

    await Job.findByIdAndUpdate(application.job, { $inc: { totalApplications: -1 } });

    res.status(200).json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getJobApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { status, page = '1', limit = '15' } = req.query;

    // Verify recruiter owns this job
    const job = await Job.findOne({ _id: jobId, recruiter: req.user?.id });
    if (!job) {
      res.status(404).json({ message: 'Job not found or you not the admin' });
      return;
    }

    const filter: Record<string, any> = { job: jobId };
    if (status) filter.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('seeker', 'firstName lastName email avatar')
        .select('-statusHistory')
        .sort({ appliedAt: -1 })
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

export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recruiterId = req.user?.id;

    const result = updateApplicationStatusSchema.safeParse(req.body);
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

    const { status, remarks } = result.data;

    const application = await Application.findOne({ _id: id, recruiter: recruiterId });
    if (!application) {
      res.status(404).json({ message: 'Application not found or you are not the recruiter' });
      return;
    }

    if (application.status === 'withdrawn') {
      res.status(400).json({ message: 'Cannot update a withdrawn application' });
      return;
    }

    application.status = status;
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: recruiterId,
      remarks: remarks || '',
    });

    application.save();

    res.status(200).json({
      message: 'Application status updated successfully',
      status: application.status,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const addRecruiterNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recruiterId = req.user?.id;

    const result = recruiterFeedbackSchema.safeParse(req.body);
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

    const application = await Application.findOneAndUpdate(
      { _id: id, recruiter: recruiterId },
      { $set: { recruiterNotes: result.data.recruiterNotes } },
      { new: true }
    );
    if (!application) {
      res.status(404).json({ message: 'Application not found or you are not the recruiter' });
      return;
    }

    res.status(200).json({
      message: 'Notes added successfully',
      recruiterNotes: application.recruiterNotes,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const rateApplicant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recruiterId = req.user?.id;

    const result = recruiterFeedbackSchema.safeParse(req.body);
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

    if (!result.data.rating) {
      res.status(400).json({ message: 'Rating is required' });
      return;
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, recruiter: recruiterId },
      { $set: { rating: result.data.rating } },
      { new: true }
    );
    if (!application) {
      res.status(404).json({ message: 'Application not found or you are not the recruiter' });
      return;
    }

    res.status(200).json({ message: 'Applicant rated successfully', rating: application.rating });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const scheduleInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recruiterId = req.user?.id;

    const result = interviewDetailsSchema.safeParse(req.body);
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

    const application = await Application.findOne({ _id: id, recruiter: recruiterId });
    if (!application) {
      res.status(404).json({ message: 'Application not found or you are not the recruiter' });
      return;
    }

    application.interviewDetails = result.data;
    application.status = 'interview';
    application.statusHistory.push({
      status: 'interview',
      changedAt: new Date(),
      changedBy: recruiterId,
      remarks: `Interview scheduled on ${result.data.date.toDateString()} via ${result.data.type}`,
    });

    await application.save();

    res.status(200).json({
      message: 'Interview scheduled successfully',
      interviewDetails: application.interviewDetails,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const checkIfApplied = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const seekerId = req.user?.id;

    const application = await Application.findOne({ job: jobId, seeker: seekerId }).select(
      'status appliedAt'
    );

    res.status(200).json({
      hasApplied: !!application,
      application: application ?? null,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
