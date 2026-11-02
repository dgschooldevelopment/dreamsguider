import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
      // Clear token if invalid/expired
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('dg_token');
        localStorage.removeItem('dg_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
