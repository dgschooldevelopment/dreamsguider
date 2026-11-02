import { Router } from 'express';
import {
  allocateCourseToUser,
  batchAllocateCourses,
  revokeCourseAccess,
  getAllEnrollments,
} from '../controllers/enrollmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Admin only routes for course allocations
router.use(authenticateToken, requireRole('ADMIN'));

router.post('/allocate', allocateCourseToUser);
router.post('/batch-allocate', batchAllocateCourses);
router.post('/revoke', revokeCourseAccess);
router.get('/', getAllEnrollments);

export default router;
