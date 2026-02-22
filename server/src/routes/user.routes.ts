import { Router } from 'express';
import { deleteMyAccount, getMyProfile, updateMyProfile } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile', authMiddleware, getMyProfile);
router.put('/profile', authMiddleware, updateMyProfile);
// TODO: update avatar route
// TODO: delete avatar route
router.delete('/account', authMiddleware, deleteMyAccount);

export default router;
