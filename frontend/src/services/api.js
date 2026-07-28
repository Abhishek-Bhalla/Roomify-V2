import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// User APIs (Admin only)
export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  block: (id) => api.patch(`/users/${id}/block`),
  unblock: (id) => api.patch(`/users/${id}/unblock`),
};

// Room APIs (Admin only)
export const roomAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  toggleStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
  getAffectedBookings: (id) => api.get(`/rooms/${id}/affected-bookings`),
  relocateBookings: (id, targetRoomId, bookingIds) => api.post(`/rooms/${id}/relocate`, { targetRoomId, bookingIds }),
};

// Booking APIs
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: (status) => api.get('/bookings/my', { params: { status } }),
  getPending: () => api.get('/bookings/pending'),
  approve: (id) => api.patch(`/bookings/${id}/approve`),
  reject: (id, remarks) => api.patch(`/bookings/${id}/reject`, { remarks }),
  getAll: (params) => api.get('/bookings/all', { params }),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// Bulk Upload APIs (Admin only)
export const bulkUploadAPI = {
  downloadTemplate: () => api.get('/bulk-upload/template', { responseType: 'blob' }),
  uploadUsers: (users) => api.post('/bulk-upload/users', { users }),
};

// Feedback APIs
export const feedbackAPI = {
  getAll: (params) => api.get('/feedback', { params }),
  getStats: () => api.get('/feedback/stats'),
  submit: (data) => api.post('/feedback', data),
  getCompletedBookings: () => api.get('/feedback/completed-bookings'),
  getByRoom: (roomId) => api.get(`/feedback/room/${roomId}`),
};

// Mock data for development fallback
export const mockStats = {
  admin: { totalUsers: 45, activeUsers: 38, rooms: 12 },
  approver: { pendingRequests: 8, approvedBookings: 24 },
  requester: { myBookings: 5, approved: 3, pending: 1, rejected: 1 },
};

export const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@university.edu', role: 'admin', status: 'active' },
  { id: 2, name: 'Approver User', email: 'approver@university.edu', role: 'approver', status: 'active' },
  { id: 3, name: 'John Smith', email: 'john@university.edu', role: 'requester', status: 'active' },
  { id: 4, name: 'Sarah Johnson', email: 'sarah@university.edu', role: 'requester', status: 'blocked' },
];

export const mockRooms = [
  { id: 1, name: 'Conference Room A', capacity: 20, facilities: ['Projector', 'Whiteboard', 'AC'], status: 'available' },
  { id: 2, name: 'Computer Lab 101', capacity: 30, facilities: ['Computers', 'Projector', 'AC'], status: 'available' },
  { id: 3, name: 'Meeting Room B', capacity: 10, facilities: ['TV Screen', 'Whiteboard'], status: 'maintenance' },
  { id: 4, name: 'Seminar Hall', capacity: 100, facilities: ['Projector', 'Microphone', 'AC', 'Stage'], status: 'available' },
];

export const mockBookings = [
  { id: 1, room: 'Conference Room A', requester: 'John Smith', date: '2026-04-20', time: '09:00 - 11:00', purpose: 'Team Meeting', status: 'pending' },
  { id: 2, room: 'Computer Lab 101', requester: 'Sarah Johnson', date: '2026-04-21', time: '13:00 - 15:00', purpose: 'Training Session', status: 'approved' },
  { id: 3, room: 'Meeting Room B', requester: 'Mike Brown', date: '2026-04-22', time: '10:00 - 12:00', purpose: 'Client Call', status: 'rejected', remarks: 'Room under maintenance' },
  { id: 4, room: 'Seminar Hall', requester: 'Emily Davis', date: '2026-04-23', time: '14:00 - 16:00', purpose: 'Workshop', status: 'pending' },
];

export default api;