import api from './api';
import { Module, Topic, Doubt } from '../types';

export const curriculumService = {
  // Modules (Chapters)
  createModule: async (data: { courseId: string; title: string; description?: string; order?: number }): Promise<Module> => {
    const res = await api.post('/curriculum/modules', data);
    return res.data.data;
  },

  updateModule: async (id: string, data: { title?: string; description?: string; order?: number }): Promise<Module> => {
    const res = await api.put(`/curriculum/modules/${id}`, data);
    return res.data.data;
  },

  deleteModule: async (id: string): Promise<void> => {
    await api.delete(`/curriculum/modules/${id}`);
  },

  // Topics & Videos (Supports FormData for direct video file upload or JSON for video URL)
  createTopic: async (formData: FormData): Promise<Topic> => {
    const res = await api.post('/curriculum/topics', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  updateTopic: async (id: string, formData: FormData): Promise<Topic> => {
    const res = await api.put(`/curriculum/topics/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  deleteTopic: async (id: string): Promise<void> => {
    await api.delete(`/curriculum/topics/${id}`);
  },

  // Student: Save progress
  updateProgress: async (topicId: string, data: { isCompleted?: boolean; lastWatchedSec?: number }): Promise<any> => {
    const res = await api.post(`/curriculum/topics/${topicId}/progress`, data);
    return res.data.data;
  },

  // Timestamped Doubts / Q&A
  getTopicDoubts: async (topicId: string): Promise<Doubt[]> => {
    const res = await api.get(`/curriculum/topics/${topicId}/doubts`);
    return res.data.data;
  },

  createDoubt: async (topicId: string, data: { timestampSec: number; question: string }): Promise<Doubt> => {
    const res = await api.post(`/curriculum/topics/${topicId}/doubts`, data);
    return res.data.data;
  },

  replyToDoubt: async (doubtId: string, data: { answer?: string; isResolved?: boolean }): Promise<Doubt> => {
    const res = await api.put(`/curriculum/topics/doubts/${doubtId}/reply`, data);
    return res.data.data;
  },
};
