import { Router } from 'express';
import {
  createModule,
  updateModule,
  deleteModule,
  createTopic,
  updateTopic,
  deleteTopic,
  updateTopicProgress,
  createTopicDoubt,
  getTopicDoubts,
  replyToDoubt,
} from '../controllers/topicController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadVideo } from '../middleware/upload';

const router = Router();

// Module (Chapter) routes - Admin only
router.post('/modules', authenticateToken, requireRole('ADMIN'), createModule);
router.put('/modules/:id', authenticateToken, requireRole('ADMIN'), updateModule);
router.delete('/modules/:id', authenticateToken, requireRole('ADMIN'), deleteModule);

// Topic & Video routes
router.post('/topics', authenticateToken, requireRole('ADMIN'), uploadVideo.single('video'), createTopic);
router.put('/topics/:id', authenticateToken, requireRole('ADMIN'), uploadVideo.single('video'), updateTopic);
router.delete('/topics/:id', authenticateToken, requireRole('ADMIN'), deleteTopic);

// Student progress route
router.post('/topics/:topicId/progress', authenticateToken, updateTopicProgress);

// Timestamped Doubts / Q&A routes
router.post('/topics/:topicId/doubts', authenticateToken, createTopicDoubt);
router.get('/topics/:topicId/doubts', authenticateToken, getTopicDoubts);
router.put('/topics/doubts/:doubtId/reply', authenticateToken, replyToDoubt);

export default router;
