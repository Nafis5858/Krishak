const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 50, skip = 0, unreadOnly = false } = req.query;

  // Build query
  const query = { user: userId };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .populate('relatedOrder', 'orderNumber orderStatus')
    .populate('relatedProduct', 'cropName photos')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Notification.countDocuments({ user: userId });
  const unreadCount = await Notification.countDocuments({ 
    user: userId, 
    isRead: false 
  });

  res.json({
    success: true,
    data: {
      notifications,
      total,
      unreadCount
    }
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const unreadCount = await Notification.countDocuments({ 
    user: userId, 
    isRead: false 
  });

  res.json({
    success: true,
    data: {
      unreadCount
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user._id;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Verify user owns this notification
  if (notification.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this notification');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      updatedCount: result.modifiedCount
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user._id;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Verify user owns this notification
  if (notification.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }

  await notification.deleteOne();

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

