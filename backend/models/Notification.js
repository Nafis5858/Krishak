const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  type: {
    type: String,
    enum: [
      'PRICE_CHANGE',
      'ORDER_PLACED',
      'ORDER_CONFIRMED',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'TRANSPORTER_ASSIGNED',
      'PRE_ORDER_REMINDER',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Product', 'Order', 'TransporterAssignment', 'PreOrder']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  metadata: {
    productName: String,
    orderNumber: String,
    priceChange: {
      oldPrice: Number,
      newPrice: Number
    },
    orderStatus: String,
    transporterName: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for querying user notifications
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
