import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../config/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }

  req.user = payload;
  next();
};

export const requireRole = (role: 'ADMIN' | 'STUDENT') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ 
        success: false, 
        message: `Forbidden: Requires ${role} role. Your role is ${req.user.role}.` 
      });
      return;
    }

    next();
  };
};
