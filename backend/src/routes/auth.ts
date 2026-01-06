import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  registerValidation,
  loginValidation,
} from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes (authentication required)
router.get('/me', authenticate, getMe);
router.post('/refresh', authenticate, refreshToken);

export default router;
