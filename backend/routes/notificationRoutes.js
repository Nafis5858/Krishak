const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getMyNotifications,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/user/:userId', getUserNotifications);

// Protected routes - require authentication
router.use(protect);

router.get('/my/all', getMyNotifications);
router.get('/my/unread-count', getUnreadCount);

router.put('/:notificationId/read', markAsRead);
router.put('/mark-multiple/read', markMultipleAsRead);
router.put('/mark-all/read', markAllAsRead);

router.delete('/:notificationId', deleteNotification);
router.delete('/all/notifications', deleteAllNotifications);

module.exports = router;
