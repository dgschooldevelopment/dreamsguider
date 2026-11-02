import api from './api';
import { Notification, AdminStats } from '../types';

export const notificationService = {
  getUserNotifications: async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
    const res = await api.get('/notifications');
    return res.data.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/mark-all-read');
  },
};

export const statsService = {
  getAdminStats: async (): Promise<AdminStats> => {
    const res = await api.get('/stats/admin');
    return res.data.data;
  },
};
