import { Router } from 'express';
import {
  register,
  login,
  getMe,
  getAllUsers,
  createStudentByAdmin,
  sendOtp,
  verifyOtp,
} from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Student / User login
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.get('/me', authenticateToken, getMe);

// Admin-only User management
router.get('/users', authenticateToken, requireRole('ADMIN'), getAllUsers);
router.post('/users/create', authenticateToken, requireRole('ADMIN'), createStudentByAdmin);

export default router;
