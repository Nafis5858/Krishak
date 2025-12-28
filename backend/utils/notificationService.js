const Notification = require('../models/Notification');

// Helper function to create notification
const createNotification = async (recipientId, type, title, message, metadata, relatedEntity) => {
  try {
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
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Notify all buyers who have this product in cart about price change
exports.notifyPriceChange = async (productId, oldPrice, newPrice, productName, farmerId) => {
  try {
    const Cart = require('../models/Cart');
    const carts = await Cart.find({ 'items.product': productId });
    
    const buyerIds = [...new Set(carts.map(cart => cart.buyer.toString()))];
    
    // Create notification for all affected buyers
    for (const buyerId of buyerIds) {
      await createNotification(
        buyerId,
        'PRICE_CHANGE',
        `Price Update: ${productName}`,
        `The price of ${productName} has changed from ৳${oldPrice}/unit to ৳${newPrice}/unit`,
        {
          productName,
          priceChange: {
            oldPrice,
            newPrice
          }
        },
        {
          entityType: 'Product',
          entityId: productId
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error notifying price change:', error);
    return false;
  }
};

// Notify about order placement
exports.notifyOrderPlaced = async (order) => {
  try {
    const Product = require('../models/Product');
    
    // Populate product if not already populated
    let productName = 'product';
    if (order.product && typeof order.product === 'object' && order.product.cropName) {
      productName = order.product.cropName;
    } else if (order.product) {
      // If product is just an ID, fetch it
      const product = await Product.findById(order.product);
      if (product) {
        productName = product.cropName;
      }
    }
    
    const buyerId = order.buyer._id || order.buyer;
    const farmerId = order.farmer._id || order.farmer;
    
    // Notify buyer
    await createNotification(
      buyerId,
      'ORDER_PLACED',
      'Order Placed Successfully',
      `Your order #${order.orderNumber} for ${productName} has been placed. Total: ৳${order.totalPrice}`,
      {
        orderNumber: order.orderNumber,
        orderStatus: 'placed',
        productName: productName
      },
      {
        entityType: 'Order',
        entityId: order._id
      }
    );
    
    // Notify farmer
    await createNotification(
      farmerId,
      'ORDER_PLACED',
      'New Order Received',
      `You have received a new order #${order.orderNumber} for ${productName}. Quantity: ${order.quantity} kg`,
      {
        orderNumber: order.orderNumber,
        orderStatus: 'placed',
        productName: productName
      },
      {
        entityType: 'Order',
        entityId: order._id
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error notifying order placed:', error);
    return false;
  }
};

// Notify about order status update
exports.notifyOrderStatusUpdate = async (order, newStatus, message) => {
  try {
    const statusMessages = {
      confirmed: 'Your order has been confirmed',
      shipped: 'Your order has been shipped',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled'
    };
    
    const buyerId = order.buyer._id || order.buyer;
    const farmerId = order.farmer._id || order.farmer;
    
    // Notify buyer
    await createNotification(
      buyerId,
      `ORDER_${newStatus.toUpperCase()}`,
      `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message || statusMessages[newStatus] || `Your order #${order.orderNumber} status has been updated to ${newStatus}`,
      {
        orderNumber: order.orderNumber,
        orderStatus: newStatus
      },
      {
        entityType: 'Order',
        entityId: order._id
      }
    );
    
    // Notify farmer about status changes
    if (newStatus === 'confirmed' || newStatus === 'cancelled') {
      await createNotification(
        farmerId,
        `ORDER_${newStatus.toUpperCase()}`,
        `Order #${order.orderNumber} ${newStatus}`,
        message || `Order #${order.orderNumber} has been ${newStatus}`,
        {
          orderNumber: order.orderNumber,
          orderStatus: newStatus
        },
        {
          entityType: 'Order',
          entityId: order._id
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error notifying order status update:', error);
    return false;
  }
};

// Notify about transporter assignment
exports.notifyTransporterAssignment = async (assignment) => {
  try {
    const User = require('../models/User');
    
    const transporter = await User.findById(assignment.transporter);
    const order = await require('../models/Order').findById(assignment.order);
    
    if (!order) {
      console.error('Order not found for transporter assignment notification');
      return false;
    }
    
    // Notify transporter
    const transporterId = assignment.transporter._id || assignment.transporter;
    const pickupAddress = assignment.pickupLocation?.address || (typeof assignment.pickupLocation === 'string' ? assignment.pickupLocation : 'Location TBD');
    await createNotification(
      transporterId,
      'TRANSPORTER_ASSIGNED',
      'New Delivery Assignment',
      `You have been assigned delivery for order #${order.orderNumber}. Pickup: ${pickupAddress}`,
      {
        orderNumber: order.orderNumber,
        transporterName: transporter?.name
      },
      {
        entityType: 'TransporterAssignment',
        entityId: assignment._id
      }
    );
    
    // Notify buyer
    const buyerId = order.buyer._id || order.buyer;
    await createNotification(
      buyerId,
      'TRANSPORTER_ASSIGNED',
      'Transporter Assigned',
      `Your delivery has been assigned to ${transporter?.name}. Expected delivery: ${assignment.expectedDeliveryDate || 'Soon'}`,
      {
        orderNumber: order.orderNumber,
        transporterName: transporter?.name
      },
      {
        entityType: 'TransporterAssignment',
        entityId: assignment._id
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error notifying transporter assignment:', error);
    return false;
  }
};

// Notify about pre-order reminders
exports.notifyPreOrderReminder = async (product, buyerId) => {
  try {
    await createNotification(
      buyerId,
      'PRE_ORDER_REMINDER',
      `Pre-Order Reminder: ${product.cropName}`,
      `Your pre-order for ${product.cropName} (Grade ${product.grade}) will be ready on ${new Date(product.expectedHarvestDate).toLocaleDateString()}. Expected to arrive in 3-5 days after harvest.`,
      {
        productName: product.cropName,
        expectedDate: product.expectedHarvestDate
      },
      {
        entityType: 'Product',
        entityId: product._id
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error notifying pre-order reminder:', error);
    return false;
  }
};

// Notify about payment success
exports.notifyPaymentSuccess = async (order, paymentId) => {
  try {
    const buyerId = order.buyer._id || order.buyer;
    
    await createNotification(
      buyerId,
      'PAYMENT_SUCCESS',
      'Payment Successful',
      `Payment of ৳${order.totalPrice} for order #${order.orderNumber} has been confirmed. Thank you!`,
      {
        orderNumber: order.orderNumber,
        amount: order.totalPrice
      },
      {
        entityType: 'Order',
        entityId: order._id
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error notifying payment success:', error);
    return false;
  }
};

// Notify about payment failure
exports.notifyPaymentFailure = async (order, reason) => {
  try {
    const buyerId = order.buyer._id || order.buyer;
    
    await createNotification(
      buyerId,
      'PAYMENT_FAILED',
      'Payment Failed',
      `Payment for order #${order.orderNumber} failed. Reason: ${reason}. Please try again.`,
      {
        orderNumber: order.orderNumber
      },
      {
        entityType: 'Order',
        entityId: order._id
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error notifying payment failure:', error);
    return false;
  }
};
