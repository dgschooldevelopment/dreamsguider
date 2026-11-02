import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.userId, isRead: false },
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const updated = await prisma.notification.updateMany({
      where: { id, userId: req.user.userId },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Mark notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications' });
  }
};
