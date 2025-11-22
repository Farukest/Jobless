// Verify new user with ObjectId-based roles
const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./src/models/User.model');
const { Role } = require('./src/models/Role.model');

async function verifyNewUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ walletAddress: '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9' })
      .populate('roles', 'name displayName');

    if (!user) {
      console.log('❌ User not found with wallet: 0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9');
      return;
    }

    console.log('✅ User found!');
    console.log('═'.repeat(80));
    console.log(`User ID: ${user._id}`);
    console.log(`Wallet Address: ${user.walletAddress}`);
    console.log(`Status: ${user.status}`);
    console.log(`Wallet Verified: ${user.isWalletVerified}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log('\n📋 Roles:');

    // Check if roles are ObjectIds or strings
    const rawUser = user.toObject();
    console.log(`Raw roles field type: ${typeof rawUser.roles[0]}`);
    console.log(`Raw roles field value: ${rawUser.roles[0]}`);
    console.log(`Is ObjectId: ${rawUser.roles[0] instanceof mongoose.Types.ObjectId}`);

    console.log('\nPopulated roles:');
    user.roles.forEach(role => {
      console.log(`  - ${role.name} (${role.displayName}) - ID: ${role._id}`);
    });

    console.log('\n🔑 Permissions:');
    Object.keys(user.permissions.toObject()).forEach(key => {
      if (key !== 'customPermissions') {
        console.log(`  ${key}: ${user.permissions[key]}`);
      }
    });

    console.log('═'.repeat(80));
    console.log('\n✨ Verification completed!\n');

  } catch (error) {
    console.error('❌ Verification Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

verifyNewUser();
