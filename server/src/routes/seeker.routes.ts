import { Router } from 'express';
import {
  addCertification,
  addEducation,
  addExperience,
  deleteCertification,
  deleteEducation,
  deleteExperience,
  getSeekerProfile,
  updateCertification,
  updateEducation,
  updateExperience,
  updateSeekerProfile,
} from '../controllers/seeker.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.get('/profile', authMiddleware, roleCheck('seeker'), getSeekerProfile);
router.put('/profile', authMiddleware, roleCheck('seeker'), updateSeekerProfile);
// TODO: Update resume route
// TODO: Delete resume route
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
