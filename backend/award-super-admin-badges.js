const mongoose = require('mongoose');
require('dotenv').config();

async function awardSuperAdminBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Badge = mongoose.model('Badge', new mongoose.Schema({}, { strict: false }));
    const UserBadge = mongoose.model('UserBadge', new mongoose.Schema({}, { strict: false }));
    const Role = mongoose.model('Role', new mongoose.Schema({}, { strict: false }));

    // Find super_admin role ID
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.log('❌ Super admin role not found');
      process.exit(0);
    }

    console.log(`🔑 Super admin role ID: ${superAdminRole._id}`);

    // Find all super admins using role ObjectId
    const superAdmins = await User.find({ roles: superAdminRole._id });
    console.log(`\n📋 Found ${superAdmins.length} super admin(s)`);

    if (superAdmins.length === 0) {
      console.log('❌ No super admins found');
      process.exit(0);
    }

    // Find all super admin badges
    const superAdminBadges = await Badge.find({
      category: 'admin',
      $or: [
        { name: 'super_admin' },
        { name: 'platform_architect' },
        { name: 'platform_overlord' },
        { name: 'god_mode' }
      ]
    });

    console.log(`📛 Found ${superAdminBadges.length} super admin badges:`);
    superAdminBadges.forEach(badge => {
      console.log(`   - ${badge.displayName} (${badge.name})`);
    });

    // Award badges to each super admin
    for (const user of superAdmins) {
      console.log(`\n👤 Processing user: ${user.displayName || user.twitterUsername || user._id}`);

      for (const badge of superAdminBadges) {
        // Check if user already has this badge
        const existingBadge = await UserBadge.findOne({
          userId: user._id,
          badgeId: badge._id
        });

        if (existingBadge) {
          console.log(`   ✓ Already has: ${badge.displayName}`);
        } else {
          // Award the badge
          await UserBadge.create({
            userId: user._id,
            badgeId: badge._id,
            earnedAt: new Date(),
            earnedFrom: 'role',
            isVisible: true,
            isPinned: false
          });
          console.log(`   ✨ Awarded: ${badge.displayName}`);
        }
      }
    }

    console.log('\n✅ All super admin badges awarded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

awardSuperAdminBadges();
