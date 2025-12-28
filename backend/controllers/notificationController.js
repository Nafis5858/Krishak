const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// Create a notification
exports.createNotification = asyncHandler(async (recipientId, type, title, message, metadata, relatedEntity) => {
  const notification = new Notification({
    recipient: recipientId,
    type,
    title,
    message,
    metadata,
    relatedEntity
  });

  await notification.save();
  return notification;
});

// Get all notifications for a user
exports.getUserNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 20, skip = 0, isRead } = req.query;

  const query = { recipient: userId };
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });

  res.status(200).json({
    success: true,
    data: notifications,
    total,
    unreadCount,
    count: notifications.length
  });
});

// Get current user notifications
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0, isRead } = req.query;
  
  const query = { recipient: req.user.id };
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate('relatedEntity.entityId');

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    data: notifications,
    total,
    unreadCount,
    count: notifications.length
  });
});

// Mark notification as read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { 
      isRead: true,
      readAt: new Date()
    },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// Mark multiple notifications as read
exports.markMultipleAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  await Notification.updateMany(
    { _id: { $in: notificationIds } },
    { 
      isRead: true,
      readAt: new Date()
    }
  );

  res.status(200).json({
    success: true,
    message: 'Notifications marked as read'
  });
});

// Mark all notifications as read for current user
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { 
      isRead: true,
      readAt: new Date()
    }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Delete a notification
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findByIdAndDelete(notificationId);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

// Delete all notifications for current user
exports.deleteAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user.id });

  res.status(200).json({
    success: true,
    message: 'All notifications deleted'
  });
});

// Get unread count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    unreadCount
  });
});
