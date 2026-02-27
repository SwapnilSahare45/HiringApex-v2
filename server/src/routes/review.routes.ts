import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getCompanyReviews,
  getMyReviews,
  updateReview,
} from '../controllers/review.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.post('/', authMiddleware, roleCheck('seeker'), createReview);
router.get('/company/:companyId', getCompanyReviews);
router.get('/my-reviews', authMiddleware, roleCheck('seeker'), getMyReviews);
router.put('/:id', authMiddleware, roleCheck('seeker'), updateReview);
router.delete('/:id', authMiddleware, roleCheck('seeker', 'admin'), deleteReview);

export default router;
