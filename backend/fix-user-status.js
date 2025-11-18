const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function fixUserStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');
    console.log('Connected to MongoDB');

    const walletAddress = '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9';

    // Find user
    const user = await User.findOne({ walletAddress });

    if (!user) {
      console.log('❌ User not found with wallet:', walletAddress);
      process.exit(1);
    }

    console.log('\n📋 Current User Status:');
    console.log('Wallet:', user.walletAddress);
    console.log('Display Name:', user.displayName || 'N/A');
    console.log('Status:', user.status);
    console.log('Roles:', user.roles);

    if (user.status !== 'active') {
      console.log('\n🔧 Fixing user status...');
      const result = await User.updateOne(
        { walletAddress },
        { $set: { status: 'active' } }
      );
      console.log('✅ User status updated to "active"');
      console.log('Modified count:', result.modifiedCount);

      // Verify
      const updatedUser = await User.findOne({ walletAddress });
      console.log('\n✅ Verified - New status:', updatedUser.status);
    } else {
      console.log('\n✅ User status is already "active"');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserStatus();
