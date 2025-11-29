// Update all users' permissions from their roles
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User.model').User;
const Role = require('./src/models/Role.model').Role;

const getPermissionsForRoleIds = async (roleIds) => {
  // Fetch all roles from database
  const roles = await Role.find({ _id: { $in: roleIds }, status: 'active' })

  // Base permissions structure (nested by module)
  const mergedPermissions = {
    hub: {
      canAccess: false,
      canCreate: false,
      canModerate: false,
      allowedContentTypes: []
    },
    studio: {
      canAccess: false,
      canCreateRequest: false,
      canClaimRequest: false,
      canModerate: false,
      allowedRequestTypes: []
    },
    academy: {
      canAccess: false,
      canEnroll: false,
      canTeach: false,
      canCreateCourseRequest: false,
      canModerate: false,
      allowedCourseCategories: []
    },
    info: {
      canAccess: false,
      canSubmitEngagement: false,
      canModerate: false,
      allowedPlatforms: [],
      allowedEngagementTypes: []
    },
    alpha: {
      canAccess: false,
      canSubmitAlpha: false,
      canModerate: false,
      allowedAlphaCategories: []
    },
    admin: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canModerateAllContent: false
    }
  }

  // Merge permissions from all roles (OR logic for booleans, union for arrays)
  roles.forEach((role) => {
    const rolePerms = role.permissions

    // Merge each module's permissions
    Object.keys(mergedPermissions).forEach((module) => {
      if (rolePerms[module]) {
        Object.keys(mergedPermissions[module]).forEach((key) => {
          const roleValue = rolePerms[module][key]

          if (typeof roleValue === 'boolean') {
            // Boolean: OR logic (if any role has true, user gets true)
            if (roleValue) {
              mergedPermissions[module][key] = true
            }
          } else if (Array.isArray(roleValue)) {
            // Array: Union (combine all unique values)
            mergedPermissions[module][key] = [
              ...new Set([...mergedPermissions[module][key], ...roleValue])
            ]
          }
        })
      }
    })
  })

  return mergedPermissions
}

async function updateAllUserPermissions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find();
    console.log(`📋 Found ${users.length} users to update\n`);

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.displayName || user.twitterUsername || 'Unknown'}`);
      console.log(`   Roles: ${user.roles.map(r => r.name || r).join(', ')}`);

      if (!user.roles || user.roles.length === 0) {
        console.log('   ⚠️  No roles assigned, skipping...');
        continue;
      }

      try {
        // Get merged permissions from roles
        const newPermissions = await getPermissionsForRoleIds(user.roles);

        // Update user permissions
        user.permissions = newPermissions;
        await user.save();

        console.log('   ✅ Permissions updated');

        // Show key permissions
        if (newPermissions.admin?.canModerateAllContent) {
          console.log('   🔥 GLOBAL MODERATOR - Can bypass all restrictions');
        }
        if (newPermissions.hub?.canCreate) {
          console.log('   📝 Can create Hub content');
        }
      } catch (error) {
        console.error(`   ❌ Error updating user: ${error.message}`);
      }
    }

    console.log('\n\n🎉 All user permissions updated successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

updateAllUserPermissions();
