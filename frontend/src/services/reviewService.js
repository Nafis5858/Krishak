import api from './api';

// Create a review for an order
export const createReview = async (orderId, ratings, review) => {
  const response = await api.post('/reviews', {
    orderId,
    ratings,
    review
  });
  return response;
};

// Get reviews for a user
export const getUserReviews = async (userId, options = {}) => {
  const { reviewType, limit = 20, page = 1 } = options;
  const params = { limit, page };
  if (reviewType) params.reviewType = reviewType;
  
  const response = await api.get(`/reviews/user/${userId}`, { params });
  return response;
};

// Get review for a specific order
export const getOrderReview = async (orderId) => {
  const response = await api.get(`/reviews/order/${orderId}`);
  return response;
};

// Check if user can review an order
export const canReviewOrder = async (orderId) => {
  const response = await api.get(`/reviews/order/${orderId}/can-review`);
  return response;
};

// Update a review
export const updateReview = async (reviewId, ratings, review) => {
  const response = await api.put(`/reviews/${reviewId}`, {
    ratings,
    review
  });
  return response;
};

// Delete a review
export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response;
};

