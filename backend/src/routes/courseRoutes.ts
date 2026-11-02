import { Router } from 'express';
import {
  getAllCourses,
  getMyCourses,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadThumbnail } from '../middleware/upload';

const router = Router();

// Public or student-accessible routes
router.get('/', authenticateToken, getAllCourses);
router.get('/my-courses', authenticateToken, getMyCourses);
router.get('/:idOrSlug', authenticateToken, getCourseDetail);

// Admin-only management routes
router.post('/', authenticateToken, requireRole('ADMIN'), uploadThumbnail.single('thumbnail'), createCourse);
router.put('/:id', authenticateToken, requireRole('ADMIN'), uploadThumbnail.single('thumbnail'), updateCourse);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteCourse);

export default router;
