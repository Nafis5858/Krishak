import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const notificationService = {
  // Get all notifications for current user
  getMyNotifications: async (limit = 20, skip = 0, isRead = null) => {
    try {
      let url = `${API_URL}/notifications/my/all?limit=${limit}&skip=${skip}`;
      if (isRead !== null) {
        url += `&isRead=${isRead}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/my/unread-count`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark multiple notifications as read
  markMultipleAsRead: async (notificationIds) => {
    try {
      const response = await axios.put(
        `${API_URL}/notifications/mark-multiple/read`,
        { notificationIds },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await axios.put(
        `${API_URL}/notifications/mark-all/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Delete all notifications for current user
  deleteAllNotifications: async () => {
    try {
      const response = await axios.delete(
        `${API_URL}/notifications/all/notifications`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
};

export default notificationService;
