import { Router } from 'express';
import {
  createSkill,
  deleteSkill,
  getSkills,
  searchSkills,
  updateSkill,
} from '../controllers/skill.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.get('/', getSkills);
router.get('/search', searchSkills);
router.post('/', authMiddleware, roleCheck('admin'), createSkill);
router.put('/:id', authMiddleware, roleCheck('admin'), updateSkill);
router.delete('/:id', authMiddleware, roleCheck('admin'), deleteSkill);

export default router;
