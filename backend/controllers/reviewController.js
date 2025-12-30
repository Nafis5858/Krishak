const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Buyer only)
const createReview = asyncHandler(async (req, res) => {
  // Ensure only buyers can create reviews
  if (req.user.role !== 'buyer') {
    res.status(403);
    throw new Error('Only buyers can create reviews');
  }

  const { productId, orderId, rating, comment, aspects } = req.body;
  const buyerId = req.user._id;

  // Validate required fields
  if (!productId || !orderId || !rating || !comment) {
    res.status(400);
    throw new Error('Please provide productId, orderId, rating, and comment');
  }

  // Validate rating range
  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if order exists and belongs to the buyer
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.buyer.toString() !== buyerId.toString()) {
    res.status(403);
    throw new Error('Not authorized to review this order');
  }

  // Check if order is completed or delivered
  if (order.orderStatus !== 'completed' && order.deliveryStatus !== 'delivered') {
    res.status(400);
    throw new Error('You can only review orders that have been completed or delivered');
  }

  // Check if product exists and matches the order
  if (order.product.toString() !== productId.toString()) {
    res.status(400);
    throw new Error('Product does not match the order');
  }

  // Check if review already exists for this order
  const existingReview = await Review.findOne({ order: orderId });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this order');
  }

  // Create review
  const review = await Review.create({
    buyer: buyerId,
    product: productId,
    order: orderId,
    rating,
    comment,
    aspects: aspects || {},
    isVerified: true // Verified purchase
  });

  // Populate buyer info
  await review.populate('buyer', 'name avatar');

  // Update product average rating
  await updateProductRating(productId);

  // Update farmer rating
  if (order.farmer) {
    await updateFarmerRating(order.farmer);
  }

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Build sort query
  let sortQuery = {};
  switch (sortBy) {
    case 'newest':
      sortQuery = { createdAt: -1 };
      break;
    case 'oldest':
      sortQuery = { createdAt: 1 };
      break;
    case 'highest':
      sortQuery = { rating: -1 };
      break;
    case 'lowest':
      sortQuery = { rating: 1 };
      break;
    default:
      sortQuery = { createdAt: -1 };
  }

  // Get reviews
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const reviews = await Review.find({ 
    product: productId, 
    isVisible: true 
  })
    .populate('buyer', 'name avatar')
    .sort(sortQuery)
    .skip(skip)
    .limit(limitNum);

  const total = await Review.countDocuments({ 
    product: productId, 
    isVisible: true 
  });

  // Calculate average rating and rating distribution
  const ratingStats = await Review.aggregate([
    { $match: { product: product._id, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  let stats = {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };

  if (ratingStats.length > 0) {
    const distribution = ratingStats[0].ratingDistribution;
    stats.averageRating = ratingStats[0].averageRating || 0;
    stats.totalReviews = ratingStats[0].totalReviews || 0;
    
    distribution.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        stats.ratingDistribution[rating]++;
      }
    });
  }

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    },
    stats
  });
});

// @desc    Get reviews by a buyer
// @route   GET /api/reviews/buyer/:buyerId
// @access  Public
const getBuyerReviews = asyncHandler(async (req, res) => {
  const { buyerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const reviews = await Review.find({ 
    buyer: buyerId, 
    isVisible: true 
  })
    .populate('product', 'cropName photos')
    .populate('buyer', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Review.countDocuments({ 
    buyer: buyerId, 
    isVisible: true 
  });

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    Check if buyer can review an order
// @route   GET /api/reviews/check/:orderId
// @access  Private (Buyer only)
const checkCanReview = asyncHandler(async (req, res) => {
  // Ensure only buyers can check review status
  if (req.user.role !== 'buyer') {
    res.status(403);
    throw new Error('Only buyers can check review status');
  }

  const { orderId } = req.params;
  const buyerId = req.user._id;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.buyer.toString() !== buyerId.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const existingReview = await Review.findOne({ order: orderId });
  
  // Order can be reviewed if:
  // 1. Order status is 'completed' OR delivery status is 'delivered'
  // 2. No existing review
  const canReview = (order.orderStatus === 'completed' || order.deliveryStatus === 'delivered') && !existingReview;

  res.json({
    success: true,
    canReview,
    hasReviewed: !!existingReview,
    orderStatus: order.orderStatus,
    deliveryStatus: order.deliveryStatus
  });
});

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      $set: {
        averageRating: stats[0].averageRating,
        reviewCount: stats[0].totalReviews
      }
    });
  }
};

// Helper function to update farmer rating
const updateFarmerRating = async (farmerId) => {
  // Get all products by this farmer
  const products = await Product.find({ farmer: farmerId });
  const productIds = products.map(p => p._id);

  // Get all reviews for these products
  const stats = await Review.aggregate([
    { $match: { product: { $in: productIds }, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(farmerId, {
      $set: {
        'rating.average': stats[0].averageRating,
        'rating.count': stats[0].totalReviews
      }
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getBuyerReviews,
  checkCanReview
};

