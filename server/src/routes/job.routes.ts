import { Router } from 'express';
import {
  createJob,
  deleteJob,
  getFeaturedJobs,
  getJob,
  getJobCountByCategory,
  getJobs,
  getLatestJobs,
  getMyJobs,
  getSimilarJobs,
  updateJob,
  updateJobStatus,
} from '../controllers/job.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.get('/my-jobs', authMiddleware, roleCheck('recruiter'), getMyJobs);
router.get('/featured', getFeaturedJobs);
router.get('/latest', getLatestJobs);
router.get('/count-by-category', getJobCountByCategory);
router.get('/', getJobs);
router.get('/:id/similar', getSimilarJobs);
router.get('/:id', getJob);
router.post('/', authMiddleware, roleCheck('recruiter'), createJob);
router.put('/:id', authMiddleware, roleCheck('recruiter'), updateJob);
router.delete('/:id', authMiddleware, roleCheck('recruiter', 'admin'), deleteJob);
router.patch('/:id/status', authMiddleware, roleCheck('recruiter', 'admin'), updateJobStatus);

export default router;
