// Seed Default Roles - MODERN NESTED PERMISSION STRUCTURE
const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('../models/Role.model').Role;

const DEFAULT_ROLES = [
  {
    name: 'member',
    displayName: 'Member',
    description: 'Basic platform member with view-only access',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: false,
        canModerate: false,
        allowedContentTypes: []
      },
      studio: {
        canAccess: true,
        canCreateRequest: false,
        canClaimRequest: false,
        canModerate: false,
        allowedRequestTypes: []
      },
      academy: {
        canAccess: true,
        canEnroll: false,
        canTeach: false,
        canCreateCourseRequest: false,
        canModerate: false,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
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
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'content_creator',
    displayName: 'Content Creator',
    description: 'Can create and publish content on the platform',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: true,
        canModerate: false,
        allowedContentTypes: []  // Empty = can create all types
      },
      studio: {
        canAccess: true,
        canCreateRequest: false,
        canClaimRequest: false,
        canModerate: false,
        allowedRequestTypes: []
      },
      academy: {
        canAccess: true,
        canEnroll: false,
        canTeach: false,
        canCreateCourseRequest: false,
        canModerate: false,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
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
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'designer',
    displayName: 'Designer',
    description: 'Can claim and complete design requests in J Studio',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: false,
        canModerate: false,
        allowedContentTypes: []
      },
      studio: {
        canAccess: true,
        canCreateRequest: false,
        canClaimRequest: true,
        canModerate: false,
        allowedRequestTypes: []  // Empty = can claim all design types
      },
      academy: {
        canAccess: true,
        canEnroll: false,
        canTeach: false,
        canCreateCourseRequest: false,
        canModerate: false,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
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
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'video_editor',
    displayName: 'Video Editor',
    description: 'Can claim and complete video editing requests in J Studio',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: false,
        canModerate: false,
        allowedContentTypes: []
      },
      studio: {
        canAccess: true,
        canCreateRequest: false,
        canClaimRequest: true,
        canModerate: false,
        allowedRequestTypes: []  // Empty = can claim all video types
      },
      academy: {
        canAccess: true,
        canEnroll: false,
        canTeach: false,
        canCreateCourseRequest: false,
        canModerate: false,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
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
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'requester',
    displayName: 'Requester',
    description: 'Can create production requests and course requests',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: false,
        canModerate: false,
        allowedContentTypes: []
      },
      studio: {
        canAccess: true,
        canCreateRequest: true,
        canClaimRequest: false,
        canModerate: false,
        allowedRequestTypes: []
      },
      academy: {
        canAccess: true,
        canEnroll: false,
        canTeach: false,
        canCreateCourseRequest: true,
        canModerate: false,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
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
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'scout',
    displayName: 'Scout',
    description: 'Can submit and share alpha projects',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: false,
        canModerate: false,
        allowedContentTypes: []
      },
      studio: {
        canAccess: true,
        canCreateRequest: false,
        canClaimRequest: false,
        canModerate: false,
        allowedRequestTypes: []
      },
      academy: {
        canAccess: true,
        canEnroll: false,
        canTeach: false,
        canCreateCourseRequest: false,
        canModerate: false,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
        canSubmitAlpha: true,
        canModerate: false,
        allowedAlphaCategories: []  // Empty = can submit all alpha categories
      },
      admin: {
        canManageUsers: false,
        canManageRoles: false,
        canManageSiteSettings: false,
        canModerateAllContent: false
      }
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'mentor',
    displayName: 'Mentor',
    description: 'Can create and teach courses in J Academy',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: false,
        canModerate: false,
        allowedContentTypes: []
      },
      studio: {
        canAccess: true,
        canCreateRequest: false,
        canClaimRequest: false,
        canModerate: false,
        allowedRequestTypes: []
      },
      academy: {
        canAccess: true,
        canEnroll: false,
        canTeach: true,
        canCreateCourseRequest: false,
        canModerate: false,
        allowedCourseCategories: []  // Empty = can teach all categories
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
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
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'learner',
    displayName: 'Learner',
    description: 'Can enroll in and take courses',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: false,
        canModerate: false,
        allowedContentTypes: []
      },
      studio: {
        canAccess: true,
        canCreateRequest: false,
        canClaimRequest: false,
        canModerate: false,
        allowedRequestTypes: []
      },
      academy: {
        canAccess: true,
        canEnroll: true,
        canTeach: false,
        canCreateCourseRequest: false,
        canModerate: false,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: false,
        canModerate: false,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
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
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Platform administrator with moderation permissions',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: true,
        canModerate: true,
        allowedContentTypes: []  // Empty = can create/moderate all types
      },
      studio: {
        canAccess: true,
        canCreateRequest: true,
        canClaimRequest: true,
        canModerate: true,
        allowedRequestTypes: []
      },
      academy: {
        canAccess: true,
        canEnroll: true,
        canTeach: true,
        canCreateCourseRequest: true,
        canModerate: true,
        allowedCourseCategories: []
      },
      info: {
        canAccess: true,
        canSubmitEngagement: true,
        canModerate: true,
        allowedPlatforms: [],
        allowedEngagementTypes: []
      },
      alpha: {
        canAccess: true,
        canSubmitAlpha: true,
        canModerate: true,
        allowedAlphaCategories: []
      },
      admin: {
        canManageUsers: true,
        canManageRoles: false,
        canManageSiteSettings: false,
        canModerateAllContent: false  // Admin has module-level moderation, not global
      }
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full platform access with all permissions',
    permissions: {
      hub: {
        canAccess: true,
        canCreate: true,
        canModerate: true,
        allowedContentTypes: []  // Empty = no restriction, can do everything
      },
      studio: {
        canAccess: true,
        canCreateRequest: true,
        canClaimRequest: true,
        canModerate: true,
        allowedRequestTypes: []  // Empty = no restriction
      },
      academy: {
        canAccess: true,
        canEnroll: true,
        canTeach: true,
        canCreateCourseRequest: true,
        canModerate: true,
        allowedCourseCategories: []  // Empty = no restriction
      },
      info: {
        canAccess: true,
        canSubmitEngagement: true,
        canModerate: true,
        allowedPlatforms: [],  // Empty = no restriction
        allowedEngagementTypes: []  // Empty = no restriction
      },
      alpha: {
        canAccess: true,
        canSubmitAlpha: true,
        canModerate: true,
        allowedAlphaCategories: []  // Empty = no restriction
      },
      admin: {
        canManageUsers: true,
        canManageRoles: true,
        canManageSiteSettings: true,
        canModerateAllContent: true  // ← CRITICAL: Global moderation bypass
      }
    },
    isSystemRole: true,
    status: 'active',
  },
];

async function seedRoles() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobless');
    console.log('✅ Connected to MongoDB\n');

    for (const roleData of DEFAULT_ROLES) {
      console.log(`\n📝 Processing role: ${roleData.name}`);

      const existingRole = await Role.findOne({ name: roleData.name });

      if (existingRole) {
        console.log(`   ✏️  Role "${roleData.name}" already exists, updating...`);
        Object.assign(existingRole, roleData);
        await existingRole.save();
        console.log(`   ✅ Updated role: ${roleData.name}`);
      } else {
        console.log(`   ➕ Creating role: ${roleData.name}`);
        await Role.create(roleData);
        console.log(`   ✅ Created role: ${roleData.name}`);
      }
    }

    console.log('\n\n🎉 All roles seeded successfully!');
    console.log('\n📋 Role Summary:');
    console.log('═'.repeat(80));

    const allRoles = await Role.find().sort({ isSystemRole: -1, name: 1 });
    for (const role of allRoles) {
      console.log(`\n${role.displayName} (${role.name})`);
      console.log(`Description: ${role.description}`);
      console.log(`System Role: ${role.isSystemRole ? 'Yes' : 'No'}`);
      console.log(`Status: ${role.status}`);

      // Show key permissions
      const perms = role.permissions;
      if (perms.admin?.canModerateAllContent) {
        console.log(`🔥 GLOBAL MODERATOR - Can bypass all restrictions`);
      }
      if (perms.hub?.canCreate) {
        console.log(`📝 Can create Hub content`);
      }
      if (perms.studio?.canClaimRequest) {
        console.log(`🎨 Can claim Studio requests`);
      }
      if (perms.academy?.canTeach) {
        console.log(`🎓 Can teach Academy courses`);
      }
      if (perms.alpha?.canSubmitAlpha) {
        console.log(`🔍 Can submit Alpha posts`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Modern nested permission structure seeded successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed.');
  }
}

seedRoles();
