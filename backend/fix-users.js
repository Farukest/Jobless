const mongoose = require('mongoose');

async function fixUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobless');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Find and show wallet users
    const walletUsers = await db.collection('users').find({ walletAddress: { $exists: true } }).toArray();
    console.log('Found wallet users:', walletUsers.length);
    walletUsers.forEach(user => {
      console.log(`- User ${user._id}: status = ${user.status}, wallet = ${user.walletAddress}`);
    });

    // Delete ALL wallet users
    const result = await db.collection('users').deleteMany({
      walletAddress: { $exists: true }
    });

    console.log(`Deleted ${result.deletedCount} wallet users`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUsers();
