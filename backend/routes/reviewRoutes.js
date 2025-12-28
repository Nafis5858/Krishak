const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getOrderReview,
  canReviewOrder,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Create review
router.post('/', createReview);

// Get reviews for a user (public endpoint, but we'll keep it protected for now)
router.get('/user/:userId', getUserReviews);

// Get review for specific order
router.get('/order/:orderId', getOrderReview);

// Check if user can review an order
router.get('/order/:orderId/can-review', canReviewOrder);

// Update review
router.put('/:reviewId', updateReview);

// Delete review
router.delete('/:reviewId', deleteReview);

module.exports = router;

