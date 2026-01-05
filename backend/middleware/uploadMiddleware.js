const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const uploadsProductsDir = path.join(__dirname, '../uploads/products');
const uploadsDeliveriesDir = path.join(__dirname, '../uploads/deliveries');

if (!fs.existsSync(uploadsProductsDir)) {
  fs.mkdirSync(uploadsProductsDir, { recursive: true });
}
if (!fs.existsSync(uploadsDeliveriesDir)) {
  fs.mkdirSync(uploadsDeliveriesDir, { recursive: true });
}

// Dynamic storage based on route
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on the route
    if (req.baseUrl.includes('transporter') || req.path.includes('delivery')) {
      cb(null, uploadsDeliveriesDir);
    } else {
      cb(null, uploadsProductsDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log('📸 File upload attempt:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Accept all common image formats
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml'
  ];
  
  if (file.mimetype.startsWith('image/') || allowedMimeTypes.includes(file.mimetype)) {
    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rejected:', file.mimetype);
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
