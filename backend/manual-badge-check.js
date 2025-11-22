const mongoose = require('mongoose');
require('dotenv').config();

async function checkBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const { BadgeService } = require('./src/services/badge.service.ts');

    // Get all users
    const users = await User.find({ status: 'active' });
    console.log(`Found ${users.length} active users`);

    for (const user of users) {
      console.log(`\n🔍 Checking badges for user: ${user.displayName || user.twitterUsername || user._id}`);

      // Check role badges
      await BadgeService.checkRoleBadges(user._id);

      // Check all activity badges
      await BadgeService.checkAllActivityBadges(user._id);
    }

    console.log('\n✨ Badge check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBadges();
