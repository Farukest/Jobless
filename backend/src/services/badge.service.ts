import { Badge, IBadge } from '../models/Badge.model'
import { UserBadge } from '../models/UserBadge.model'
import { User } from '../models/User.model'
import { Content } from '../models/Content.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { Course } from '../models/Course.model'
import { ProductionRequest } from '../models/ProductionRequest.model'
import { EngagementPost } from '../models/EngagementPost.model'
import mongoose from 'mongoose'

export class BadgeService {
  /**
   * Check and award role-based badges when user roles change
   */
  static async checkRoleBadges(userId: mongoose.Types.ObjectId) {
    try {
      const user = await User.findById(userId).populate('roles')
      if (!user) return

      const roleNames = (user.roles as any[]).map((r: any) => r.name)

      // Find all role-based badges that match user's roles
      const eligibleBadges = await Badge.find({
        type: 'role',
        isActive: true,
        requiredRoles: { $in: roleNames }
      })

      for (const badge of eligibleBadges) {
        await this.awardBadge(userId, badge._id as any, 'role_assignment')
      }

      console.log(`✅ Checked role badges for user ${userId}`)
    } catch (error) {
      console.error('Error checking role badges:', error)
    }
  }

  /**
   * Check and award activity badges for specific module
   */
  static async checkActivityBadges(
    userId: mongoose.Types.ObjectId,
    module: 'hub' | 'studio' | 'academy' | 'alpha' | 'info' | 'general'
  ) {
    try {
      const activityBadges = await Badge.find({
        type: { $in: ['activity', 'achievement'] },
        category: module,
        isActive: true
      })

      for (const badge of activityBadges) {
        if (!badge.criteria) continue

        // Check if user already has this badge
        const hasEarned = await UserBadge.exists({ userId, badgeId: badge._id })
        if (hasEarned) continue

        // Check if user meets criteria
        const isEligible = await this.checkCriteria(userId, badge.criteria)
        if (isEligible) {
          await this.awardBadge(userId, badge._id as any, 'content_milestone')
        }
      }

      console.log(`✅ Checked ${module} activity badges for user ${userId}`)
    } catch (error) {
      console.error(`Error checking ${module} activity badges:`, error)
    }
  }

  /**
   * Check all activity badges (useful for periodic checks)
   */
  static async checkAllActivityBadges(userId: mongoose.Types.ObjectId) {
    const modules: Array<'hub' | 'studio' | 'academy' | 'alpha' | 'info' | 'general'> = [
      'hub', 'studio', 'academy', 'alpha', 'info', 'general'
    ]

    for (const module of modules) {
      await this.checkActivityBadges(userId, module)
    }
  }

  /**
   * Check if user meets badge criteria
   */
  private static async checkCriteria(
    userId: mongoose.Types.ObjectId,
    criteria: IBadge['criteria']
  ): Promise<boolean> {
    if (!criteria) return false

    const operator = criteria.operator || 'gte'
    const target = criteria.target

    try {
      let value: number

      switch (criteria.type) {
        // Hub (Content) criteria
        case 'content_count':
          value = await Content.countDocuments({
            authorId: userId,
            status: 'published',
            ...(criteria.contentType && { contentType: criteria.contentType })
          })
          break

        case 'like_count':
          const contents = await Content.find({ authorId: userId, status: 'published' })
          if (criteria.additionalCriteria?.single) {
            // Check if ANY single content has target likes
            value = Math.max(...contents.map(c => (c as any).likes || 0))
          } else {
            // Total likes across all content
            value = contents.reduce((sum, c) => sum + ((c as any).likes || 0), 0)
          }
          break

        case 'comment_count':
          const contentsForComments = await Content.find({ authorId: userId, status: 'published' })
          if (criteria.additionalCriteria?.single) {
            value = Math.max(...contentsForComments.map(c => (c as any).comments || 0))
          } else {
            value = contentsForComments.reduce((sum, c) => sum + ((c as any).comments || 0), 0)
          }
          break

        // Studio criteria
        case 'request_count':
          const requestType = criteria.additionalCriteria?.requestType // 'claimed' or 'completed'
          if (requestType === 'completed') {
            value = await ProductionRequest.countDocuments({
              assignedTo: userId,
              status: 'completed'
            })
          } else if (requestType === 'claimed') {
            value = await ProductionRequest.countDocuments({
              assignedTo: userId
            })
          } else {
            // Requester - created requests
            value = await ProductionRequest.countDocuments({
              requesterId: userId
            })
          }
          break

        case 'rating_count':
          const requests = await ProductionRequest.find({ assignedTo: userId })
          value = requests.filter(r => r.rating && r.rating === 5).length
          break

        case 'rating_avg':
          const ratedRequests = await ProductionRequest.find({
            assignedTo: userId,
            rating: { $exists: true, $ne: null }
          })
          if (ratedRequests.length === 0) return false
          const avgRating = ratedRequests.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedRequests.length
          value = avgRating
          break

        // Academy criteria
        case 'course_count':
          if (criteria.additionalCriteria?.role === 'mentor') {
            value = await Course.countDocuments({ mentorId: userId })
          } else {
            // Course requests
            value = 0 // TODO: Implement CourseRequest model
          }
          break

        case 'enrollment_count':
          const courses = await Course.find({ mentorId: userId })
          value = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)
          break

        case 'completion_count':
          // TODO: Implement with Enrollment model
          value = 0
          break

        // Alpha criteria
        case 'alpha_count':
          value = await AlphaPost.countDocuments({ scoutId: userId })
          break

        case 'bullish_count':
          const alphaPosts = await AlphaPost.find({ scoutId: userId })
          if (criteria.additionalCriteria?.single) {
            // Max bullish on single post
            value = Math.max(...alphaPosts.map(p => (p as any).bullishCount || 0))
          } else {
            // Total bullish
            value = alphaPosts.reduce((sum, p) => sum + ((p as any).bullishCount || 0), 0)
          }
          break

        // Info criteria
        case 'engagement_count':
          value = await EngagementPost.countDocuments({ submitterId: userId })
          break

        // General criteria
        case 'jrank_points':
          const userForJrank = await User.findById(userId)
          value = userForJrank?.jRankPoints || 0
          break

        case 'contribution_score':
          const userForContrib = await User.findById(userId)
          value = userForContrib?.contributionScore || 0
          break

        case 'days_active':
          const userForDays = await User.findById(userId)
          if (!userForDays?.joinedAt) return false
          const daysSinceJoin = Math.floor((Date.now() - userForDays.joinedAt.getTime()) / (1000 * 60 * 60 * 24))
          value = daysSinceJoin
          break

        case 'user_id_threshold':
          // For "Early Adopter" badge - check if user ID is below threshold
          const userIdNum = parseInt(userId.toString().slice(-6), 16) // Convert last 6 hex chars to number
          value = userIdNum
          return operator === 'lt' ? value < target : value <= target

        default:
          return false
      }

      // Apply operator
      switch (operator) {
        case 'gte':
          return value >= target
        case 'gt':
          return value > target
        case 'lte':
          return value <= target
        case 'lt':
          return value < target
        case 'eq':
          return value === target
        default:
          return false
      }
    } catch (error) {
      console.error('Error checking criteria:', error)
      return false
    }
  }

  /**
   * Award a badge to user (idempotent - won't duplicate)
   */
  static async awardBadge(
    userId: mongoose.Types.ObjectId,
    badgeId: mongoose.Types.ObjectId,
    earnedFrom: string = 'system',
    metadata?: any
  ) {
    try {
      await UserBadge.create({
        userId,
        badgeId,
        earnedFrom,
        metadata
      })

      console.log(`🎖️  Badge ${badgeId} awarded to user ${userId}`)
      return true
    } catch (error: any) {
      // Duplicate key error (already has badge) - ignore silently
      if (error.code === 11000) {
        return false
      }
      throw error
    }
  }

  /**
   * Get user's badges with full badge info
   */
  static async getUserBadges(userId: mongoose.Types.ObjectId, onlyVisible: boolean = false) {
    const query: any = { userId }
    if (onlyVisible) {
      query.isVisible = true
    }

    return await UserBadge.find(query)
      .populate('badgeId')
      .sort({ earnedAt: -1 })
  }

  /**
   * Get user's pinned badges
   */
  static async getPinnedBadges(userId: mongoose.Types.ObjectId) {
    return await UserBadge.find({
      userId,
      isPinned: true,
      isVisible: true
    })
      .populate('badgeId')
      .sort({ pinnedOrder: 1 })
      .limit(3)
  }

  /**
   * Pin a badge (max 3)
   */
  static async pinBadge(userId: mongoose.Types.ObjectId, badgeId: mongoose.Types.ObjectId) {
    const userBadge = await UserBadge.findOne({ userId, badgeId })
    if (!userBadge) {
      throw new Error('Badge not found')
    }

    if (userBadge.isPinned) {
      throw new Error('Badge already pinned')
    }

    // Check current pinned count
    const pinnedCount = await UserBadge.countDocuments({ userId, isPinned: true })
    if (pinnedCount >= 3) {
      throw new Error('Maximum 3 badges can be pinned')
    }

    userBadge.isPinned = true
    await userBadge.save() // Pre-save middleware will assign pinnedOrder
    return userBadge
  }

  /**
   * Unpin a badge
   */
  static async unpinBadge(userId: mongoose.Types.ObjectId, badgeId: mongoose.Types.ObjectId) {
    const userBadge = await UserBadge.findOne({ userId, badgeId })
    if (!userBadge) {
      throw new Error('Badge not found')
    }

    if (!userBadge.isPinned) {
      throw new Error('Badge is not pinned')
    }

    userBadge.isPinned = false
    userBadge.pinnedOrder = undefined
    userBadge.pinnedAt = undefined
    await userBadge.save()
    return userBadge
  }

  /**
   * Toggle badge visibility
   */
  static async toggleBadgeVisibility(userId: mongoose.Types.ObjectId, badgeId: mongoose.Types.ObjectId) {
    const userBadge = await UserBadge.findOne({ userId, badgeId })
    if (!userBadge) {
      throw new Error('Badge not found')
    }

    userBadge.isVisible = !userBadge.isVisible
    await userBadge.save()
    return userBadge
  }

  /**
   * Get badge stats for user
   */
  static async getBadgeStats(userId: mongoose.Types.ObjectId) {
    const [total, byRarity, byCategory] = await Promise.all([
      // Total badges
      UserBadge.countDocuments({ userId, isVisible: true }),

      // By rarity
      UserBadge.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), isVisible: true } },
        {
          $lookup: {
            from: 'badges',
            localField: 'badgeId',
            foreignField: '_id',
            as: 'badge'
          }
        },
        { $unwind: '$badge' },
        {
          $group: {
            _id: '$badge.rarity',
            count: { $sum: 1 }
          }
        }
      ]),

      // By category
      UserBadge.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), isVisible: true } },
        {
          $lookup: {
            from: 'badges',
            localField: 'badgeId',
            foreignField: '_id',
            as: 'badge'
          }
        },
        { $unwind: '$badge' },
        {
          $group: {
            _id: '$badge.category',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    return {
      total,
      byRarity: byRarity.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {} as any),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {} as any)
    }
  }

  /**
   * Remove a badge from user (admin only)
   */
  static async removeBadge(userId: mongoose.Types.ObjectId, badgeId: mongoose.Types.ObjectId) {
    const result = await UserBadge.deleteOne({ userId, badgeId })
    return result.deletedCount > 0
  }
}
