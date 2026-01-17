const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'order_placed',           // Buyer placed order
      'order_confirmed',        // Farmer confirmed order
      'order_cancelled',        // Order cancelled
      'order_completed',        // Order completed
      'order_delivered',        // Order delivered
      'delivery_assigned',      // Transporter assigned
      'delivery_picked',        // Transporter picked up
      'delivery_in_transit',    // Order in transit
      'delivery_payment',       // Transporter payment received
      'payment_received',       // Payment received
      'product_approved',       // Product approved by admin
      'product_rejected',       // Product rejected by admin
      'system_announcement'     // System-wide announcements
    ]
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

