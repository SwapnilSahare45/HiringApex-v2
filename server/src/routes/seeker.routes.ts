import { Router } from 'express';
import {
  addCertification,
  addEducation,
  addExperience,
  deleteCertification,
  deleteEducation,
  deleteExperience,
  deleteResume,
  getSeekerProfile,
  updateCertification,
  updateEducation,
  updateExperience,
  updateResume,
  updateSeekerProfile,
} from '../controllers/seeker.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';
import { handleUploadError, uploadResumeMulter } from '../middlewares/upload.middleware';

const router = Router();

router.get('/profile', authMiddleware, roleCheck('seeker'), getSeekerProfile);
router.put('/profile', authMiddleware, roleCheck('seeker'), updateSeekerProfile);
router.put(
  '/resume',
  authMiddleware,
  roleCheck('seeker'),
  uploadResumeMulter.single('resume'),
  handleUploadError,
  updateResume
);
router.delete('/resume', authMiddleware, roleCheck('seeker'), deleteResume);
router.put('/experience', authMiddleware, roleCheck('seeker'), addExperience);
router.put('/experience/:expId', authMiddleware, roleCheck('seeker'), updateExperience);
router.delete('/experience/:expId', authMiddleware, roleCheck('seeker'), deleteExperience);
router.put('/education', authMiddleware, roleCheck('seeker'), addEducation);
router.put('/education/:eduId', authMiddleware, roleCheck('seeker'), updateEducation);
router.delete('/education/:eduId', authMiddleware, roleCheck('seeker'), deleteEducation);
router.put('/certifications', authMiddleware, roleCheck('seeker'), addCertification);
router.put('/certifications/:certId', authMiddleware, roleCheck('seeker'), updateCertification);
router.delete('/certifications/:certId', authMiddleware, roleCheck('seeker'), deleteCertification);

export default router;
