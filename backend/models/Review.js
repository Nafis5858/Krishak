const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required'],
    index: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer reference is required'],
    index: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee reference is required'],
    index: true
  },
  // Review type: 'buyer_to_farmer' or 'farmer_to_buyer'
  reviewType: {
    type: String,
    enum: ['buyer_to_farmer', 'farmer_to_buyer'],
    required: true,
    index: true
  },
  // Detailed ratings (1-5 stars each)
  ratings: {
    productQuality: {
      type: Number,
      required: [true, 'Product quality rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    communication: {
      type: Number,
      required: [true, 'Communication rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    deliveryExperience: {
      type: Number,
      required: [true, 'Delivery experience rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  // Overall rating (calculated average)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Written review
  review: {
    type: String,
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
    trim: true
  },
  // Product reference for context
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  // Helpful count (for future feature)
  helpfulCount: {
    type: Number,
    default: 0
  },
  // Status
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
reviewSchema.index({ reviewee: 1, reviewType: 1 });
reviewSchema.index({ order: 1, reviewer: 1 }, { unique: true }); // One review per order per reviewer
reviewSchema.index({ createdAt: -1 });

// Calculate overall rating before saving
reviewSchema.pre('save', function(next) {
  if (this.isModified('ratings')) {
    const { productQuality, communication, deliveryExperience } = this.ratings;
    this.overallRating = Math.round(
      ((productQuality + communication + deliveryExperience) / 3) * 10
    ) / 10; // Round to 1 decimal place
  }
  next();
});

// Update user's average rating after review is saved
reviewSchema.post('save', async function() {
  await updateUserRating(this.reviewee);
});

// Update user's average rating after review is deleted
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateUserRating(doc.reviewee);
  }
});

// Helper function to update user's average rating
async function updateUserRating(userId) {
  const Review = mongoose.model('Review');
  const User = mongoose.model('User');
  
  const reviews = await Review.find({ 
    reviewee: userId, 
    isVisible: true 
  });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    
    await User.findByIdAndUpdate(userId, {
      'rating.average': averageRating,
      'rating.count': reviews.length
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      'rating.average': 0,
      'rating.count': 0
    });
  }
}

module.exports = mongoose.model('Review', reviewSchema);

