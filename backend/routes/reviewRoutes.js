const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getBuyerReviews,
  checkCanReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/product/:productId', getProductReviews);
router.get('/buyer/:buyerId', getBuyerReviews);

// Protected routes - Only buyers can create reviews and check review status
router.use(protect);
router.post('/', authorize('buyer'), createReview);
router.get('/check/:orderId', authorize('buyer'), checkCanReview);

module.exports = router;

