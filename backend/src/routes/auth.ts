import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

// Strict rate limit for auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

// Public routes (no authentication required)
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);

// Google OAuth routes (public)
router.post('/google', authLimiter, googleAuth);
router.get('/google/config', getGoogleConfig);

// Protected routes (authentication required)
router.get('/me', authenticate, getMe);
router.post('/refresh', authenticate, refreshToken);
router.post('/logout', optionalAuth, logout);

export default router;
