import axios from 'axios';

// Configure axios base URL
const api = axios.create({
  baseURL: 'http://localhost:5002',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if a token exists (session expired/invalid)
      const hasToken = !!localStorage.getItem('token');
      if (hasToken) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // If no token, do not force redirect (public pages should handle their own errors)
    }
    return Promise.reject(error);
  }
);

export default api;

