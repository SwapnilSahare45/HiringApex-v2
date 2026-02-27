import { Router } from 'express';
import {
  deleteAvatar,
  deleteMyAccount,
  getMyProfile,
  updateAvatar,
  updateMyProfile,
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  handleUploadError,
  processAvatar,
  uploadAvatarMulter,
} from '../middlewares/upload.middleware';

const router = Router();

router.get('/profile', authMiddleware, getMyProfile);
router.put('/profile', authMiddleware, updateMyProfile);
router.put(
  '/profile/avatar',
  authMiddleware,
  uploadAvatarMulter.single('avatar'),
  handleUploadError,
  processAvatar,
  updateAvatar
);
router.delete('/profile/avatar', authMiddleware, deleteAvatar);
router.delete('/account', authMiddleware, deleteMyAccount);

export default router;
