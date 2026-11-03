import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE_URL = rawBase.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('dg_token');
        localStorage.removeItem('dg_user');
      }
    }
    return Promise.reject(error);
  }
);

export const DEFAULT_COURSE_THUMBNAIL =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';

export const getMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_COURSE_THUMBNAIL;
  }

  const trimmed = url.trim();

  // If already an absolute http/https URL, return directly
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If relative path like /uploads/thumbnails/...
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
};

export default api;
