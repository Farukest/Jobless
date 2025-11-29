import mongoose from 'mongoose'
import { User } from '../models/User.model'
import { Role } from '../models/Role.model'

/**
 * Migrate users from old flat permission structure to new nested permission structure
 */

async function migratePermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobless')
    console.log('✅ Connected to MongoDB')

    // Get all users
    const users = await User.find({})
    console.log(`📊 Found ${users.length} users to migrate`)

    let migrated = 0
    let skipped = 0

    for (const user of users) {
      const oldPermissions = user.permissions as any

      // Check if already migrated (has nested structure)
      if (oldPermissions?.hub && typeof oldPermissions.hub === 'object') {
        console.log(`⏭️  User ${user.displayName || user._id} already migrated, skipping...`)
        skipped++
        continue
      }

      // If has old flat structure, migrate it
      console.log(`🔄 Migrating user: ${user.displayName || user._id}`)
      console.log(`   Old structure: ${Object.keys(oldPermissions || {}).slice(0, 3).join(', ')}...`)

      // Map old flat structure to new nested structure
      const newPermissions = {
        hub: {
          canAccess: oldPermissions?.canAccessJHub ?? true,
          canCreate: oldPermissions?.canCreateContent ?? false,
          canModerate: oldPermissions?.canModerateContent ?? false,
          allowedContentTypes: oldPermissions?.allowedContentTypes || [],
        },
        studio: {
          canAccess: oldPermissions?.canAccessJStudio ?? true,
          canCreateRequest: false,
          canClaimRequest: false,
          allowedRequestTypes: [],
        },
        academy: {
          canAccess: oldPermissions?.canAccessJAcademy ?? true,
          canEnroll: oldPermissions?.canEnrollCourses ?? false,
          canTeach: oldPermissions?.canTeachCourses ?? false,
          canCreateCourseRequest: false,
          allowedCourseCategories: [],
        },
        info: {
          canAccess: oldPermissions?.canAccessJInfo ?? true,
          canSubmitEngagement: false,
          allowedPlatforms: [],
          allowedEngagementTypes: [],
        },
        alpha: {
          canAccess: oldPermissions?.canAccessJAlpha ?? true,
          canSubmitAlpha: oldPermissions?.canSubmitProposals ?? false,
          canModerate: oldPermissions?.canModerateContent ?? false,
          allowedAlphaCategories: [],
        },
        admin: {
          canManageUsers: oldPermissions?.canManageUsers ?? false,
          canManageRoles: oldPermissions?.canManageRoles ?? false,
          canManageSiteSettings: oldPermissions?.canManageSiteSettings ?? false,
          canModerateAllContent: oldPermissions?.canModerateContent ?? false,
        },
      }

      // Check if user has wildcard permission (super admin)
      const hasWildcard = oldPermissions?.customPermissions?.includes('*')
      if (hasWildcard) {
        // Grant all permissions for super admin
        newPermissions.hub.canCreate = true
        newPermissions.hub.canModerate = true
        newPermissions.studio.canCreateRequest = true
        newPermissions.studio.canClaimRequest = true
        newPermissions.academy.canEnroll = true
        newPermissions.academy.canTeach = true
        newPermissions.academy.canCreateCourseRequest = true
        newPermissions.info.canSubmitEngagement = true
        newPermissions.alpha.canSubmitAlpha = true
        newPermissions.alpha.canModerate = true
        newPermissions.admin.canManageUsers = true
        newPermissions.admin.canManageRoles = true
        newPermissions.admin.canManageSiteSettings = true
        newPermissions.admin.canModerateAllContent = true
      }

      // Update user permissions
      user.permissions = newPermissions as any
      await user.save()

      console.log(`✅ Migrated user: ${user.displayName || user._id}`)
      migrated++
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Migrated: ${migrated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   📝 Total: ${users.length}`)

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

migratePermissions()
