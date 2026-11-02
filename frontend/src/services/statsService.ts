import api from './api';
import { AdminStats } from '../types';

export const statsService = {
  getAdminStats: async (): Promise<AdminStats> => {
    const res = await api.get('/stats/admin');
    return res.data.data;
  },
};
