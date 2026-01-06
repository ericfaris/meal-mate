import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  registerValidation,
  loginValidation,
} from '../controllers/auth';
import { googleAuth, logout, getGoogleConfig } from '../controllers/oauth';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Google OAuth routes (public)
router.post('/google', googleAuth);
router.get('/google/config', getGoogleConfig);

// Protected routes (authentication required)
router.get('/me', authenticate, getMe);
router.post('/refresh', authenticate, refreshToken);
router.post('/logout', optionalAuth, logout);

export default router;
