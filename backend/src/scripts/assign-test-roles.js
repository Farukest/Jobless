// Test Rollerini Atama Script'i
// Bu script test cüzdanlarına gerekli rolleri atar

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/src/models/User.model');

const TEST_WALLETS = [
  {
    walletAddress: '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9',
    roles: ['super_admin'],
    displayName: 'Super Admin Test User',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: true,
      canModerateContent: true,
      canManageUsers: true,
      canManageRoles: true,
      canManageSiteSettings: true
    }
  },
  {
    walletAddress: '0x2ed164398ae3724502e68ce7a3936bb7b0b128af',
    roles: ['admin'],
    displayName: 'Admin Test User',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: true,
      canModerateContent: true,
      canManageUsers: true,
      canViewAnalytics: true
    }
  },
  {
    walletAddress: '0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625',
    roles: ['content_creator', 'mentor'],
    displayName: 'Content Creator & Mentor',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: true,
      canTeachCourses: true
    }
  },
  {
    walletAddress: '0xa58168607931de106c4d8330b8fd99489667b210',
    roles: ['learner', 'requester'],
    displayName: 'Learner & Requester',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canEnrollCourses: true,
      canCreateRequests: true
    }
  },
  {
    walletAddress: '0xa59a01b0ddc8fc239c01ccaba94d431004c169b8',
    roles: ['scout'],
    displayName: 'Scout Test User',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canSubmitProjects: true
    }
  },
  {
    walletAddress: '0x8da45512ab9158796d06beaab0e545d33c23d484',
    roles: ['member'],
    displayName: 'Basic Member',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true
    }
  }
];

async function assignTestRoles() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB\n');

    for (const testWallet of TEST_WALLETS) {
      console.log(`\n📝 Processing wallet: ${testWallet.walletAddress}`);
      console.log(`   Roles: ${testWallet.roles.join(', ')}`);

      // Kullanıcıyı bul veya oluştur
      let user = await User.findOne({ walletAddress: testWallet.walletAddress.toLowerCase() });

      if (!user) {
        console.log('   ➕ User not found, creating new user...');
        user = new User({
          walletAddress: testWallet.walletAddress.toLowerCase(),
          displayName: testWallet.displayName,
          roles: testWallet.roles,
          permissions: testWallet.permissions,
          status: 'active',
          jRankPoints: testWallet.roles.includes('super_admin') ? 10000 : 1000,
          contributionScore: testWallet.roles.includes('super_admin') ? 500 : 50
        });
      } else {
        console.log('   ✏️  User found, updating roles and permissions...');
        user.roles = testWallet.roles;
        user.permissions = { ...user.permissions, ...testWallet.permissions };
        user.displayName = user.displayName || testWallet.displayName;
        user.status = 'active';
      }

      await user.save();
      console.log(`   ✅ Success! Roles assigned: ${user.roles.join(', ')}`);
    }

    console.log('\n\n🎉 All test roles assigned successfully!');
    console.log('\n📋 Test Wallet Summary:');
    console.log('═'.repeat(80));

    for (const wallet of TEST_WALLETS) {
      const user = await User.findOne({ walletAddress: wallet.walletAddress.toLowerCase() });
      console.log(`\n${wallet.displayName}`);
      console.log(`Wallet: ${wallet.walletAddress}`);
      console.log(`Roles: ${user.roles.join(', ')}`);
      console.log(`Status: ${user.status}`);
      console.log(`J-Rank Points: ${user.jRankPoints}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Rollerin atandığı test cüzdanları ile giriş yapabilirsiniz!');
    console.log('📄 Test senaryoları için TEST_SCENARIOS.md dosyasına bakın.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed.');
  }
}

assignTestRoles();
