import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/my/all?limit=10');
      
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`, {});
      
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all/read', {});
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Check if notification is unread before deleting
      const deletedNotif = notifications.find(n => n._id === notificationId);
      const wasUnread = deletedNotif && !deletedNotif.isRead;
      
      await api.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev =>
        prev.filter(notif => notif._id !== notificationId)
      );
      
      // Update unread count if the deleted notification was unread
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      PRICE_CHANGE: '💰',
      ORDER_PLACED: '📦',
      ORDER_CONFIRMED: '✅',
      ORDER_SHIPPED: '🚚',
      ORDER_DELIVERED: '🎉',
      TRANSPORTER_ASSIGNED: '👨‍✈️',
      PRE_ORDER_REMINDER: '⏰',
      PAYMENT_SUCCESS: '💳',
      PAYMENT_FAILED: '❌'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      PRICE_CHANGE: 'bg-blue-50 border-l-4 border-blue-400',
      ORDER_PLACED: 'bg-green-50 border-l-4 border-green-400',
      ORDER_CONFIRMED: 'bg-green-50 border-l-4 border-green-400',
      ORDER_SHIPPED: 'bg-yellow-50 border-l-4 border-yellow-400',
      ORDER_DELIVERED: 'bg-green-50 border-l-4 border-green-400',
      TRANSPORTER_ASSIGNED: 'bg-purple-50 border-l-4 border-purple-400',
      PRE_ORDER_REMINDER: 'bg-orange-50 border-l-4 border-orange-400',
      PAYMENT_SUCCESS: 'bg-green-50 border-l-4 border-green-400',
      PAYMENT_FAILED: 'bg-red-50 border-l-4 border-red-400'
    };
    return colors[type] || 'bg-gray-50 border-l-4 border-gray-400';
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
        title="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg">
            <h3 className="font-bold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  } ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="text-red-600 hover:text-red-900 transition"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Metadata Display */}
                  {notification.metadata && (
                    <div className="mt-2 text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded">
                      {notification.metadata.orderNumber && (
                        <p>Order: #{notification.metadata.orderNumber}</p>
                      )}
                      {notification.metadata.productName && (
                        <p>Product: {notification.metadata.productName}</p>
                      )}
                      {notification.metadata.priceChange && (
                        <p>
                          Price: ৳{notification.metadata.priceChange.oldPrice} →
                          ৳{notification.metadata.priceChange.newPrice}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
