const express = require('express');
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// IMPORTANT: Route order matters - specific routes must come before parameterized routes
// Get unread count (specific route - must come before '/' route)
router.get('/unread-count', getUnreadCount);

// Get user's notifications
router.get('/', getNotifications);

// Mark all as read (specific route - must come before '/:id' routes)
router.put('/read-all', markAllAsRead);

// Mark single notification as read
router.put('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;

