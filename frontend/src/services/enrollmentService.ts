import api from './api';
import { Enrollment, User } from '../types';

export const enrollmentService = {
  // Admin: Get all enrollments
  getAllEnrollments: async (): Promise<Enrollment[]> => {
    const res = await api.get('/enrollments');
    return res.data.data;
  },

  // Admin: Allocate single course to user
  allocateCourse: async (userId: string, courseId: string): Promise<any> => {
    const res = await api.post('/enrollments/allocate', { userId, courseId });
    return res.data;
  },

  // Admin: Batch allocate courses
  batchAllocate: async (userIds: string[], courseIds: string[]): Promise<any> => {
    const res = await api.post('/enrollments/batch-allocate', { userIds, courseIds });
    return res.data;
  },

  // Admin: Revoke course access
  revokeAccess: async (userId: string, courseId: string): Promise<any> => {
    const res = await api.post('/enrollments/revoke', { userId, courseId });
    return res.data;
  },

  // Admin: Get all registered users/students
  getAllUsers: async (): Promise<User[]> => {
    const res = await api.get('/auth/users');
    return res.data.data;
  },

  // Admin: Create / Add student directly
  createStudent: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    courseIds?: string[];
  }): Promise<any> => {
    const res = await api.post('/auth/users/create', data);
    return res.data;
  },
};
