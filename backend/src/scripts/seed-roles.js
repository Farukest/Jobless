// Seed Default Roles
const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('../models/Role.model').Role;

const DEFAULT_ROLES = [
  {
    name: 'member',
    displayName: 'Member',
    description: 'Basic platform member with view-only access',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: false,
      canModerateContent: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canEnrollCourses: false,
      canTeachCourses: false,
      canCreateRequests: false,
      canSubmitProposals: false,
      canSubmitProjects: false,
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'content_creator',
    displayName: 'Content Creator',
    description: 'Can create and publish content on the platform',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: true,
      canModerateContent: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canEnrollCourses: false,
      canTeachCourses: false,
      canCreateRequests: false,
      canSubmitProposals: false,
      canSubmitProjects: false,
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'requester',
    displayName: 'Requester',
    description: 'Can create production requests in J Studio',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: false,
      canModerateContent: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canEnrollCourses: false,
      canTeachCourses: false,
      canCreateRequests: true,
      canSubmitProposals: false,
      canSubmitProjects: false,
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'scout',
    displayName: 'Scout',
    description: 'Can submit and share alpha projects',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: false,
      canModerateContent: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canEnrollCourses: false,
      canTeachCourses: false,
      canCreateRequests: false,
      canSubmitProposals: false,
      canSubmitProjects: true,
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'mentor',
    displayName: 'Mentor',
    description: 'Can create and teach courses in J Academy',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: false,
      canModerateContent: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canEnrollCourses: false,
      canTeachCourses: true,
      canCreateRequests: false,
      canSubmitProposals: false,
      canSubmitProjects: false,
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'learner',
    displayName: 'Learner',
    description: 'Can enroll in and take courses',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: false,
      canModerateContent: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canEnrollCourses: true,
      canTeachCourses: false,
      canCreateRequests: false,
      canSubmitProposals: false,
      canSubmitProjects: false,
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Platform administrator with elevated permissions',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
      canCreateContent: true,
      canModerateContent: true,
      canManageUsers: true,
      canManageRoles: false,
      canManageSiteSettings: false,
      canEnrollCourses: true,
      canTeachCourses: true,
      canCreateRequests: true,
      canSubmitProposals: true,
      canSubmitProjects: true,
    },
    isSystemRole: true,
    status: 'active',
  },
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full platform access with all permissions',
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
      canManageSiteSettings: true,
      canEnrollCourses: true,
      canTeachCourses: true,
      canCreateRequests: true,
      canSubmitProposals: true,
      canSubmitProjects: true,
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
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Roles are ready to use!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed.');
  }
}

seedRoles();
