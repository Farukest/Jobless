// Migration Script: Convert User Roles from String[] to ObjectId[]
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User.model').User;
const Role = require('../models/Role.model').Role;

async function migrateUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Get all roles from database
    console.log('📋 Fetching all roles from database...');
    const roles = await Role.find();

    if (roles.length === 0) {
      console.error('❌ No roles found in database. Please run seed-roles.js first.');
      return;
    }

    // Create a map of role name -> ObjectId
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role._id;
    });

    console.log('✅ Found roles:', Object.keys(roleMap).join(', '));
    console.log('');

    // Step 2: Get all users
    console.log('👥 Fetching all users...');
    const users = await User.find();
    console.log(`✅ Found ${users.length} users to migrate\n`);

    // Step 3: Migrate each user
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`\n📝 Processing user: ${user.displayName || user.walletAddress || user.twitterUsername || user._id}`);

        // Get raw user data to check the actual type in MongoDB
        const rawUser = user.toObject();

        // If roles is undefined or null, initialize as empty array
        if (!rawUser.roles || !Array.isArray(rawUser.roles)) {
          console.log('   ⚠️  User has no roles field, initializing...');
          rawUser.roles = [];
        }

        // Check if user.roles is already ObjectId array
        if (rawUser.roles.length > 0 && rawUser.roles[0] instanceof mongoose.Types.ObjectId) {
          console.log('   ⏭️  User already migrated, skipping...');
          skipCount++;
          continue;
        }

        // Convert string roles to ObjectIds
        const oldRoles = [...rawUser.roles];
        const newRoles = [];

        console.log(`   Old roles (strings): [${oldRoles.join(', ')}]`);

        for (const roleName of oldRoles) {
          const roleId = roleMap[roleName];
          if (roleId) {
            newRoles.push(roleId);
          } else {
            console.warn(`   ⚠️  Warning: Role "${roleName}" not found in database, skipping...`);
          }
        }

        // If user has no roles, assign 'member' role
        if (newRoles.length === 0) {
          console.log('   ⚠️  User has no valid roles, assigning "member" role...');
          if (roleMap['member']) {
            newRoles.push(roleMap['member']);
          }
        }

        // Update user
        user.roles = newRoles;

        // Save user (temporarily disable validation to allow migration)
        await user.save({ validateBeforeSave: false });

        console.log(`   ✅ Successfully migrated: ${newRoles.length} role(s)`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating user ${user._id}:`, error.message);
        errorCount++;
      }
    }

    // Step 4: Summary
    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 Migration Summary');
    console.log('═'.repeat(80));
    console.log(`✅ Successfully migrated: ${successCount} users`);
    console.log(`⏭️  Already migrated (skipped): ${skipCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📊 Total processed: ${users.length} users`);
    console.log('═'.repeat(80));

    // Step 5: Verify migration
    console.log('\n\n🔍 Verifying migration...');
    const verifyUsers = await User.find().populate('roles').limit(5);

    console.log('\n📋 Sample migrated users (first 5):');
    console.log('═'.repeat(80));

    for (const user of verifyUsers) {
      console.log(`\nUser: ${user.displayName || user.walletAddress || user.twitterUsername || user._id}`);
      console.log(`Roles (ObjectIds): [${user.roles.map(r => r._id).join(', ')}]`);
      console.log(`Roles (names): [${user.roles.map(r => r.name).join(', ')}]`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

migrateUsers();
