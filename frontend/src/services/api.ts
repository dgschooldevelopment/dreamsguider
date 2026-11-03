import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('dg_token');
        localStorage.removeItem('dg_user');
      }
    }
    return Promise.reject(error);
  }
);

export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return baseUrl ? `${baseUrl}${url}` : url;
};

export default api;
