export type UserRole = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
  createdAt?: string;
  enrollments?: Enrollment[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string | null;
  category: string;
  level: string;
  duration?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  modules?: Module[];
  assignments?: Assignment[];
  stats?: {
    totalModules: number;
    totalTopics: number;
    totalDurationSec: number;
    totalEnrollments: number;
    totalAssignments: number;
  };
  isEnrolled?: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  order: number;
  topics: Topic[];
  createdAt: string;
}

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  videoType: 'local' | 'youtube' | 'url';
  duration: number; // in seconds
  order: number;
  resources?: string | null;
  notes?: string | null;
  isCompleted?: boolean;
  lastWatchedSec?: number;
  isLocked?: boolean;
  assignments?: Assignment[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'REVOKED';
  enrolledAt: string;
  user?: User;
  course?: Course;
}

export interface MyCourseItem {
  enrollmentId: string;
  enrolledAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'REVOKED';
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
  totalDurationSec: number;
  totalAssignments: number;
  course: Course;
}

export interface Assignment {
  id: string;
  courseId: string;
  topicId?: string | null;
  title: string;
  description: string;
  dueDate?: string | null;
  maxScore: number;
  createdAt: string;
  course?: { id: string; title: string };
  topic?: { id: string; title: string };
  submission?: AssignmentSubmission | null;
  _count?: { submissions: number };
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  submissionText?: string | null;
  fileUrl?: string | null;
  status: 'PENDING' | 'GRADED' | 'REJECTED';
  score?: number | null;
  feedback?: string | null;
  submittedAt: string;
  gradedAt?: string | null;
  user?: User;
  assignment?: {
    title: string;
    maxScore: number;
    courseId?: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'NEW_VIDEO' | 'COURSE_ALLOCATED' | 'ASSIGNMENT_GRADED' | 'ANNOUNCEMENT';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalStudents: number;
  totalCourses: number;
  totalTopics: number;
  totalEnrollments: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  recentEnrollments: {
    id: string;
    enrolledAt: string;
    user: { name: string; email: string };
    course: { title: string };
  }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }[];
}
