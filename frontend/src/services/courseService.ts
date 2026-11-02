import api from './api';
import { Course, MyCourseItem } from '../types';

export const courseService = {
  // Get all courses (admin sees all, student sees published)
  getAllCourses: async (): Promise<Course[]> => {
    const res = await api.get('/courses');
    return res.data.data;
  },

  // Get enrolled courses for student
  getMyCourses: async (): Promise<MyCourseItem[]> => {
    const res = await api.get('/courses/my-courses');
    return res.data.data;
  },

  // Get course detail (curriculum, modules, topics, progress)
  getCourseDetail: async (idOrSlug: string): Promise<Course> => {
    const res = await api.get(`/courses/${idOrSlug}`);
    return res.data.data;
  },

  // Admin: Create course
  createCourse: async (formData: FormData): Promise<Course> => {
    const res = await api.post('/courses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // Admin: Update course
  updateCourse: async (id: string, formData: FormData): Promise<Course> => {
    const res = await api.put(`/courses/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // Admin: Delete course
  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};
