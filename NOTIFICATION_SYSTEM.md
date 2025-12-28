# 🔔 Notification System - Implementation Guide

## Overview

A complete in-app notification system that sends SMS-like alerts for:
- Price changes on products
- Order updates (placed, confirmed, shipped, delivered)
- Transporter assignments
- Pre-order reminders
- Payment notifications

---

## Architecture

### Backend Components

#### 1. **Notification Model** (`backend/models/Notification.js`)
Stores all notifications with the following fields:
```javascript
{
  recipient: ObjectId,        // User receiving notification
  type: String,               // Notification type (PRICE_CHANGE, ORDER_PLACED, etc.)
  title: String,              // Notification title
  message: String,            // Notification message
  relatedEntity: {
    entityType: String,       // Related entity type (Product, Order, TransporterAssignment)
    entityId: ObjectId
  },
  metadata: Object,           // Additional context data
  isRead: Boolean,            // Read status
  readAt: Date,               // When notification was read
  createdAt: Date             // Creation timestamp
}
```

#### 2. **Notification Controller** (`backend/controllers/notificationController.js`)
Handles all notification operations:
- `createNotification()` - Create new notifications
- `getUserNotifications()` - Get notifications for a user
- `getMyNotifications()` - Get current user's notifications
- `markAsRead()` - Mark single notification as read
- `markMultipleAsRead()` - Mark multiple notifications as read
- `markAllAsRead()` - Mark all user notifications as read
- `deleteNotification()` - Delete a notification
- `getUnreadCount()` - Get unread notification count

#### 3. **Notification Routes** (`backend/routes/notificationRoutes.js`)
API endpoints:
```
GET  /api/notifications/user/:userId           - Get user notifications
GET  /api/notifications/my/all                  - Get current user notifications
GET  /api/notifications/my/unread-count        - Get unread count
PUT  /api/notifications/:notificationId/read    - Mark as read
PUT  /api/notifications/mark-multiple/read     - Mark multiple as read
PUT  /api/notifications/mark-all/read          - Mark all as read
DELETE /api/notifications/:notificationId      - Delete notification
DELETE /api/notifications/all/notifications    - Delete all user notifications
```

#### 4. **Notification Service** (`backend/utils/notificationService.js`)
Helper functions to trigger notifications for different events:
- `notifyPriceChange()` - When product price changes
- `notifyOrderPlaced()` - When order is placed
- `notifyOrderStatusUpdate()` - When order status changes
- `notifyTransporterAssignment()` - When transporter is assigned
- `notifyPreOrderReminder()` - Reminder for pre-orders
- `notifyPaymentSuccess()` - Successful payment
- `notifyPaymentFailure()` - Failed payment

### Frontend Components

#### 1. **NotificationCenter Component** (`frontend/src/components/NotificationCenter.jsx`)
Displays notification bell icon with dropdown menu showing:
- Real-time notification list
- Unread count badge
- Mark as read/delete options
- Color-coded notification types
- Auto-refresh every 30 seconds

#### 2. **Notification Service** (`frontend/src/services/notificationService.js`)
API client for notification operations:
- `getMyNotifications()` - Fetch user notifications
- `getUnreadCount()` - Get unread count
- `markAsRead()` - Mark notification as read
- `markMultipleAsRead()` - Mark multiple as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification()` - Delete notification
- `deleteAllNotifications()` - Delete all notifications

---

## Integration Points

### 1. Product Price Changes
When a farmer updates a product price:

**File:** `backend/controllers/productController.js`
```javascript
// In updateProduct function, after saving price change:
const { notifyPriceChange } = require('../utils/notificationService');

if (oldPrice !== newPrice) {
  await notifyPriceChange(
    product._id,
    oldPrice,
    newPrice,
    product.cropName,
    req.user._id
  );
}
```

### 2. Order Placement
When a buyer places an order:

**File:** `backend/controllers/orderController.js`
```javascript
const { notifyOrderPlaced } = require('../utils/notificationService');

// After order creation:
await notifyOrderPlaced(order);
```

### 3. Order Status Updates
When order status changes:

**File:** `backend/controllers/orderController.js`
```javascript
const { notifyOrderStatusUpdate } = require('../utils/notificationService');

// When updating order status:
await notifyOrderStatusUpdate(order, newStatus, statusMessage);
```

### 4. Transporter Assignment
When a transporter is assigned:

**File:** `backend/controllers/adminController.js` (or appropriate route)
```javascript
const { notifyTransporterAssignment } = require('../utils/notificationService');

// After creating transporter assignment:
await notifyTransporterAssignment(assignment);
```

### 5. Pre-Order Reminders
Schedule job to run periodically (optional - can use node-cron):

```javascript
const cron = require('node-cron');
const { notifyPreOrderReminder } = require('../utils/notificationService');

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const products = await Product.find({
    isPreOrder: true,
    expectedHarvestDate: { $lte: tomorrow }
  });
  
  for (const product of products) {
    // Get buyers who have this pre-order
    const orders = await Order.find({ product: product._id });
    for (const order of orders) {
      await notifyPreOrderReminder(product, order.buyer);
    }
  }
});
```

---

## Notification Types & Messages

| Type | Title | Message |
|------|-------|---------|
| PRICE_CHANGE | Price Update | "The price of {product} has changed from ₹{old} to ₹{new}" |
| ORDER_PLACED | Order Placed | "Your order #{orderNo} has been placed. Total: ₹{amount}" |
| ORDER_CONFIRMED | Order Confirmed | "Your order has been confirmed" |
| ORDER_SHIPPED | Order Shipped | "Your order has been shipped" |
| ORDER_DELIVERED | Order Delivered | "Your order has been delivered" |
| TRANSPORTER_ASSIGNED | Transporter Assigned | "Delivery assigned to {name}. Expected: {date}" |
| PRE_ORDER_REMINDER | Pre-Order Reminder | "Your pre-order will be ready on {date}" |
| PAYMENT_SUCCESS | Payment Success | "Payment of ₹{amount} confirmed for order #{orderNo}" |
| PAYMENT_FAILED | Payment Failed | "Payment failed. Reason: {reason}" |

---

## Frontend Integration

### Add NotificationCenter to Navbar
Already done in `frontend/src/components/Navbar.jsx`

### Usage in Components
```javascript
import notificationService from '../services/notificationService';

// Get notifications
const notifications = await notificationService.getMyNotifications();

// Mark as read
await notificationService.markAsRead(notificationId);

// Get unread count
const count = await notificationService.getUnreadCount();
```

---

## Database Schema

### Notification Collection
```json
{
  "_id": ObjectId,
  "recipient": ObjectId(User),
  "type": "PRICE_CHANGE",
  "title": "Price Update",
  "message": "The price has changed...",
  "relatedEntity": {
    "entityType": "Product",
    "entityId": ObjectId
  },
  "metadata": {
    "productName": "Rice",
    "priceChange": {
      "oldPrice": 50,
      "newPrice": 55
    }
  },
  "isRead": false,
  "readAt": null,
  "createdAt": "2025-12-28T10:30:00Z"
}
```

---

## API Response Examples

### Get Notifications
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "recipient": "507f1f77bcf86cd799439012",
      "type": "ORDER_PLACED",
      "title": "Order Placed",
      "message": "Your order #ORD-001 has been placed...",
      "metadata": {
        "orderNumber": "ORD-001",
        "productName": "Rice"
      },
      "isRead": false,
      "createdAt": "2025-12-28T10:30:00Z"
    }
  ],
  "total": 1,
  "unreadCount": 1,
  "count": 1
}
```

### Get Unread Count
```json
{
  "success": true,
  "unreadCount": 3
}
```

---

## Features

✅ **Real-time Notifications** - Users see alerts immediately when events occur
✅ **Persistent Storage** - All notifications saved in database
✅ **Read/Unread Tracking** - Mark notifications as read with timestamps
✅ **Bulk Operations** - Mark multiple or all notifications as read
✅ **Event Types** - 9 different notification types
✅ **Rich Metadata** - Store context about related entities
✅ **Auto-refresh** - Frontend auto-refreshes every 30 seconds
✅ **Responsive UI** - Works on all screen sizes
✅ **Color-coded** - Different colors for different notification types

---

## How to Use

### 1. Create a Notification (Backend)
```javascript
const { createNotification } = require('../controllers/notificationController');

await createNotification(
  userId,                    // recipient
  'ORDER_PLACED',           // type
  'Order Placed',           // title
  'Your order has been placed', // message
  { orderNumber: 'ORD-001' }, // metadata
  {
    entityType: 'Order',
    entityId: orderId
  }
);
```

### 2. Get User Notifications (Frontend)
```javascript
const response = await notificationService.getMyNotifications(20, 0);
console.log(response.data);      // Array of notifications
console.log(response.unreadCount); // Number of unread
```

### 3. Mark Notification as Read (Frontend)
```javascript
await notificationService.markAsRead(notificationId);
```

### 4. Delete Notification (Frontend)
```javascript
await notificationService.deleteNotification(notificationId);
```

---

## Testing

### Test Price Change Notification
1. Login as farmer
2. Create a product with initial price ₹50
3. Edit product and change price to ₹55
4. Login as buyer who has product in cart
5. Check NotificationCenter - should see "Price Update" notification

### Test Order Placement
1. Login as buyer
2. Add product to cart
3. Place order
4. Check NotificationCenter - should see "Order Placed"
5. Login as farmer - should receive "New Order Received" notification

### Test Order Status Update
1. Login as admin
2. Find an order
3. Update status to "confirmed"
4. Login as buyer - should see "Order Confirmed" notification

---

## Future Enhancements

- [ ] WebSocket integration for real-time push notifications
- [ ] Email notifications for important events
- [ ] SMS integration for critical alerts
- [ ] Push notifications to mobile apps
- [ ] Notification preferences (user can choose which types to receive)
- [ ] Notification scheduling (quiet hours)
- [ ] Notification templates customization
- [ ] Rich notifications with images/actions

---

## Files Modified/Created

### Created Files
- `backend/models/Notification.js`
- `backend/controllers/notificationController.js`
- `backend/routes/notificationRoutes.js`
- `backend/utils/notificationService.js`
- `frontend/src/components/NotificationCenter.jsx`
- `frontend/src/services/notificationService.js`

### Modified Files
- `backend/server.js` - Added notification routes
- `frontend/src/components/Navbar.jsx` - Added NotificationCenter component

---

## API Testing

Use REST Client to test endpoints:

```http
### Get my notifications
GET http://localhost:5000/api/notifications/my/all
Authorization: Bearer YOUR_TOKEN

### Get unread count
GET http://localhost:5000/api/notifications/my/unread-count
Authorization: Bearer YOUR_TOKEN

### Mark as read
PUT http://localhost:5000/api/notifications/507f1f77bcf86cd799439011/read
Authorization: Bearer YOUR_TOKEN

### Delete notification
DELETE http://localhost:5000/api/notifications/507f1f77bcf86cd799439011
Authorization: Bearer YOUR_TOKEN
```

---

## Troubleshooting

**Issue:** Notifications not appearing
**Solution:** 
1. Check if user is authenticated
2. Verify token is valid
3. Check if notifications were created in database
4. Check browser console for errors

**Issue:** Unread count not updating
**Solution:**
1. Refresh the page
2. Clear browser cache
3. Check if markAsRead API is working

**Issue:** Notification service errors
**Solution:**
1. Check MongoDB connection
2. Verify notification model is properly imported
3. Check error logs in server console

---

**Notification system is ready to use!** 🚀
