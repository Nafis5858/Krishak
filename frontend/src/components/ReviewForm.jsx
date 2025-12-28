import React, { useState, useEffect } from 'react';
import { Star, X, Send } from 'lucide-react';
import { createReview, canReviewOrder } from '../services/reviewService';
import { toast } from 'react-toastify';

const ReviewForm = ({ order, onClose, onSuccess }) => {
  const [ratings, setRatings] = useState({
    productQuality: 5,
    communication: 5,
    deliveryExperience: 5
  });
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCanReview = async () => {
      try {
        const response = await canReviewOrder(order._id);
        setCanReview(response.data.canReview);
      } catch (error) {
        console.error('Error checking review status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (order) {
      checkCanReview();
    }
  }, [order]);

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canReview) {
      toast.error('You cannot review this order');
      return;
    }

    setSubmitting(true);
    try {
      await createReview(order._id, ratings, review);
      toast.success('Review submitted successfully!');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      toast.error(error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Cannot Review</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600">
            {order.orderStatus !== 'completed' 
              ? 'You can only review completed orders.'
              : 'You have already reviewed this order.'}
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const renderStars = (category, value) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className="focus:outline-none"
          >
            <Star
              size={24}
              className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h3 className="text-2xl font-semibold">Write a Review</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="font-semibold">{order.orderNumber}</p>
            {order.product && (
              <>
                <p className="text-sm text-gray-600 mt-2 mb-1">Product</p>
                <p className="font-semibold">{order.product.cropName || 'N/A'}</p>
              </>
            )}
          </div>

          {/* Product Quality Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Quality
            </label>
            <div className="flex items-center gap-4">
              {renderStars('productQuality', ratings.productQuality)}
              <span className="text-sm text-gray-600">
                {ratings.productQuality} / 5
              </span>
            </div>
          </div>

          {/* Communication Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication
            </label>
            <div className="flex items-center gap-4">
              {renderStars('communication', ratings.communication)}
              <span className="text-sm text-gray-600">
                {ratings.communication} / 5
              </span>
            </div>
          </div>

          {/* Delivery Experience Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Experience
            </label>
            <div className="flex items-center gap-4">
              {renderStars('deliveryExperience', ratings.deliveryExperience)}
              <span className="text-sm text-gray-600">
                {ratings.deliveryExperience} / 5
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this order..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="5"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {review.length} / 1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;

