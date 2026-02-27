import { Router } from 'express';
import {
  approveJob,
  approveRecruiter,
  approveReview,
  deleteCompany,
  deleteJob,
  deleteUser,
  getAllApplications,
  getAllCompanies,
  getAllJobs,
  getAllReviews,
  getAllUsers,
  getDashboardStats,
  getJobDetail,
  getJobsByCategory,
  getOverviewReport,
  getUserDetail,
  rejectJob,
  toggleFeaturedJob,
  updateUserStatus,
  verifyCompany,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

// Stats
router.get('/dashboard', authMiddleware, roleCheck('admin'), getDashboardStats);

// Users
router.get('/users', authMiddleware, roleCheck('admin'), getAllUsers);
router.get('/users/:id', authMiddleware, roleCheck('admin'), getUserDetail);
router.put('/users/:id/status', authMiddleware, roleCheck('admin'), updateUserStatus);
router.put('/users/:id/approve', authMiddleware, roleCheck('admin'), approveRecruiter);
router.delete('/users/:id', authMiddleware, roleCheck('admin'), deleteUser);

// Jobs
router.get('/jobs', authMiddleware, roleCheck('admin'), getAllJobs);
router.get('/jobs/:id', authMiddleware, roleCheck('admin'), getJobDetail);
router.put('/jobs/:id/approve', authMiddleware, roleCheck('admin'), approveJob);
router.put('/jobs/:id/reject', authMiddleware, roleCheck('admin'), rejectJob);
router.put('/jobs/:id/feature', authMiddleware, roleCheck('admin'), toggleFeaturedJob);
router.delete('/jobs/:id', authMiddleware, roleCheck('admin'), deleteJob);

// Application
router.get('/applications', authMiddleware, roleCheck('admin'), getAllApplications);

// Company
router.get('/companies', authMiddleware, roleCheck('admin'), getAllCompanies);
router.put('/companies/:id/verify', authMiddleware, roleCheck('admin'), verifyCompany);
router.delete('companies/:id', authMiddleware, roleCheck('admin'), deleteCompany);

// Review
router.get('/reviews', authMiddleware, roleCheck('admin'), getAllReviews);
router.put('/reviews/:id', authMiddleware, roleCheck('admin'), approveReview);

// Reports
router.get('/reports/overview', authMiddleware, roleCheck('admin'), getOverviewReport);
router.get('/reports/jobs-by-category', authMiddleware, roleCheck('admin'), getJobsByCategory);

export default router;
