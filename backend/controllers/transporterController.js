const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { notifyDeliveryAssigned, notifyDeliveryPicked, notifyDeliveryInTransit, notifyOrderDelivered } = require('../utils/notificationHelper');
const { calculateStraightLineDistance } = require('../utils/distanceCalculator');

// @desc    Get available delivery jobs for transporter
// @route   GET /api/transporter/jobs
// @access  Private (Transporter only)
const getAvailableJobs = asyncHandler(async (req, res) => {
  const { district } = req.query;
  const transporterId = req.user._id;

  // Get transporter's base location from their profile
  const transporter = await User.findById(transporterId);
  const transporterLocation = transporter.baseLocation?.coordinates;

  // Find orders that need delivery (confirmed orders without a transporter assigned)
  const query = {
    orderStatus: 'confirmed',
    deliveryStatus: 'not_assigned',
    transporter: { $exists: false }
  };

  const availableJobs = await Order.find(query)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location')
    .sort({ createdAt: -1 });

  // Calculate distances and filter jobs
  const MAX_DISTANCE_KM = 50;
  const jobsWithDistance = availableJobs.map(job => {
    let farmerDistance = null;
    let buyerDistance = null;
    let isWithinRange = true;
    let distanceWarning = null;

    // Calculate distance to farmer (pickup location)
    if (transporterLocation && job.farmer?.farmLocation?.coordinates) {
      farmerDistance = calculateStraightLineDistance(
        transporterLocation,
        job.farmer.farmLocation.coordinates
      );
      if (farmerDistance > MAX_DISTANCE_KM) {
        isWithinRange = false;
        distanceWarning = `Pickup location is ${farmerDistance.toFixed(1)}km away`;
      }
    }

    // Calculate distance to buyer (delivery location)
    if (transporterLocation && job.deliveryAddress?.coordinates) {
      buyerDistance = calculateStraightLineDistance(
        transporterLocation,
        job.deliveryAddress.coordinates
      );
      if (buyerDistance > MAX_DISTANCE_KM) {
        isWithinRange = false;
        if (!distanceWarning) {
          distanceWarning = `Delivery location is ${buyerDistance.toFixed(1)}km away`;
        } else {
          distanceWarning = `Both locations are too far (${Math.max(farmerDistance, buyerDistance).toFixed(1)}km)`;
        }
      }
    }

    return {
      ...job.toObject(),
      distances: {
        toFarmer: farmerDistance,
        toBuyer: buyerDistance,
        maxDistance: Math.max(farmerDistance || 0, buyerDistance || 0)
      },
      isWithinRange,
      distanceWarning
    };
  });

  // Sort: within range jobs first, then by distance
  jobsWithDistance.sort((a, b) => {
    if (a.isWithinRange && !b.isWithinRange) return -1;
    if (!a.isWithinRange && b.isWithinRange) return 1;
    return (a.distances.maxDistance || 0) - (b.distances.maxDistance || 0);
  });

  res.json({
    success: true,
    count: jobsWithDistance.length,
    data: jobsWithDistance,
    transporterLocation: transporterLocation || null,
    maxServiceRadius: MAX_DISTANCE_KM
  });
});

// @desc    Accept a delivery job
// @route   POST /api/transporter/jobs/:orderId/accept
// @access  Private (Transporter only)
const acceptJob = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const transporterId = req.user._id;

  const order = await Order.findById(orderId)
    .populate('farmer', 'farmLocation')
    .populate('buyer', 'name');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.transporter) {
    res.status(400);
    throw new Error('This job has already been assigned to another transporter');
  }

  if (order.deliveryStatus !== 'not_assigned') {
    res.status(400);
    throw new Error('This job is no longer available');
  }

  // Verify distance is within service radius
  const transporter = await User.findById(transporterId);
  const transporterLocation = transporter.baseLocation?.coordinates;
  const MAX_DISTANCE_KM = 50;

  if (transporterLocation) {
    let isWithinRange = true;
    
    // Check distance to farmer (pickup)
    if (order.farmer?.farmLocation?.coordinates) {
      const farmerDistance = calculateStraightLineDistance(
        transporterLocation,
        order.farmer.farmLocation.coordinates
      );
      if (farmerDistance > MAX_DISTANCE_KM) {
        isWithinRange = false;
      }
    }

    // Check distance to buyer (delivery)
    if (order.deliveryAddress?.coordinates) {
      const buyerDistance = calculateStraightLineDistance(
        transporterLocation,
        order.deliveryAddress.coordinates
      );
      if (buyerDistance > MAX_DISTANCE_KM) {
        isWithinRange = false;
      }
    }

    if (!isWithinRange) {
      res.status(400);
      throw new Error(`This job is outside your service radius of ${MAX_DISTANCE_KM}km`);
    }
  }

  // Assign the transporter
  order.transporter = transporterId;
  order.deliveryStatus = 'assigned';
  order.statusHistory.push({
    status: 'assigned',
    timestamp: new Date(),
    note: `Assigned to transporter: ${req.user.name}`
  });

  // Set estimated delivery date (e.g., 2 days from now)
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 2);
  order.estimatedDeliveryDate = estimatedDate;

  await order.save();

  // Send notification
  await notifyDeliveryAssigned(order, transporterId);

  const populatedOrder = await Order.findById(order._id)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location');

  res.json({
    success: true,
    message: 'Job accepted successfully',
    data: populatedOrder
  });
});

// @desc    Update delivery status
// @route   PUT /api/transporter/jobs/:orderId/status
// @access  Private (Transporter only)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, note, photo } = req.body;
  const transporterId = req.user._id;

  const validStatuses = ['picked', 'in_transit', 'delivered'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.transporter.toString() !== transporterId.toString()) {
    res.status(403);
    throw new Error('You are not assigned to this delivery');
  }

  // Validate status workflow
  const statusFlow = {
    'assigned': ['picked'],
    'picked': ['in_transit'],
    'in_transit': ['delivered']
  };

  if (!statusFlow[order.deliveryStatus]?.includes(status)) {
    res.status(400);
    throw new Error(`Cannot change status from '${order.deliveryStatus}' to '${status}'`);
  }

  // For 'picked' status, photo is mandatory
  if (status === 'picked' && !photo) {
    res.status(400);
    throw new Error('Pickup photo is mandatory when marking as picked. Please upload a photo of the product.');
  }

  // Update delivery status
  order.deliveryStatus = status;
  
  // Store pickup photo
  if (status === 'picked' && photo) {
    order.pickupPhoto = {
      url: photo,
      uploadedAt: new Date(),
      uploadedBy: transporterId
    };
    console.log('✅ Pickup photo saved to order:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      photoUrl: photo
    });
  }

  // Store delivery proof photo (optional)
  if (status === 'delivered' && photo) {
    order.deliveryProofPhoto = {
      url: photo,
      uploadedAt: new Date(),
      uploadedBy: transporterId
    };
    console.log('✅ Delivery photo saved to order:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      photoUrl: photo
    });
  }

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated to ${status}`,
    photo: photo || null
  });

  // If delivered, update order status and actual delivery date
  if (status === 'delivered') {
    order.orderStatus = 'completed';
    order.actualDeliveryDate = new Date();
  }

  await order.save();

  // Send notifications based on status
  if (status === 'picked') {
    console.log('📧 Sending picked notification for order:', order.orderNumber);
    await notifyDeliveryPicked(order);
  } else if (status === 'in_transit') {
    console.log('📧 Sending in_transit notification for order:', order.orderNumber);
    await notifyDeliveryInTransit(order);
  } else if (status === 'delivered') {
    console.log('📧 Sending delivered notification for order:', order.orderNumber);
    await notifyOrderDelivered(order);
    console.log('✅ Delivered notification completed for order:', order.orderNumber);
  }

  const populatedOrder = await Order.findById(order._id)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location')
    .populate('transporter', 'name phone');

  res.json({
    success: true,
    message: `Delivery status updated to ${status}`,
    data: populatedOrder
  });
});

// @desc    Get transporter's assigned deliveries
// @route   GET /api/transporter/my-deliveries
// @access  Private (Transporter only)
const getMyDeliveries = asyncHandler(async (req, res) => {
  const transporterId = req.user._id;
  const { status } = req.query;

  const query = { transporter: transporterId };
  
  if (status) {
    query.deliveryStatus = status;
  }

  const deliveries = await Order.find(query)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: deliveries.length,
    data: deliveries
  });
});

// @desc    Get transporter dashboard stats
// @route   GET /api/transporter/stats
// @access  Private (Transporter only)
const getTransporterStats = asyncHandler(async (req, res) => {
  const transporterId = req.user._id;

  // Get active deliveries (assigned, picked, in_transit)
  const activeDeliveries = await Order.countDocuments({
    transporter: transporterId,
    deliveryStatus: { $in: ['assigned', 'picked', 'in_transit'] }
  });

  // Get completed deliveries
  const completedDeliveries = await Order.countDocuments({
    transporter: transporterId,
    deliveryStatus: 'delivered'
  });

  // Calculate total earnings from completed deliveries
  const completedOrders = await Order.find({
    transporter: transporterId,
    deliveryStatus: 'delivered'
  });

  const totalEarnings = completedOrders.reduce((sum, order) => {
    return sum + (order.priceBreakdown?.transportFee || 0);
  }, 0);

  // Get pending jobs count (available in transporter's service districts)
  const transporter = await User.findById(transporterId);
  const serviceDistricts = transporter.serviceDistricts || [];
  
  let pendingJobsQuery = {
    orderStatus: 'confirmed',
    deliveryStatus: 'not_assigned',
    transporter: { $exists: false }
  };
  
  if (serviceDistricts.length > 0) {
    const districtRegexArray = serviceDistricts.map(dist => new RegExp(dist, 'i'));
    pendingJobsQuery['deliveryAddress.district'] = { $in: districtRegexArray };
  }
  // If no service districts set, count all pending jobs
  
  const pendingJobs = await Order.countDocuments(pendingJobsQuery);

  // Calculate average rating
  const ratedOrders = await Order.find({
    transporter: transporterId,
    'transporterRating.rating': { $exists: true }
  });

  let averageRating = 0;
  if (ratedOrders.length > 0) {
    const totalRating = ratedOrders.reduce((sum, order) => {
      return sum + (order.transporterRating?.rating || 0);
    }, 0);
    averageRating = totalRating / ratedOrders.length;
  }

  res.json({
    success: true,
    data: {
      activeDeliveries,
      completedDeliveries,
      totalEarnings,
      pendingJobs,
      averageRating: averageRating.toFixed(1),
      totalRatings: ratedOrders.length
    }
  });
});

// @desc    Get single delivery details
// @route   GET /api/transporter/jobs/:orderId
// @access  Private (Transporter only)
const getDeliveryDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const transporterId = req.user._id;

  const order = await Order.findById(orderId)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location grade quantity')
    .populate('transporter', 'name phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if transporter has access (either assigned or it's an available job)
  const isAssigned = order.transporter && order.transporter._id.toString() === transporterId.toString();
  const isAvailable = order.deliveryStatus === 'not_assigned';

  if (!isAssigned && !isAvailable) {
    res.status(403);
    throw new Error('You do not have access to this delivery');
  }

  res.json({
    success: true,
    data: order
  });
});

module.exports = {
  getAvailableJobs,
  acceptJob,
  updateDeliveryStatus,
  getMyDeliveries,
  getTransporterStats,
  getDeliveryDetails
};
