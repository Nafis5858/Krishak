import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { getUserReviews } from '../services/reviewService';

const ReviewList = ({ userId, reviewType }) => {
  const [reviews, setReviews] = useState([]);
  const [averages, setAverages] = useState({
    productQuality: 0,
    communication: 0,
    deliveryExperience: 0,
    overall: 0
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchReviews(1);
  }, [userId, reviewType]);

  const fetchReviews = async (page) => {
    try {
      setLoading(true);
      const response = await getUserReviews(userId, {
        reviewType,
        limit: 10,
        page
      });
      setReviews(response.data.reviews);
      setAverages(response.data.averages);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= fullStars) {
            return <Star key={star} size={16} className="text-yellow-400 fill-yellow-400" />;
          } else if (star === fullStars + 1 && hasHalfStar) {
            return <Star key={star} size={16} className="text-yellow-400 fill-yellow-400 opacity-50" />;
          } else {
            return <Star key={star} size={16} className="text-gray-300" />;
          }
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Average Ratings Summary */}
      {averages.overall > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Average Ratings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall</p>
              <div className="flex items-center gap-2">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xl font-bold">{averages.overall.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Product Quality</p>
              <div className="flex items-center gap-2">
                {renderStars(averages.productQuality)}
                <span className="text-sm font-medium">{averages.productQuality.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Communication</p>
              <div className="flex items-center gap-2">
                {renderStars(averages.communication)}
                <span className="text-sm font-medium">{averages.communication.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Delivery</p>
              <div className="flex items-center gap-2">
                {renderStars(averages.deliveryExperience)}
                <span className="text-sm font-medium">{averages.deliveryExperience.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => fetchReviews(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchReviews(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;

