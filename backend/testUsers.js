const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ MongoDB Connected');
  
  const User = require('./models/User');
  
  // Count all users
  const totalUsers = await User.countDocuments();
  console.log(`\n📊 Total Users in Database: ${totalUsers}`);
  
  // Get all users
  const users = await User.find().select('-password');
  
  console.log('\n👥 Users List:');
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Verified: ${user.isVerified}`);
    console.log(`   Phone: ${user.phone || 'Not set'}`);
    console.log(`   Created: ${user.createdAt}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});
