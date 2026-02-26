// src/api/index.js - Axios API Client
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:8000';

// ── Backend API instance ──────────────────────────────────────────────
export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── AI Server API instance ─────────────────────────────────────────────
export const aiApi = axios.create({
  baseURL: AI_URL,
  timeout: 60000,
});

// ── Auth APIs ──────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
};

// ── Student APIs ───────────────────────────────────────────────────────
export const studentAPI = {
  create: (data) => api.post('/api/students', data),
  getAll: (params) => api.get('/api/students', { params }),
  getById: (id) => api.get(`/api/students/${id}`),
  update: (id, data) => api.put(`/api/students/${id}`, data),
  delete: (id) => api.delete(`/api/students/${id}`),
};

// ── Attendance APIs ────────────────────────────────────────────────────
export const attendanceAPI = {
  mark: (data) => api.post('/api/attendance', data),
  getAll: (params) => api.get('/api/attendance', { params }),
  getTodayStats: () => api.get('/api/attendance/stats/today'),
  getChartData: (range) => api.get('/api/attendance/chart-data', { params: { range } }),
  getStudentHistory: (id) => api.get(`/api/attendance/student/${id}`),
  markExit: (id) => api.put(`/api/attendance/exit/${id}`),
};

// ── Report APIs ────────────────────────────────────────────────────────
export const reportAPI = {
  getSummary: (type) => api.get('/api/reports/summary', { params: { type } }),
  exportCSV: (params) => `${BACKEND_URL}/api/reports/export/csv?${new URLSearchParams(params).toString()}`,
  exportExcel: (params) => `${BACKEND_URL}/api/reports/export/excel?${new URLSearchParams(params).toString()}`,
  exportPDF: (params) => `${BACKEND_URL}/api/reports/export/pdf?${new URLSearchParams(params).toString()}`,
};

// ── AI Server APIs ─────────────────────────────────────────────────────
export const aiServerAPI = {
  registerFace: (data) => aiApi.post('/register_face', data),
  recognize: (image) => aiApi.post('/recognize', { image }),
  getEmbeddingStats: () => aiApi.get('/embeddings/stats'),
  health: () => aiApi.get('/health'),
};
