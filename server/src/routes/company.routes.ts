import { Router } from 'express';
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompany,
  getMyCompany,
  updateCompany,
  uploadCompanyCover,
  uploadCompnayLogo,
} from '../controllers/company.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';
import {
  handleUploadError,
  processCompanyCover,
  processCompanyLogo,
  uploadImageMulter,
} from '../middlewares/upload.middleware';

const router = Router();

router.post('/', authMiddleware, roleCheck('recruiter'), createCompany);
router.get('/', getCompanies);
router.get('/my-company', authMiddleware, roleCheck('recruiter'), getMyCompany);
router.get('/:slug', getCompany);
router.put('/:id', authMiddleware, roleCheck('recruiter'), updateCompany);
router.patch(
  '/:companyId/logo',
  authMiddleware,
  roleCheck('recruiter'),
  uploadImageMulter.single('logo'),
  handleUploadError,
  processCompanyLogo,
  uploadCompnayLogo
);
router.patch(
  '/:companyId/cover',
  authMiddleware,
  roleCheck('recruiter'),
  uploadImageMulter.single('cover'),
  handleUploadError,
  processCompanyCover,
  uploadCompanyCover
);
router.delete('/:id', authMiddleware, roleCheck('recruiter', 'admin'), deleteCompany);

export default router;
