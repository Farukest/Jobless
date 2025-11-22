const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function assignSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Role = mongoose.model('Role', new mongoose.Schema({}, { strict: false }));

    const walletAddress = '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9';

    // Find user by wallet address (case-insensitive)
    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!user) {
      console.log('❌ User not found with wallet address:', walletAddress);
      process.exit(1);
    }

    console.log('✅ Found user:', user.displayName || user.walletAddress);

    // Find super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });

    if (!superAdminRole) {
      console.log('❌ super_admin role not found. Please run seed-roles.js first.');
      process.exit(1);
    }

    console.log('✅ Found super_admin role:', superAdminRole.displayName);

    // Check if user already has super_admin role
    const hasSuperAdmin = user.roles.some(r => r.toString() === superAdminRole._id.toString());

    if (hasSuperAdmin) {
      console.log('ℹ️  User already has super_admin role');
    } else {
      // Add super_admin role
      user.roles.push(superAdminRole._id);
      await user.save();
      console.log('✅ super_admin role added to user');
    }

    // Display all user roles
    const userWithRoles = await User.findById(user._id).populate('roles', 'name displayName');
    console.log('\n📋 User roles:', userWithRoles.roles.map(r => r.displayName || r.name).join(', '));

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignSuperAdmin();
