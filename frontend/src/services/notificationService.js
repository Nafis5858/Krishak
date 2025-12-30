import api from './api';

// Get user's notifications
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response;
};

// Get unread notification count
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response;
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response;
};

export const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

export default notificationService;

