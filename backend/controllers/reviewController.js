const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Create a review for an order
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { orderId, ratings, review } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!orderId || !ratings) {
    res.status(400);
    throw new Error('Order ID and ratings are required');
  }

  if (!ratings.productQuality || !ratings.communication || !ratings.deliveryExperience) {
    res.status(400);
    throw new Error('All rating categories (productQuality, communication, deliveryExperience) are required');
  }

  // Find the order
  const order = await Order.findById(orderId).populate('buyer farmer product');
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if order is completed
  if (order.orderStatus !== 'completed') {
    res.status(400);
    throw new Error('Can only review completed orders');
  }

  // Determine review type and reviewee
  let reviewType, reviewee;
  if (order.buyer._id.toString() === userId.toString()) {
    // Buyer reviewing farmer
    reviewType = 'buyer_to_farmer';
    reviewee = order.farmer._id;
  } else if (order.farmer._id.toString() === userId.toString()) {
    // Farmer reviewing buyer
    reviewType = 'farmer_to_buyer';
    reviewee = order.buyer._id;
  } else {
    res.status(403);
    throw new Error('You are not authorized to review this order');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    order: orderId,
    reviewer: userId
  });

  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this order');
  }

  // Create review
  const newReview = await Review.create({
    order: orderId,
    reviewer: userId,
    reviewee: reviewee,
    reviewType: reviewType,
    ratings: {
      productQuality: ratings.productQuality,
      communication: ratings.communication,
      deliveryExperience: ratings.deliveryExperience
    },
    review: review || '',
    product: order.product._id
  });

  // Populate review with user details
  await newReview.populate('reviewer', 'name avatar');
  await newReview.populate('reviewee', 'name avatar');
  await newReview.populate('product', 'cropName');

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: newReview
  });
});

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reviewType, limit = 20, page = 1 } = req.query;

  const query = { reviewee: userId, isVisible: true };
  
  if (reviewType) {
    query.reviewType = reviewType;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find(query)
    .populate('reviewer', 'name avatar')
    .populate('product', 'cropName')
    .populate('order', 'orderNumber')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Review.countDocuments(query);

  // Calculate average ratings
  const allReviews = await Review.find({ reviewee: userId, isVisible: true });
  const averages = {
    productQuality: 0,
    communication: 0,
    deliveryExperience: 0,
    overall: 0
  };

  if (allReviews.length > 0) {
    averages.productQuality = Math.round(
      (allReviews.reduce((sum, r) => sum + r.ratings.productQuality, 0) / allReviews.length) * 10
    ) / 10;
    averages.communication = Math.round(
      (allReviews.reduce((sum, r) => sum + r.ratings.communication, 0) / allReviews.length) * 10
    ) / 10;
    averages.deliveryExperience = Math.round(
      (allReviews.reduce((sum, r) => sum + r.ratings.deliveryExperience, 0) / allReviews.length) * 10
    ) / 10;
    averages.overall = Math.round(
      (allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length) * 10
    ) / 10;
  }

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      averages
    }
  });
});

// @desc    Get review for a specific order
// @route   GET /api/reviews/order/:orderId
// @access  Private
const getOrderReview = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  // Find the order
  const order = await Order.findById(orderId);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check authorization
  if (order.buyer.toString() !== userId.toString() && 
      order.farmer.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this review');
  }

  // Find review
  const review = await Review.findOne({ order: orderId, reviewer: userId })
    .populate('reviewer', 'name avatar')
    .populate('reviewee', 'name avatar')
    .populate('product', 'cropName');

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  res.json({
    success: true,
    data: review
  });
});

// @desc    Check if user can review an order
// @route   GET /api/reviews/order/:orderId/can-review
// @access  Private
const canReviewOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  const order = await Order.findById(orderId);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is part of this order
  const isBuyer = order.buyer.toString() === userId.toString();
  const isFarmer = order.farmer.toString() === userId.toString();

  if (!isBuyer && !isFarmer) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Check if order is completed
  const canReview = order.orderStatus === 'completed';

  // Check if review already exists
  const existingReview = await Review.findOne({
    order: orderId,
    reviewer: userId
  });

  res.json({
    success: true,
    data: {
      canReview: canReview && !existingReview,
      hasReviewed: !!existingReview,
      orderStatus: order.orderStatus,
      reviewType: isBuyer ? 'buyer_to_farmer' : 'farmer_to_buyer'
    }
  });
});

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { ratings, review } = req.body;
  const userId = req.user._id;

  const existingReview = await Review.findById(reviewId);

  if (!existingReview) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check authorization
  if (existingReview.reviewer.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }

  // Update ratings if provided
  if (ratings) {
    if (ratings.productQuality) {
      existingReview.ratings.productQuality = ratings.productQuality;
    }
    if (ratings.communication) {
      existingReview.ratings.communication = ratings.communication;
    }
    if (ratings.deliveryExperience) {
      existingReview.ratings.deliveryExperience = ratings.deliveryExperience;
    }
  }

  // Update review text if provided
  if (review !== undefined) {
    existingReview.review = review;
  }

  await existingReview.save();

  await existingReview.populate('reviewer', 'name avatar');
  await existingReview.populate('reviewee', 'name avatar');
  await existingReview.populate('product', 'cropName');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: existingReview
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check authorization
  if (review.reviewer.toString() !== userId.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  await Review.findByIdAndDelete(reviewId);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

module.exports = {
  createReview,
  getUserReviews,
  getOrderReview,
  canReviewOrder,
  updateReview,
  deleteReview
};

