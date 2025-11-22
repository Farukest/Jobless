const mongoose = require('mongoose');
require('dotenv').config();

async function cleanNullBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB');

    const UserBadge = mongoose.model('UserBadge', new mongoose.Schema({}, { strict: false }));

    // Find badges with null badgeId
    const nullBadges = await UserBadge.find({ badgeId: null });
    console.log(`Found ${nullBadges.length} badges with null badgeId`);

    if (nullBadges.length > 0) {
      const result = await UserBadge.deleteMany({ badgeId: null });
      console.log(`🗑️  Deleted ${result.deletedCount} null badges`);
    }

    console.log('✨ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanNullBadges();
