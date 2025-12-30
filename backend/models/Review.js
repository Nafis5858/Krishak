const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer reference is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    trim: true
  },
  // Additional review aspects
  aspects: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    freshness: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isVerified: {
    type: Boolean,
    default: false // Verified purchase
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ buyer: 1 });
reviewSchema.index({ order: 1 }, { unique: true }); // One review per order
reviewSchema.index({ rating: 1 });

// Prevent duplicate reviews for the same order
reviewSchema.index({ order: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

