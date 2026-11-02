import api from './api';
import { Assignment, AssignmentSubmission } from '../types';

export const assignmentService = {
  // Admin: Get all assignments
  getAssignments: async (courseId?: string): Promise<Assignment[]> => {
    const res = await api.get('/assignments', {
      params: courseId ? { courseId } : {},
    });
    return res.data.data;
  },

  // Admin: Create assignment
  createAssignment: async (data: {
    courseId: string;
    topicId?: string;
    title: string;
    description: string;
    dueDate?: string;
    maxScore?: number;
  }): Promise<Assignment> => {
    const res = await api.post('/assignments', data);
    return res.data.data;
  },

  // Student: Get assignments for course with submission status
  getStudentAssignments: async (courseId: string): Promise<Assignment[]> => {
    const res = await api.get(`/assignments/course/${courseId}`);
    return res.data.data;
  },

  // Student: Submit assignment solution (text + file)
  submitAssignment: async (assignmentId: string, formData: FormData): Promise<AssignmentSubmission> => {
    const res = await api.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // Admin: Get submissions for a specific assignment
  getSubmissionsForAssignment: async (assignmentId: string): Promise<AssignmentSubmission[]> => {
    const res = await api.get(`/assignments/${assignmentId}/submissions`);
    return res.data.data;
  },

  // Admin: Grade submission
  gradeSubmission: async (
    submissionId: string,
    data: { score: number; feedback: string; status?: string }
  ): Promise<AssignmentSubmission> => {
    const res = await api.put(`/assignments/submissions/${submissionId}/grade`, data);
    return res.data.data;
  },
};
