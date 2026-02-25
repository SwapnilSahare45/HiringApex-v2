import { Router } from 'express';
import {
  checkIfSaved,
  getSavedJobs,
  removeSavedJob,
  saveJob,
} from '../controllers/savedJob.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.get('/check/:jobId', authMiddleware, roleCheck('seeker'), checkIfSaved);
router.get('/', authMiddleware, roleCheck('seeker'), getSavedJobs);
router.post('/:jobId', authMiddleware, roleCheck('seeker'), saveJob);
router.delete('/:jobId', authMiddleware, roleCheck('seeker'), removeSavedJob);

export default router;
