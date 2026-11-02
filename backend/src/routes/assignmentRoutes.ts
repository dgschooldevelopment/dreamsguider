import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getStudentAssignments,
  submitAssignment,
  getSubmissionsForAssignment,
  gradeSubmission,
} from '../controllers/assignmentController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadAssignment } from '../middleware/upload';

const router = Router();

// Student routes
router.get('/course/:courseId', authenticateToken, getStudentAssignments);
router.post('/:assignmentId/submit', authenticateToken, uploadAssignment.single('file'), submitAssignment);

// Admin routes
router.get('/', authenticateToken, requireRole('ADMIN'), getAssignments);
router.post('/', authenticateToken, requireRole('ADMIN'), createAssignment);
router.get('/:assignmentId/submissions', authenticateToken, requireRole('ADMIN'), getSubmissionsForAssignment);
router.put('/submissions/:submissionId/grade', authenticateToken, requireRole('ADMIN'), gradeSubmission);

export default router;
