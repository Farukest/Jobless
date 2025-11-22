/**
 * Migration Script: Old Engagement System → New Engagement System
 *
 * This script migrates:
 * - Content.likedBy[] → Like collection
 * - Content.bookmarkedBy[] → Bookmark collection
 * - Ensures counters are accurate
 */

import mongoose from 'mongoose'
import { Content } from '../models/Content.model'
import { Course } from '../models/Course.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { Like } from '../models/Like.model'
import { Bookmark } from '../models/Bookmark.model'
import { connectDB } from '../config/database'

interface OldContent {
  _id: mongoose.Types.ObjectId
  likedBy?: mongoose.Types.ObjectId[]
  bookmarkedBy?: mongoose.Types.ObjectId[]
  likes?: number
  bookmarks?: number
  views?: number
}

async function migrateContentEngagements() {
  console.log('\n🔄 Migrating Hub Content engagements...')

  const contents = await Content.find({
    $or: [
      { likedBy: { $exists: true, $ne: [] } },
      { bookmarkedBy: { $exists: true, $ne: [] } },
    ],
  }) as any[]

  let migratedLikes = 0
  let migratedBookmarks = 0

  for (const content of contents) {
    const contentId = content._id

    // Migrate likes
    if (content.likedBy && content.likedBy.length > 0) {
      for (const userId of content.likedBy) {
        try {
          await Like.findOneAndUpdate(
            { userId, targetId: contentId, targetType: 'hub_content' },
            { userId, targetId: contentId, targetType: 'hub_content' },
            { upsert: true, new: true }
          )
          migratedLikes++
        } catch (error) {
          console.log(`⚠️  Duplicate like skipped: User ${userId} → Content ${contentId}`)
        }
      }

      // Update counter
      await Content.findByIdAndUpdate(contentId, {
        likesCount: content.likedBy.length,
        $unset: { likedBy: 1 },
      })
    }

    // Migrate bookmarks
    if (content.bookmarkedBy && content.bookmarkedBy.length > 0) {
      for (const userId of content.bookmarkedBy) {
        try {
          await Bookmark.findOneAndUpdate(
            { userId, targetId: contentId, targetType: 'hub_content' },
            { userId, targetId: contentId, targetType: 'hub_content' },
            { upsert: true, new: true }
          )
          migratedBookmarks++
        } catch (error) {
          console.log(`⚠️  Duplicate bookmark skipped: User ${userId} → Content ${contentId}`)
        }
      }

      // Update counter
      await Content.findByIdAndUpdate(contentId, {
        bookmarksCount: content.bookmarkedBy.length,
        $unset: { bookmarkedBy: 1 },
      })
    }

    // Migrate old counter fields (likes → likesCount, etc.)
    const updates: any = {}
    if (content.likes !== undefined && content.likesCount === undefined) {
      updates.likesCount = content.likes
      updates.$unset = { ...updates.$unset, likes: 1 }
    }
    if (content.bookmarks !== undefined && content.bookmarksCount === undefined) {
      updates.bookmarksCount = content.bookmarks
      updates.$unset = { ...updates.$unset, bookmarks: 1 }
    }
    if (content.views !== undefined && content.viewsCount === undefined) {
      updates.viewsCount = content.views
      updates.$unset = { ...updates.$unset, views: 1 }
    }

    if (Object.keys(updates).length > 0) {
      await Content.findByIdAndUpdate(contentId, updates)
    }
  }

  console.log(`✅ Hub Content: Migrated ${migratedLikes} likes, ${migratedBookmarks} bookmarks`)
}

async function migrateCourseEngagements() {
  console.log('\n🔄 Migrating Course engagements...')

  // Courses don't have likedBy/bookmarkedBy arrays in current schema
  // But we need to ensure counters exist
  const courses = await Course.find({})

  let updated = 0

  for (const course of courses) {
    const updates: any = {}

    if (course.likesCount === undefined) updates.likesCount = 0
    if (course.bookmarksCount === undefined) updates.bookmarksCount = 0
    if (course.viewsCount === undefined) updates.viewsCount = 0

    if (Object.keys(updates).length > 0) {
      await Course.findByIdAndUpdate(course._id, updates)
      updated++
    }
  }

  console.log(`✅ Courses: Initialized counters for ${updated} courses`)
}

async function migrateAlphaPostEngagements() {
  console.log('\n🔄 Migrating Alpha Post engagements...')

  const posts = await AlphaPost.find({}) as any[]

  let updated = 0

  for (const post of posts) {
    const updates: any = {}

    // Rename views → viewsCount
    if (post.views !== undefined && post.viewsCount === undefined) {
      updates.viewsCount = post.views
      updates.$unset = { views: 1 }
    }

    // Add likesCount if missing
    if (post.likesCount === undefined) {
      updates.likesCount = 0
    }

    if (Object.keys(updates).length > 0) {
      await AlphaPost.findByIdAndUpdate(post._id, updates)
      updated++
    }
  }

  console.log(`✅ Alpha Posts: Updated ${updated} posts`)
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...')

  const likeCount = await Like.countDocuments()
  const bookmarkCount = await Bookmark.countDocuments()
  const contentCount = await Content.countDocuments()
  const courseCount = await Course.countDocuments()
  const alphaPostCount = await AlphaPost.countDocuments()

  console.log(`\n📊 Migration Summary:`)
  console.log(`   - Total Likes: ${likeCount}`)
  console.log(`   - Total Bookmarks: ${bookmarkCount}`)
  console.log(`   - Hub Contents: ${contentCount}`)
  console.log(`   - Courses: ${courseCount}`)
  console.log(`   - Alpha Posts: ${alphaPostCount}`)

  // Check for any remaining old fields
  const contentsWithOldFields = await Content.countDocuments({
    $or: [
      { likedBy: { $exists: true } },
      { bookmarkedBy: { $exists: true } },
      { likes: { $exists: true } },
      { bookmarks: { $exists: true } },
      { views: { $exists: true } },
    ],
  })

  if (contentsWithOldFields > 0) {
    console.log(`\n⚠️  WARNING: ${contentsWithOldFields} contents still have old fields!`)
  } else {
    console.log(`\n✅ All old fields cleaned up successfully!`)
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting Engagement System Migration...')
    console.log('================================================\n')

    // Connect to database
    await connectDB()

    // Run migrations
    await migrateContentEngagements()
    await migrateCourseEngagements()
    await migrateAlphaPostEngagements()

    // Verify
    await verifyMigration()

    console.log('\n================================================')
    console.log('✅ Migration completed successfully!')
    console.log('================================================\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
runMigration()
