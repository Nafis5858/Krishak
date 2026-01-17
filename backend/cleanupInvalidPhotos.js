const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const Order = require('./models/Order');

const cleanupInvalidPhotos = async () => {
  try {
    console.log('\n🔍 Checking for invalid photo URLs in orders...\n');

    // Get all orders with photos
    const orders = await Order.find({
      $or: [
        { 'pickupPhoto.url': { $exists: true, $ne: null } },
        { 'deliveryProofPhoto.url': { $exists: true, $ne: null } },
        { 'statusHistory.photo': { $exists: true, $ne: null } }
      ]
    });

    console.log(`Found ${orders.length} orders with photos\n`);

    let invalidCount = 0;
    let validCount = 0;

    for (const order of orders) {
      let updated = false;

      // Check pickup photo
      if (order.pickupPhoto?.url) {
        const filePath = path.join(__dirname, order.pickupPhoto.url);
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Invalid pickup photo: ${order.pickupPhoto.url} (Order: ${order.orderNumber})`);
          order.pickupPhoto = undefined;
          updated = true;
          invalidCount++;
        } else {
          validCount++;
        }
      }

      // Check delivery proof photo
      if (order.deliveryProofPhoto?.url) {
        const filePath = path.join(__dirname, order.deliveryProofPhoto.url);
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Invalid delivery photo: ${order.deliveryProofPhoto.url} (Order: ${order.orderNumber})`);
          order.deliveryProofPhoto = undefined;
          updated = true;
          invalidCount++;
        } else {
          validCount++;
        }
      }

      // Check status history photos
      if (order.statusHistory && order.statusHistory.length > 0) {
        order.statusHistory.forEach((entry, index) => {
          if (entry.photo) {
            const filePath = path.join(__dirname, entry.photo);
            if (!fs.existsSync(filePath)) {
              console.log(`❌ Invalid status history photo: ${entry.photo} (Order: ${order.orderNumber})`);
              order.statusHistory[index].photo = null;
              updated = true;
              invalidCount++;
            } else {
              validCount++;
            }
          }
        });
      }

      // Save if updated
      if (updated) {
        await order.save();
        console.log(`✅ Updated order: ${order.orderNumber}\n`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Valid photos: ${validCount}`);
    console.log(`   ❌ Invalid photos removed: ${invalidCount}`);
    console.log(`   📦 Orders processed: ${orders.length}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
};

cleanupInvalidPhotos();
