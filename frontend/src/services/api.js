import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically attaches JWT token and active organization ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeOrgId = localStorage.getItem('activeOrgId');
    if (activeOrgId) {
      config.headers['x-organization-id'] = activeOrgId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standardizes error messages and handles session expiry
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage if token is invalid, except on auth routes
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('activeOrgId');
        window.location.href = '/login?expired=true';
      }
    }
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;
