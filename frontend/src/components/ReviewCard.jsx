import React from 'react';
import { Star, User } from 'lucide-react';

const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            {review.reviewer?.avatar ? (
              <img
                src={review.reviewer.avatar}
                alt={review.reviewer.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User size={20} className="text-green-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{review.reviewer?.name || 'Anonymous'}</p>
            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold">{review.overallRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Ratings Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b">
        <div>
          <p className="text-xs text-gray-600 mb-1">Product Quality</p>
          {renderStars(review.ratings.productQuality)}
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Communication</p>
          {renderStars(review.ratings.communication)}
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Delivery</p>
          {renderStars(review.ratings.deliveryExperience)}
        </div>
      </div>

      {/* Review Text */}
      {review.review && (
        <p className="text-gray-700 text-sm leading-relaxed">{review.review}</p>
      )}

      {/* Product Info */}
      {review.product && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            Product: <span className="font-medium text-gray-700">{review.product.cropName}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;

