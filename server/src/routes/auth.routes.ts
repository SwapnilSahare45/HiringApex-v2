import { Router } from 'express';
import {
  forgotPassword,
  getMe,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  verifyOTP,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp/:token', verifyOTP);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;
