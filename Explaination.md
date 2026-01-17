# Complete Feature Explanation Guide for Viva
## Line-by-Line Code Walkthrough

---

## FEATURE 1: ADMIN LISTING MODERATION
### "Admins can review, approve, or reject listings and images to ensure authenticity and quality compliance"

### **Backend Flow:**

#### **1. Getting Pending Products** (`backend/controllers/adminController.js`)

```javascript
// Line 172-182: Get all products waiting for admin review
const getPendingProducts = asyncHandler(async (req, res) => {
  // Find all products with status 'pending' (awaiting review)
  const products = await Product.find({ status: 'pending' })
    // Populate farmer info so admin can see who created the listing
    .populate('farmer', 'name email phone farmLocation')
    // Sort by newest first (most recent listings appear first)
    .sort({ createdAt: -1 });

  // Return the list of pending products
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});
```

**Key Points:**
- Only products with `status: 'pending'` are shown
- Admin sees farmer details to verify authenticity
- Sorted by creation date (newest first)

---

#### **2. Approving a Product** (`backend/controllers/adminController.js`)

```javascript
// Line 187-209: Approve a product listing
const approveProduct = asyncHandler(async (req, res) => {
  // Get optional note from admin (e.g., "Looks good!")
  const { moderationNote } = req.body;

  // Find the product by ID
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // CHANGE STATUS: pending → approved
  product.status = 'approved';
  // Save admin's note (optional)
  product.moderationNote = moderationNote || '';
  // Track which admin approved it
  product.moderatedBy = req.user._id;  // Current admin's ID
  // Record when it was approved
  product.moderatedAt = Date.now();

  // Save to database
  await product.save();

  // Return success response
  res.json({
    success: true,
    data: product,
    message: 'Product approved successfully'
  });
});
```

**Key Points:**
- Changes status from `pending` → `approved`
- Records which admin approved it and when
- Once approved, product becomes visible to buyers

---

#### **3. Rejecting a Product** (`backend/controllers/adminController.js`)

```javascript
// Line 214-241: Reject a product listing
const rejectProduct = asyncHandler(async (req, res) => {
  // Get rejection reason (REQUIRED - admin must explain why)
  const { moderationNote } = req.body;

  // VALIDATION: Must provide reason for rejection
  if (!moderationNote) {
    res.status(400);
    throw new Error('Please provide a reason for rejection');
  }

  // Find the product
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // CHANGE STATUS: pending → rejected
  product.status = 'rejected';
  // Save rejection reason (required)
  product.moderationNote = moderationNote;
  // Track which admin rejected it
  product.moderatedBy = req.user._id;
  // Record when it was rejected
  product.moderatedAt = Date.now();

  // Save to database
  await product.save();

  res.json({
    success: true,
    data: product,
    message: 'Product rejected'
  });
});
```

**Key Points:**
- Rejection requires a reason (moderationNote is mandatory)
- Status changes to `rejected` (product won't be visible to buyers)
- Farmer can see why it was rejected

---

### **Frontend Flow:**

#### **1. Displaying Products for Moderation** (`frontend/src/pages/admin/ListingModeration.jsx`)

```javascript
// Line 26-52: Fetch products based on filter
const fetchProducts = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Build filter object
    const filters = {};
    if (filter !== 'all') filters.status = filter;  // 'pending', 'approved', 'rejected'
    if (searchQuery) filters.search = searchQuery;   // Search by name/category

    // Call API: If filter is 'pending', get only pending products
    // Otherwise, get all products with the filter
    const response = filter === 'pending' 
      ? await getPendingProducts()      // GET /api/admin/products/pending
      : await getAllProducts(filters);  // GET /api/admin/products?status=approved

    // Extract products from response
    const productsData = response.data || [];
    setProducts(productsData);  // Update state to display products
  } catch (error) {
    toast.error('Failed to fetch products');
  } finally {
    setLoading(false);
  }
};
```

---

#### **2. Approve Button Click** (`frontend/src/pages/admin/ListingModeration.jsx`)

```javascript
// Line 54-65: Handle approve action
const handleApprove = async () => {
  try {
    // Call API: PUT /api/admin/products/:id/approve
    await approveProduct(selectedProduct._id, moderationNote);
    
    toast.success('Product approved successfully');
    
    // Close modal and reset form
    setShowModal(false);
    setSelectedProduct(null);
    setModerationNote('');
    
    // Refresh the product list to show updated status
    fetchProducts();
  } catch (error) {
    toast.error('Failed to approve product');
  }
};
```

---

#### **3. Reject Button Click** (`frontend/src/pages/admin/ListingModeration.jsx`)

```javascript
// Line 67-82: Handle reject action
const handleReject = async () => {
  // VALIDATION: Must have rejection reason
  if (!moderationNote.trim()) {
    toast.error('Please provide a reason for rejection');
    return;
  }
  
  try {
    // Call API: PUT /api/admin/products/:id/reject
    await rejectProduct(selectedProduct._id, moderationNote);
    
    toast.success('Product rejected successfully');
    
    // Close modal and refresh list
    setShowModal(false);
    setSelectedProduct(null);
    setModerationNote('');
    fetchProducts();
  } catch (error) {
    toast.error('Failed to reject product');
  }
};
```

---

#### **4. Product Status Display** (`frontend/src/pages/admin/ListingModeration.jsx`)

```javascript
// Line 254-273: Show approve/reject buttons only for pending products
{product.status === 'pending' && (
  <div className="flex gap-2 pt-3 border-t">
    <Button
      variant="primary"
      onClick={() => openModal(product, 'approve')}  // Open approve modal
    >
      <Check className="w-4 h-4" />
      Approve
    </Button>
    <Button
      variant="danger"
      onClick={() => openModal(product, 'reject')}   // Open reject modal
    >
      <X className="w-4 h-4" />
      Reject
    </Button>
  </div>
)}
```

**Key Points:**
- Buttons only show for `status === 'pending'`
- Approved/rejected products don't show action buttons
- Admin can see product images, farmer details, and all information

---

## FEATURE 2: BUYER CART & ORDERING
### "Buyers can add items to a cart and place orders by selecting preferred delivery slots or map-based ordering"

### **Cart System:**

#### **1. Adding to Cart** (`frontend/src/context/CartContext.jsx`)

```javascript
// Cart Context manages cart state globally
const addToCart = (product, quantity = 1) => {
  // Check if product already in cart
  const existingItem = cartItems.find(item => item.product._id === product._id);
  
  if (existingItem) {
    // Update quantity if already exists
    updateQuantity(product._id, existingItem.quantity + quantity);
  } else {
    // Add new item to cart
    setCartItems([...cartItems, {
      product,
      quantity,
      pricePerUnit: product.sellingPrice
    }]);
  }
};
```

---

#### **2. Cart Validation** (`frontend/src/pages/buyer/Cart.jsx`)

```javascript
// Line 16-34: Checkout validation
const handleCheckout = () => {
  if (cartItems.length === 0) {
    toast.error('Your cart is empty');
    return;
  }
  
  // Check Minimum Order Quantity (MOQ)
  const itemsBelowMOQ = cartItems.filter(item => 
    item.product.moq && item.quantity < item.product.moq
  );
  
  if (itemsBelowMOQ.length > 0) {
    const firstItem = itemsBelowMOQ[0];
    toast.error(`${firstItem.product.cropName} requires a minimum order of ${firstItem.product.moq} ${firstItem.product.unit}`);
    return;
  }
  
  // Navigate to checkout page
  navigate('/buyer/checkout');
};
```

**Key Points:**
- Validates cart is not empty
- Checks if quantity meets Minimum Order Quantity (MOQ)
- Only allows checkout if all validations pass

---

### **Order Creation with Delivery Slots:**

#### **1. Delivery Slot Selection** (`frontend/src/pages/buyer/Checkout.jsx`)

```javascript
// Line 181-184: Delivery slot state
const [deliverySlot, setDeliverySlot] = useState({
  date: '',      // Selected date
  timeSlot: ''   // Selected time slot (e.g., "09:00 AM - 12:00 PM")
});

// Line 192-197: Available time slots
const timeSlots = [
  '09:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
  '06:00 PM - 09:00 PM'
];

// Line 200-210: Generate available dates (next 7 days)
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);  // Next 7 days
    dates.push(date);
  }
  return dates;
};
```

---

#### **2. Map-Based Address Selection** (`frontend/src/pages/buyer/Checkout.jsx`)

```javascript
// Line 178-180: Map selector state
const [showMapSelector, setShowMapSelector] = useState(false);
const [mapCoordinates, setMapCoordinates] = useState(null);  // {lat, lng}
const [mapAddress, setMapAddress] = useState('');

// When user clicks "Select on Map"
<Button onClick={() => setShowMapSelector(true)}>
  <MapPin className="w-4 h-4" />
  Select on Map
</Button>

// MapSelector component allows user to:
// 1. Click on map to set coordinates
// 2. Reverse geocode to get address
// 3. Save coordinates and address
```

---

#### **3. Creating Order** (`backend/controllers/orderController.js`)

```javascript
// Line 10-150: Create order endpoint
const createOrder = asyncHandler(async (req, res) => {
  // Extract order data from request
  const { 
    productId, quantity, pricePerUnit, deliveryAddress, 
    paymentMethod, isPreOrder, deliverySlot, notes, 
    vehicleType, deliveryFee 
  } = req.body;

  // VALIDATION: Check required fields
  if (!productId || !quantity || !pricePerUnit || !deliveryAddress) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  // Start database transaction (ensures atomicity)
  const session = await Product.startSession();
  session.startTransaction();

  try {
    // Find product and lock it (prevents race conditions)
    const product = await Product.findById(productId).session(session);
    
    // Check product is approved
    if (product.status !== 'approved') {
      throw new Error('Product is not available');
    }

    // Check quantity availability
    if (quantity > product.quantity) {
      throw new Error(`Insufficient stock. Available: ${product.quantity}`);
    }

    // Check MOQ (Minimum Order Quantity)
    if (product.quantity >= product.moq && quantity < product.moq) {
      throw new Error(`Minimum order quantity is ${product.moq}`);
    }

    // Calculate total price
    const totalPrice = quantity * pricePerUnit;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Calculate estimated delivery date from delivery slot
    let estimatedDeliveryDate;
    if (deliverySlot?.estimatedDateTime) {
      estimatedDeliveryDate = new Date(deliverySlot.estimatedDateTime);
    } else if (deliverySlot?.date) {
      estimatedDeliveryDate = new Date(deliverySlot.date);
    } else {
      // Default: 1 week from now
      estimatedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Calculate fees
    const actualDeliveryFee = deliveryFee || totalPrice * 0.05;
    const platformFee = Math.round((totalPrice + actualDeliveryFee) * 0.05);
    const farmerEarnings = totalPrice - platformFee;

    // CREATE ORDER in database
    const order = await Order.create([{
      orderNumber,
      buyer: req.user._id,        // Current user (buyer)
      farmer: product.farmer,    // Product owner
      product: productId,
      quantity,
      pricePerUnit,
      totalPrice,
      priceBreakdown: {
        farmerEarnings,
        platformFee,
        transportFee: actualDeliveryFee
      },
      deliveryAddress,            // From map selector or manual input
      paymentMethod,
      orderStatus: 'confirmed',   // Auto-confirm
      isPreOrder: isPreOrder || false,
      estimatedDeliveryDate,
      deliverySlot: deliverySlot ? {
        date: deliverySlot.date ? new Date(deliverySlot.date) : undefined,
        timeSlot: deliverySlot.timeSlot,  // "09:00 AM - 12:00 PM"
        estimatedDateTime: deliverySlot.estimatedDateTime ? new Date(deliverySlot.estimatedDateTime) : undefined
      } : undefined,
      notes: notes || undefined,
      statusHistory: [{
        status: 'confirmed',
        note: 'Order placed and confirmed automatically',
        timestamp: new Date()
      }]
    }], { session });

    // Update product quantity (reduce stock)
    if (isPreOrder) {
      product.status = 'pending';  // Reserve for pre-order
    } else {
      product.quantity = product.quantity - quantity;  // Deduct stock
      if (product.quantity <= 0) {
        product.status = 'sold';  // Mark as sold if out of stock
      }
    }
    
    await product.save({ session });

    // Commit transaction (all or nothing)
    await session.commitTransaction();
    session.endSession();

    // Send notifications to farmer and buyer
    await notifyOrderPlaced(order[0]);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order[0]
    });
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
```

**Key Points:**
- Uses database transaction to ensure data consistency
- Validates stock availability and MOQ
- Stores delivery slot (date + time)
- Stores map coordinates in deliveryAddress
- Automatically reduces product quantity
- Sends notifications

---

## FEATURE 3: NOTIFICATION SYSTEM
### "The system sends in-app and SMS notifications for price changes, order updates, transporter assignments, and reminders"

### **Notification Creation:**

#### **1. Helper Function** (`backend/utils/notificationHelper.js`)

```javascript
// Line 14-53: Create notification function
const createNotification = async ({
  userId,           // Who to notify
  type,             // Notification type (e.g., 'order_placed')
  title,            // Notification title
  message,          // Notification message
  relatedOrder = null,
  relatedProduct = null,
  metadata = {}     // Additional data
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedOrder,
      relatedProduct,
      metadata,
      isRead: false  // Default: unread
    });

    return notification;
  } catch (error) {
    // Don't break main flow if notification fails
    return null;
  }
};
```

---

#### **2. Order Placed Notification** (`backend/utils/notificationHelper.js`)

```javascript
// Line 58-86: Notify when order is placed
const notifyOrderPlaced = async (order) => {
  // Notify FARMER about new order
  await createNotification({
    userId: order.farmer,
    type: 'order_placed',
    title: 'New Order Received',
    message: `You have received a new order #${order.orderNumber} for ${order.quantity} kg.`,
    relatedOrder: order._id,
    relatedProduct: order.product,
    metadata: {
      orderNumber: order.orderNumber,
      quantity: order.quantity,
      totalPrice: order.totalPrice
    }
  });

  // Notify BUYER about order confirmation
  await createNotification({
    userId: order.buyer,
    type: 'order_confirmed',
    title: 'Order Confirmed',
    message: `Your order #${order.orderNumber} has been confirmed and is being processed.`,
    relatedOrder: order._id,
    relatedProduct: order.product,
    metadata: {
      orderNumber: order.orderNumber
    }
  });
};
```

---

#### **3. Delivery Assignment Notification** (`backend/utils/notificationHelper.js`)

```javascript
// Line 133-157: Notify when transporter is assigned
const notifyDeliveryAssigned = async (order, transporterId) => {
  // Notify TRANSPORTER
  await createNotification({
    userId: transporterId,
    type: 'delivery_assigned',
    title: 'New Delivery Assignment',
    message: `You have been assigned to deliver order #${order.orderNumber}.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });

  // Notify BUYER
  await createNotification({
    userId: order.buyer,
    type: 'delivery_assigned',
    title: 'Delivery Assigned',
    message: `A transporter has been assigned to deliver your order #${order.orderNumber}.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });
};
```

---

#### **4. Order Delivered Notification** (`backend/utils/notificationHelper.js`)

```javascript
// Line 185-249: Notify when order is delivered
const notifyOrderDelivered = async (order) => {
  // Notify BUYER
  await createNotification({
    userId: order.buyer,
    type: 'order_delivered',
    title: 'Order Delivered',
    message: `Your order #${order.orderNumber} has been delivered successfully.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });

  // Notify FARMER
  await createNotification({
    userId: order.farmer,
    type: 'order_delivered',
    title: 'Order Delivered',
    message: `Order #${order.orderNumber} has been delivered to the buyer.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });

  // Notify TRANSPORTER about payment
  if (order.transporter) {
    const deliveryFee = order.priceBreakdown?.transportFee || 0;
    
    await createNotification({
      userId: order.transporter,
      type: 'delivery_payment',
      title: '🚚 Delivery Payment Received!',
      message: `You have completed delivery for order #${order.orderNumber} and earned ৳${deliveryFee}.`,
      relatedOrder: order._id,
      metadata: {
        orderNumber: order.orderNumber,
        deliveryFee: deliveryFee
      }
    });
  }
};
```

---

### **Frontend Notification Display:**

#### **1. Fetching Notifications** (`frontend/src/components/NotificationDropdown.jsx`)

```javascript
// Line 18-41: Fetch notifications from API
const fetchNotifications = async () => {
  try {
    setLoading(true);
    // Call API: GET /api/notifications?limit=20
    const response = await notificationService.getNotifications({ limit: 20 });
    
    // Update state with notifications
    setNotifications(response.data.notifications || []);
    setUnreadCount(response.data.unreadCount || 0);
  } catch (error) {
    // Handle error silently
  } finally {
    setLoading(false);
  }
};

// Line 64-67: Fetch on component mount
useEffect(() => {
  fetchUnreadCount();
  fetchNotifications();
}, []);

// Line 70-81: Poll for new notifications every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (!connectionError) {
      fetchUnreadCount();  // Check for new notifications
      if (isOpen) {
        fetchNotifications();  // Refresh list if dropdown is open
      }
    }
  }, 30000);  // Every 30 seconds

  return () => clearInterval(interval);
}, [isOpen, connectionError]);
```

---

#### **2. Displaying Notifications** (`frontend/src/components/NotificationDropdown.jsx`)

```javascript
// Line 166-185: Get icon based on notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'order_placed':
    case 'order_confirmed':
      return <ShoppingCart className="w-5 h-5 text-blue-500" />;
    case 'order_completed':
    case 'order_delivered':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'order_cancelled':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'delivery_assigned':
    case 'delivery_picked':
      return <Truck className="w-5 h-5 text-purple-500" />;
    default:
      return <Package className="w-5 h-5 text-gray-500" />;
  }
};

// Line 265-308: Render notification list
{notifications.map((notification) => (
  <div
    key={notification._id}
    onClick={() => handleNotificationClick(notification)}
    className={`p-4 hover:bg-gray-50 cursor-pointer ${
      !notification.isRead ? 'bg-blue-50' : ''  // Highlight unread
    }`}
  >
    <div className="flex items-start gap-3">
      {getNotificationIcon(notification.type)}
      <div>
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-gray-600">{notification.message}</p>
        <p className="text-xs text-gray-400">{formatDate(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>
  </div>
))}
```

---

#### **3. Mark as Read** (`frontend/src/components/NotificationDropdown.jsx`)

```javascript
// Line 106-132: Handle notification click
const handleNotificationClick = async (notification) => {
  // Mark as read if unread
  if (!notification.isRead) {
    try {
      // Call API: PUT /api/notifications/:id/read
      await notificationService.markAsRead(notification._id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notification._id
            ? { ...n, isRead: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Navigate to related page
  if (notification.relatedOrder) {
    navigate(`/buyer/orders/${notification.relatedOrder}`);
  } else if (notification.relatedProduct) {
    navigate(`/browse-products`);
  }

  setIsOpen(false);
};
```

---

## FEATURE 4: RATING & REVIEW SYSTEM
### "After order completion, farmers and buyers can rate and review each other based on quality, communication, and delivery experience"

### **Creating a Review:**

#### **1. Review Creation** (`backend/controllers/reviewController.js`)

```javascript
// Line 10-89: Create review endpoint
const createReview = asyncHandler(async (req, res) => {
  // Only buyers can create reviews
  if (req.user.role !== 'buyer') {
    res.status(403);
    throw new Error('Only buyers can create reviews');
  }

  const { productId, orderId, rating, comment, aspects } = req.body;
  const buyerId = req.user._id;

  // VALIDATION: Check required fields
  if (!productId || !orderId || !rating || !comment) {
    res.status(400);
    throw new Error('Please provide productId, orderId, rating, and comment');
  }

  // VALIDATION: Rating must be 1-5
  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if order exists and belongs to buyer
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.buyer.toString() !== buyerId.toString()) {
    res.status(403);
    throw new Error('Not authorized to review this order');
  }

  // VALIDATION: Can only review completed orders
  if (order.orderStatus !== 'completed' && order.deliveryStatus !== 'delivered') {
    res.status(400);
    throw new Error('You can only review orders that have been completed or delivered');
  }

  // VALIDATION: Product must match order
  if (order.product.toString() !== productId.toString()) {
    res.status(400);
    throw new Error('Product does not match the order');
  }

  // VALIDATION: Check if review already exists
  const existingReview = await Review.findOne({ order: orderId });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this order');
  }

  // CREATE REVIEW
  const review = await Review.create({
    buyer: buyerId,
    product: productId,
    order: orderId,
    rating,              // Overall rating (1-5)
    comment,             // Review text
    aspects: aspects || {},  // Detailed ratings (quality, freshness, etc.)
    isVerified: true     // Verified purchase (only from completed orders)
  });

  // Populate buyer info for response
  await review.populate('buyer', 'name avatar');

  // Update product average rating
  await updateProductRating(productId);

  // Update farmer rating
  if (order.farmer) {
    await updateFarmerRating(order.farmer);
  }

  res.status(201).json({
    success: true,
    data: review
  });
});
```

**Key Points:**
- Only buyers can review
- Can only review completed/delivered orders
- One review per order
- Automatically updates product and farmer ratings

---

#### **2. Update Product Rating** (`backend/controllers/reviewController.js`)

```javascript
// Line 269-289: Calculate and update product average rating
const updateProductRating = async (productId) => {
  // Aggregate all reviews for this product
  const stats = await Review.aggregate([
    { $match: { product: productId, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },  // Calculate average
        totalReviews: { $sum: 1 }             // Count reviews
      }
    }
  ]);

  if (stats.length > 0) {
    // Update product with new rating stats
    await Product.findByIdAndUpdate(productId, {
      $set: {
        averageRating: stats[0].averageRating,  // e.g., 4.5
        reviewCount: stats[0].totalReviews       // e.g., 10
      }
    });
  }
};
```

---

#### **3. Update Farmer Rating** (`backend/controllers/reviewController.js`)

```javascript
// Line 292-317: Calculate and update farmer's overall rating
const updateFarmerRating = async (farmerId) => {
  // Get all products by this farmer
  const products = await Product.find({ farmer: farmerId });
  const productIds = products.map(p => p._id);

  // Aggregate all reviews for all farmer's products
  const stats = await Review.aggregate([
    { $match: { product: { $in: productIds }, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },  // Average across all products
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    // Update farmer's user profile with rating
    await User.findByIdAndUpdate(farmerId, {
      $set: {
        'rating.average': stats[0].averageRating,
        'rating.count': stats[0].totalReviews
      }
    });
  }
};
```

**Key Points:**
- Farmer rating = average of all reviews for all their products
- Updated automatically when new review is created

---

### **Frontend Review Form:**

#### **1. Review Form Component** (`frontend/src/components/ReviewForm.jsx`)

```javascript
// Line 20-61: Submit review
const handleSubmit = async (e) => {
  e.preventDefault();

  // VALIDATION: Must select rating
  if (rating === 0) {
    toast.error('Please select a rating');
    return;
  }

  // VALIDATION: Must write comment
  if (!comment.trim()) {
    toast.error('Please write a review comment');
    return;
  }

  // VALIDATION: Comment must be at least 10 characters
  if (comment.trim().length < 10) {
    toast.error('Review comment must be at least 10 characters');
    return;
  }

  setSubmitting(true);
  try {
    // Call API: POST /api/reviews
    await reviewService.createReview({
      productId: product._id,
      orderId: order._id,
      rating,                    // Overall rating (1-5)
      comment: comment.trim(),   // Review text
      aspects: Object.values(aspects).some(v => v > 0) ? aspects : undefined
      // aspects: { quality: 5, freshness: 4, packaging: 5, value: 4 }
    });

    toast.success('Review submitted successfully!');
    if (onReviewSubmitted) {
      onReviewSubmitted();  // Refresh reviews list
    }
    if (onClose) {
      onClose();  // Close modal
    }
  } catch (error) {
    toast.error('Failed to submit review');
  } finally {
    setSubmitting(false);
  }
};
```

---

#### **2. Star Rating Component** (`frontend/src/components/ReviewForm.jsx`)

```javascript
// Line 63-79: Star rating input
const StarRating = ({ value, onHover, onClick }) => (
  <button
    type="button"
    onMouseEnter={() => onHover(value)}  // Highlight on hover
    onMouseLeave={() => onHover(0)}      // Reset on leave
    onClick={() => onClick(value)}       // Set rating on click
  >
    <Star
      className={`w-6 h-6 transition-colors ${
        value <= (hoveredRating || rating)  // Show filled if selected or hovered
          ? 'text-yellow-500 fill-current'
          : 'text-gray-300'
      }`}
    />
  </button>
);

// Usage: Render 5 stars
{[1, 2, 3, 4, 5].map((value) => (
  <StarRating
    key={value}
    value={value}
    onHover={setHoveredRating}
    onClick={setRating}
  />
))}
```

---

#### **3. Aspect Ratings** (`frontend/src/components/ReviewForm.jsx`)

```javascript
// Line 81-103: Detailed aspect ratings
const AspectRating = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}  // Set rating for this aspect
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              star <= value
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

// Usage: Rate different aspects
<AspectRating
  label="Product Quality"
  value={aspects.quality}
  onChange={(value) => setAspects({ ...aspects, quality: value })}
/>
<AspectRating
  label="Freshness"
  value={aspects.freshness}
  onChange={(value) => setAspects({ ...aspects, freshness: value })}
/>
<AspectRating
  label="Packaging"
  value={aspects.packaging}
  onChange={(value) => setAspects({ ...aspects, packaging: value })}
/>
<AspectRating
  label="Value for Money"
  value={aspects.value}
  onChange={(value) => setAspects({ ...aspects, value: value })}
/>
```

---

#### **4. Getting Product Reviews** (`backend/controllers/reviewController.js`)

```javascript
// Line 95-188: Get reviews for a product
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

  // Build sort query
  let sortQuery = {};
  switch (sortBy) {
    case 'newest':
      sortQuery = { createdAt: -1 };
      break;
    case 'oldest':
      sortQuery = { createdAt: 1 };
      break;
    case 'highest':
      sortQuery = { rating: -1 };
      break;
    case 'lowest':
      sortQuery = { rating: 1 };
      break;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get reviews
  const reviews = await Review.find({ 
    product: productId, 
    isVisible: true 
  })
    .populate('buyer', 'name avatar')
    .sort(sortQuery)
    .skip(skip)
    .limit(limitNum);

  const total = await Review.countDocuments({ 
    product: productId, 
    isVisible: true 
  });

  // Calculate rating statistics
  const ratingStats = await Review.aggregate([
    { $match: { product: productId, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: { $push: '$rating' }
      }
    }
  ]);

  // Calculate distribution (how many 5-star, 4-star, etc.)
  let stats = {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };

  if (ratingStats.length > 0) {
    const distribution = ratingStats[0].ratingDistribution;
    stats.averageRating = ratingStats[0].averageRating || 0;
    stats.totalReviews = ratingStats[0].totalReviews || 0;
    
    distribution.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        stats.ratingDistribution[rating]++;
      }
    });
  }

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    },
    stats  // Average rating, total reviews, distribution
  });
});
```

---

## SUMMARY FOR VIVA

### **Feature 1: Admin Moderation**
- **Flow**: Farmer creates listing → Status = 'pending' → Admin reviews → Approve/Reject → Status changes
- **Key Files**: `adminController.js`, `ListingModeration.jsx`
- **Database**: Product model has `status`, `moderatedBy`, `moderatedAt`, `moderationNote`

### **Feature 2: Cart & Ordering**
- **Flow**: Add to cart → Validate MOQ → Checkout → Select delivery slot/map → Create order → Reduce stock
- **Key Files**: `CartContext.jsx`, `Cart.jsx`, `Checkout.jsx`, `orderController.js`
- **Database**: Order model stores `deliverySlot`, `deliveryAddress.coordinates`, `deliveryVehicle`

### **Feature 3: Notifications**
- **Flow**: Event occurs → `notificationHelper.js` creates notification → Stored in database → Frontend polls every 30s → Display in dropdown
- **Key Files**: `notificationHelper.js`, `notificationController.js`, `NotificationDropdown.jsx`
- **Database**: Notification model stores `type`, `title`, `message`, `isRead`, `relatedOrder`

### **Feature 4: Reviews**
- **Flow**: Order completed → Buyer can review → Submit rating + comment + aspects → Update product/farmer ratings
- **Key Files**: `reviewController.js`, `ReviewForm.jsx`
- **Database**: Review model stores `rating`, `comment`, `aspects`, `isVerified`

---

## COMMON VIVA QUESTIONS & ANSWERS

**Q: How do you ensure only approved products are shown to buyers?**
A: In `productController.js` line 79-80, we filter: `if (req.user?.role !== 'admin') { query.status = 'approved'; }`

**Q: How do you prevent duplicate orders for the same product?**
A: We use database transactions (line 20-21 in `orderController.js`) and lock the product document to prevent race conditions.

**Q: How do notifications work in real-time?**
A: Frontend polls the API every 30 seconds (line 70-81 in `NotificationDropdown.jsx`) to check for new notifications.

**Q: How do you calculate farmer ratings?**
A: We aggregate all reviews for all products by that farmer and calculate the average (line 292-317 in `reviewController.js`).

**Q: What happens if admin rejects a product?**
A: Status changes to 'rejected', product becomes invisible to buyers, and farmer can see the rejection reason in `moderationNote`.

---

Good luck with your viva! 🎓

