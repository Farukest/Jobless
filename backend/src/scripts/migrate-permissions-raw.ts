import { MongoClient } from 'mongodb'

/**
 * Migrate users from old flat permission structure to new nested permission structure
 * Uses raw MongoDB client to bypass Mongoose schema defaults
 */

async function migratePermissions() {
  const client = await MongoClient.connect('mongodb://localhost:27017')

  try {
    console.log('✅ Connected to MongoDB')

    const db = client.db('jobless')
    const usersCollection = db.collection('users')

    // Get all users
    const users = await usersCollection.find({}).toArray()
    console.log(`📊 Found ${users.length} users to migrate\n`)

    let migrated = 0
    let skipped = 0

    for (const user of users) {
      const oldPermissions = user.permissions as any

      // Check if already migrated (has nested structure)
      if (oldPermissions?.hub && typeof oldPermissions.hub === 'object' && oldPermissions.hub.canAccess !== undefined) {
        console.log(`⏭️  User ${user.displayName || user._id} already migrated, skipping...`)
        skipped++
        continue
      }

      // If has old flat structure, migrate it
      console.log(`🔄 Migrating user: ${user.displayName || user._id}`)
      console.log(`   Old keys: ${Object.keys(oldPermissions || {}).slice(0, 5).join(', ')}...`)

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
        console.log(`   🌟 Super admin detected - granting all permissions`)
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

      // Update user permissions using raw MongoDB
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { permissions: newPermissions } }
      )

      console.log(`   ✅ Migrated to nested structure\n`)
      migrated++
    }

    console.log('📊 Migration Summary:')
    console.log(`   ✅ Migrated: ${migrated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   📝 Total: ${users.length}`)

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await client.close()
    console.log('👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

migratePermissions()
