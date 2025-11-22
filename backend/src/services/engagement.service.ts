import mongoose from 'mongoose'
import { Like } from '../models/Like.model'
import { Bookmark } from '../models/Bookmark.model'
import { View } from '../models/View.model'
import { Content } from '../models/Content.model'
import { Course } from '../models/Course.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { AppError } from '../middleware/error-handler'

type TargetType = 'hub_content' | 'course' | 'alpha_post' | 'comment'

class EngagementService {
  /**
   * Update counter for a target (generic helper)
   */
  private async updateCounter(
    targetId: mongoose.Types.ObjectId,
    targetType: TargetType,
    field: 'likesCount' | 'bookmarksCount' | 'viewsCount',
    increment: number,
    session?: mongoose.ClientSession
  ): Promise<number> {
    let result: any
    const options: any = { new: true }
    if (session) options.session = session

    switch (targetType) {
      case 'hub_content':
        result = await Content.findByIdAndUpdate(
          targetId,
          { $inc: { [field]: increment } },
          options
        )
        break
      case 'course':
        result = await Course.findByIdAndUpdate(
          targetId,
          { $inc: { [field]: increment } },
          options
        )
        break
      case 'alpha_post':
        result = await AlphaPost.findByIdAndUpdate(
          targetId,
          { $inc: { [field]: increment } },
          options
        )
        break
      case 'comment':
        throw new AppError('Comments do not support this operation', 400)
      default:
        throw new AppError('Invalid target type', 400)
    }

    if (!result) {
      throw new AppError('Target not found', 404)
    }

    return result[field] || 0
  }

  /**
   * Toggle like on a target (add or remove)
   */
  async toggleLike(
    userId: mongoose.Types.ObjectId,
    targetId: mongoose.Types.ObjectId,
    targetType: TargetType
  ) {
    try {
      // Check if like exists
      const existingLike = await Like.findOne({ userId, targetId, targetType })

      let isLiked: boolean
      let likesCount: number

      if (existingLike) {
        // Unlike: Remove like and decrement counter
        await Like.deleteOne({ _id: existingLike._id })
        likesCount = await this.updateCounter(targetId, targetType, 'likesCount', -1)
        isLiked = false
      } else {
        // Like: Add like and increment counter
        await Like.create({
          userId,
          targetId,
          targetType,
        })
        likesCount = await this.updateCounter(targetId, targetType, 'likesCount', 1)
        isLiked = true
      }

      return {
        isLiked,
        likesCount,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get like status for a user on a target
   */
  async getLikeStatus(
    userId: mongoose.Types.ObjectId,
    targetId: mongoose.Types.ObjectId,
    targetType: TargetType
  ): Promise<boolean> {
    const like = await Like.exists({ userId, targetId, targetType })
    return !!like
  }

  /**
   * Get total likes count for a target
   */
  async getLikesCount(targetId: mongoose.Types.ObjectId, targetType: TargetType): Promise<number> {
    const count = await Like.countDocuments({ targetId, targetType })
    return count
  }

  /**
   * Get like status for multiple targets (batch operation - optimized)
   */
  async getLikeStatusBatch(
    userId: mongoose.Types.ObjectId,
    targets: Array<{ targetId: mongoose.Types.ObjectId; targetType: TargetType }>
  ): Promise<Map<string, boolean>> {
    const likes = await Like.find({
      userId,
      $or: targets.map((t) => ({ targetId: t.targetId, targetType: t.targetType })),
    })

    const likeMap = new Map<string, boolean>()
    targets.forEach((t) => {
      const key = `${t.targetId}_${t.targetType}`
      const isLiked = likes.some(
        (like) =>
          like.targetId.toString() === t.targetId.toString() && like.targetType === t.targetType
      )
      likeMap.set(key, isLiked)
    })

    return likeMap
  }

  // ==================== BOOKMARK OPERATIONS ====================

  /**
   * Toggle bookmark on a target (add or remove)
   */
  async toggleBookmark(
    userId: mongoose.Types.ObjectId,
    targetId: mongoose.Types.ObjectId,
    targetType: Exclude<TargetType, 'comment'>
  ) {
    try {
      const existingBookmark = await Bookmark.findOne({ userId, targetId, targetType })

      let isBookmarked: boolean
      let bookmarksCount: number

      if (existingBookmark) {
        // Remove bookmark
        await Bookmark.deleteOne({ _id: existingBookmark._id })
        bookmarksCount = await this.updateCounter(targetId, targetType, 'bookmarksCount', -1)
        isBookmarked = false
      } else {
        // Add bookmark
        await Bookmark.create({
          userId,
          targetId,
          targetType,
        })
        bookmarksCount = await this.updateCounter(targetId, targetType, 'bookmarksCount', 1)
        isBookmarked = true
      }

      return {
        isBookmarked,
        bookmarksCount,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get bookmark status for a user on a target
   */
  async getBookmarkStatus(
    userId: mongoose.Types.ObjectId,
    targetId: mongoose.Types.ObjectId,
    targetType: Exclude<TargetType, 'comment'>
  ): Promise<boolean> {
    const bookmark = await Bookmark.exists({ userId, targetId, targetType })
    return !!bookmark
  }

  /**
   * Get bookmark status for multiple targets (batch)
   */
  async getBookmarkStatusBatch(
    userId: mongoose.Types.ObjectId,
    targets: Array<{ targetId: mongoose.Types.ObjectId; targetType: Exclude<TargetType, 'comment'> }>
  ): Promise<Map<string, boolean>> {
    const bookmarks = await Bookmark.find({
      userId,
      $or: targets.map((t) => ({ targetId: t.targetId, targetType: t.targetType })),
    })

    const bookmarkMap = new Map<string, boolean>()
    targets.forEach((t) => {
      const key = `${t.targetId}_${t.targetType}`
      const isBookmarked = bookmarks.some(
        (bm) => bm.targetId.toString() === t.targetId.toString() && bm.targetType === t.targetType
      )
      bookmarkMap.set(key, isBookmarked)
    })

    return bookmarkMap
  }

  // ==================== VIEW OPERATIONS ====================

  /**
   * Track a view (with unique view logic)
   * - If logged in: same user + same target = only 1 view (ever)
   * - If anonymous: same IP + same target within 24h = only 1 view
   */
  async trackView(
    userId: mongoose.Types.ObjectId | null,
    targetId: mongoose.Types.ObjectId,
    targetType: Exclude<TargetType, 'comment'>,
    ipAddress: string,
    userAgent?: string
  ) {
    try {
      let existingView

      // Priority 1: If user is logged in, check by userId (regardless of time)
      if (userId) {
        existingView = await View.findOne({
          userId,
          targetId,
          targetType,
        })
      } else {
        // Priority 2: If anonymous, check by IP within 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        existingView = await View.findOne({
          ipAddress,
          targetId,
          targetType,
          createdAt: { $gte: oneDayAgo },
        })
      }

      // If already viewed, don't count again
      if (existingView) {
        return {
          counted: false,
          message: userId
            ? 'User already viewed this content'
            : 'View already counted within 24 hours',
        }
      }

      // Create view record
      await View.create({
        userId,
        targetId,
        targetType,
        ipAddress,
        userAgent,
      })

      // Increment view counter
      await this.updateCounter(targetId, targetType, 'viewsCount', 1)

      return {
        counted: true,
        message: 'View tracked successfully',
      }
    } catch (error) {
      console.error('View tracking error:', error)
      // Don't throw error for view tracking failures - just log it
      return {
        counted: false,
        message: 'Failed to track view',
      }
    }
  }

  /**
   * Get total views count for a target
   */
  async getViewsCount(targetId: mongoose.Types.ObjectId, targetType: Exclude<TargetType, 'comment'>): Promise<number> {
    const count = await View.countDocuments({ targetId, targetType })
    return count
  }

  /**
   * Get unique views count (unique IPs) for a target
   */
  async getUniqueViewsCount(targetId: mongoose.Types.ObjectId, targetType: Exclude<TargetType, 'comment'>): Promise<number> {
    const uniqueIPs = await View.distinct('ipAddress', { targetId, targetType })
    return uniqueIPs.length
  }
}

export const engagementService = new EngagementService()
