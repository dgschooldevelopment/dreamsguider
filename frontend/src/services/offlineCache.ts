import { Course, MyCourseItem } from '../types';
import { curriculumService } from './curriculumService';

const CACHE_PREFIX = 'dg_cache_';
const PROGRESS_QUEUE_KEY = 'dg_offline_progress_queue';
const ENROLLED_COURSES_KEY = `${CACHE_PREFIX}enrolled_courses`;

export const offlineCache = {
  // Save course data to local cache
  saveCourse: (slug: string, data: Course) => {
    try {
      localStorage.setItem(
        `${CACHE_PREFIX}course_${slug}`,
        JSON.stringify({
          timestamp: Date.now(),
          data,
        })
      );
    } catch (e) {
      console.warn('Failed to save course to offline cache:', e);
    }
  },

  // Get course data from cache
  getCourse: (slug: string): Course | null => {
    try {
      const item = localStorage.getItem(`${CACHE_PREFIX}course_${slug}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      return parsed.data || null;
    } catch {
      return null;
    }
  },

  // Cache enrolled courses list
  saveEnrolledCourses: (data: MyCourseItem[]) => {
    try {
      localStorage.setItem(
        ENROLLED_COURSES_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data,
        })
      );
    } catch (e) {
      console.warn('Failed to save enrolled courses to cache:', e);
    }
  },

  getEnrolledCourses: (): MyCourseItem[] | null => {
    try {
      const item = localStorage.getItem(ENROLLED_COURSES_KEY);
      if (!item) return null;
      const parsed = JSON.parse(item);
      return parsed.data || null;
    } catch {
      return null;
    }
  },

  // Save last watched position locally for instant resume even offline
  saveVideoTime: (topicId: string, seconds: number) => {
    try {
      if (seconds > 0) {
        localStorage.setItem(`${CACHE_PREFIX}time_${topicId}`, String(Math.floor(seconds)));
      }
    } catch {}
  },

  getVideoTime: (topicId: string): number => {
    try {
      const val = localStorage.getItem(`${CACHE_PREFIX}time_${topicId}`);
      return val ? Number(val) : 0;
    } catch {
      return 0;
    }
  },

  // Queue progress updates made while offline
  queueProgress: (topicId: string, isCompleted: boolean) => {
    try {
      const queueRaw = localStorage.getItem(PROGRESS_QUEUE_KEY);
      const queue: Record<string, boolean> = queueRaw ? JSON.parse(queueRaw) : {};
      queue[topicId] = isCompleted;
      localStorage.setItem(PROGRESS_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to queue progress offline:', e);
    }
  },

  // Check how many progress updates are pending sync
  getPendingProgressCount: (): number => {
    try {
      const queueRaw = localStorage.getItem(PROGRESS_QUEUE_KEY);
      if (!queueRaw) return 0;
      const queue: Record<string, boolean> = JSON.parse(queueRaw);
      return Object.keys(queue).length;
    } catch {
      return 0;
    }
  },

  // Sync queued progress when back online
  syncProgressQueue: async (): Promise<number> => {
    try {
      const queueRaw = localStorage.getItem(PROGRESS_QUEUE_KEY);
      if (!queueRaw) return 0;
      const queue: Record<string, boolean> = JSON.parse(queueRaw);
      const topicIds = Object.keys(queue);
      if (topicIds.length === 0) return 0;

      let syncedCount = 0;
      for (const topicId of topicIds) {
        try {
          await curriculumService.updateProgress(topicId, { isCompleted: queue[topicId] });
          syncedCount++;
        } catch (err) {
          console.warn(`Failed to sync topic ${topicId}`, err);
        }
      }

      localStorage.removeItem(PROGRESS_QUEUE_KEY);
      return syncedCount;
    } catch (err) {
      console.warn('Offline progress sync failed:', err);
      return 0;
    }
  },

  // Automatically optimize Cloudinary video URLs for dynamic quality & chunk buffering
  optimizeVideoUrl: (url?: string | null): string => {
    if (!url) return '';
    const trimmed = url.trim();

    // If Cloudinary video: inject q_auto,f_auto for automatic bitrate & chunk streaming
    if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/video/upload/')) {
      if (!trimmed.includes('q_auto') && !trimmed.includes('f_auto')) {
        return trimmed.replace('/video/upload/', '/video/upload/q_auto,f_auto/');
      }
    }

    return trimmed;
  },
};
