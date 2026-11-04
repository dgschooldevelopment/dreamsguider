import { Router } from 'express';
import {
  register,
  login,
  getMe,
  getAllUsers,
  createStudentByAdmin,
  updateStudentByAdmin,
  deleteStudentByAdmin,
} from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Student / User login (Password-based)
router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, getMe);

// Admin-only User management
router.get('/users', authenticateToken, requireRole('ADMIN'), getAllUsers);
router.post('/users/create', authenticateToken, requireRole('ADMIN'), createStudentByAdmin);
router.put('/users/:userId', authenticateToken, requireRole('ADMIN'), updateStudentByAdmin);
router.delete('/users/:userId', authenticateToken, requireRole('ADMIN'), deleteStudentByAdmin);

export default router;
