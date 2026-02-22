import { Router } from 'express';
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompany,
  getMyCompany,
  updateCompany,
} from '../controllers/company.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.post('/', authMiddleware, roleCheck('recruiter'), createCompany);
router.get('/', getCompanies);
router.get('/my-company', authMiddleware, roleCheck('recruiter'), getMyCompany);
router.get('/:slug', getCompany);
router.put('/:id', authMiddleware, roleCheck('recruiter'), updateCompany);
router.delete('/:id', authMiddleware, roleCheck('recruiter', 'admin'), deleteCompany);

export default router;
