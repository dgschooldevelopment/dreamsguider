import { Router } from 'express';
import { getAdminStats } from '../controllers/statsController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/admin', authenticateToken, requireRole('ADMIN'), getAdminStats);

export default router;
