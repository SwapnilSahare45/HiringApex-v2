import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleCheck } from '../middlewares/roleCheck.middleware';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategory);
router.post('/', authMiddleware, roleCheck('admin'), createCategory);
router.put('/:id', authMiddleware, roleCheck('admin'), updateCategory);
router.delete('/:id', authMiddleware, roleCheck('admin'), deleteCategory);

export default router;
