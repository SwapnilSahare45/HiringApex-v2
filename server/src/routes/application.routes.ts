import { Router } from 'express';
import {
  addRecruiterNotes,
  applyToJob,
  checkIfApplied,
  getApplication,
  getJobApplications,
  getMyApplications,
  rateApplicant,
  scheduleInterview,
  updateApplicationStatus,
  withdrawApplication,
} from '../controllers/application.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.get('/my-applications', authMiddleware, roleCheck('seeker'), getMyApplications);
router.get('/job/:jobId/applied', authMiddleware, roleCheck('seeker'), checkIfApplied);
router.get('/job/:jobId/applications', authMiddleware, roleCheck('recruiter'), getJobApplications);
router.post('/', authMiddleware, roleCheck('seeker'), applyToJob);
router.get('/:id', authMiddleware, roleCheck('seeker', 'recruiter'), getApplication);
router.patch('/:id/withdraw', authMiddleware, roleCheck('seeker'), withdrawApplication);
router.patch('/:id/status', authMiddleware, roleCheck('recruiter'), updateApplicationStatus);
router.patch('/:id/notes', authMiddleware, roleCheck('recruiter'), addRecruiterNotes);
router.patch('/:id/rating', authMiddleware, roleCheck('recruiter'), rateApplicant);
router.patch('/:id/interview', authMiddleware, roleCheck('recruiter'), scheduleInterview);

export default router;
