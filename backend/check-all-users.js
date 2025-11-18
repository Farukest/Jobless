const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function checkAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');
    console.log('Connected to MongoDB');

    const walletAddress = '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9';

    // Find ALL users with this wallet
    const users = await User.find({
      $or: [
        { walletAddress },
        { whitelistWallets: walletAddress }
      ]
    });

    console.log(`\n📋 Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`--- User ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Wallet:', user.walletAddress);
      console.log('Display Name:', user.displayName || 'N/A');
      console.log('Status:', user.status);
      console.log('Roles:', user.roles);
      console.log('Twitter ID:', user.twitterId || 'N/A');
      console.log('Twitter Username:', user.twitterUsername || 'N/A');
      console.log('Whitelist Wallets:', user.whitelistWallets || []);
      console.log('');
    });

    // Also check for any users with status !== 'active'
    const inactiveUsers = await User.find({ status: { $ne: 'active' } });

    if (inactiveUsers.length > 0) {
      console.log(`\n⚠️  Found ${inactiveUsers.length} inactive user(s):\n`);
      inactiveUsers.forEach((user, index) => {
        console.log(`--- Inactive User ${index + 1} ---`);
        console.log('ID:', user._id);
        console.log('Wallet:', user.walletAddress);
        console.log('Display Name:', user.displayName || 'N/A');
        console.log('Status:', user.status);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllUsers();
