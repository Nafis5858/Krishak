import api from './api';

// Create a new order
export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response;
};

// Get user's orders
export const getMyOrders = async () => {
  const response = await api.get('/orders/my-orders');
  return response;
};

// Get single order
export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response;
};

// Alias for getOrder
export const getOrderById = getOrder;

// Update order status (for farmers)
export const updateOrderStatus = async (id, statusData) => {
  const response = await api.put(`/orders/${id}/status`, statusData);
  return response;
};

// Get buyer dashboard stats
export const getBuyerStats = async () => {
  // Add timestamp to prevent caching
  const response = await api.get('/orders/stats/buyer', {
    params: { _t: Date.now() }
  });
  return response;
};

// Get transporter dashboard stats
export const getTransporterStats = async () => {
  const response = await api.get('/orders/stats/transporter');
  return response;
};

// Confirm pickup with photo
export const confirmPickup = async (orderId, photoFile) => {
  const formData = new FormData();
  formData.append('pickupPhoto', photoFile);
  
  const response = await api.post(`/orders/${orderId}/confirm-pickup`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response;
};

// Get order details with photo URLs
export const getOrderDetails = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  
  // Ensure photo URLs are absolute
  if (response.pickupPhoto && !response.pickupPhoto.startsWith('http')) {
    response.pickupPhoto = `${api.defaults.baseURL}${response.pickupPhoto}`;
  }
  if (response.deliveryPhoto && !response.deliveryPhoto.startsWith('http')) {
    response.deliveryPhoto = `${api.defaults.baseURL}${response.deliveryPhoto}`;
  }
  
  return response;
};

// Confirm delivery with photo
export const confirmDelivery = async (orderId, photoFile) => {
  const formData = new FormData();
  formData.append('deliveryPhoto', photoFile);
  
  const response = await api.post(`/orders/${orderId}/confirm-delivery`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response;
};

// Get transporter orders
export const getTransporterOrders = async (status = null) => {
  const params = status ? `?status=${status}` : '';
  const response = await api.get(`/orders/transporter${params}`);
  return response;
};

export const orderService = {
  createOrder,
  getMyOrders,
  getOrder,
  getOrderById: getOrder,
  updateOrderStatus,
  getBuyerStats,
  getTransporterStats,
  confirmPickup,
  confirmDelivery,
  getOrderDetails,
  getTransporterOrders,
};

export default orderService;