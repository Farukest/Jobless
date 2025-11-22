import { Request, Response, NextFunction } from 'express'
import { Badge } from '../models/Badge.model'
import { UserBadge } from '../models/UserBadge.model'
import { BadgeService } from '../services/badge.service'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import mongoose from 'mongoose'

/**
 * @desc    Get my badges
 * @route   GET /api/badges/my-badges
 * @access  Private
 */
export const getMyBadges = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id

    const badges = await BadgeService.getUserBadges(userId, true) // Only visible
    const stats = await BadgeService.getBadgeStats(userId)

    res.status(200).json({
      success: true,
      count: badges.length,
      stats,
      data: badges
    })
  }
)

/**
 * @desc    Get user badges (public)
 * @route   GET /api/badges/user/:userId
 * @access  Private
 */
export const getUserBadges = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400)
    }

    const badges = await BadgeService.getUserBadges(
      new mongoose.Types.ObjectId(userId),
      true // Only visible
    )

    const pinnedBadges = await BadgeService.getPinnedBadges(
      new mongoose.Types.ObjectId(userId)
    )

    res.status(200).json({
      success: true,
      count: badges.length,
      data: {
        all: badges,
        pinned: pinnedBadges
      }
    })
  }
)

/**
 * @desc    Get my pinned badges
 * @route   GET /api/badges/pinned
 * @access  Private
 */
export const getMyPinnedBadges = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id

    const pinnedBadges = await BadgeService.getPinnedBadges(userId)

    res.status(200).json({
      success: true,
      count: pinnedBadges.length,
      data: pinnedBadges
    })
  }
)

/**
 * @desc    Pin a badge
 * @route   POST /api/badges/pin/:badgeId
 * @access  Private
 */
export const pinBadge = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { badgeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid badge ID', 400))
    }

    const userBadge = await BadgeService.pinBadge(
      userId,
      new mongoose.Types.ObjectId(badgeId)
    )

    res.status(200).json({
      success: true,
      message: 'Badge pinned successfully',
      data: userBadge
    })
  }
)

/**
 * @desc    Unpin a badge
 * @route   DELETE /api/badges/pin/:badgeId
 * @access  Private
 */
export const unpinBadge = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { badgeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid badge ID', 400))
    }

    const userBadge = await BadgeService.unpinBadge(
      userId,
      new mongoose.Types.ObjectId(badgeId)
    )

    res.status(200).json({
      success: true,
      message: 'Badge unpinned successfully',
      data: userBadge
    })
  }
)

/**
 * @desc    Toggle badge visibility
 * @route   PATCH /api/badges/visibility/:badgeId
 * @access  Private
 */
export const toggleBadgeVisibility = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { badgeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid badge ID', 400))
    }

    const userBadge = await BadgeService.toggleBadgeVisibility(
      userId,
      new mongoose.Types.ObjectId(badgeId)
    )

    res.status(200).json({
      success: true,
      message: userBadge.isVisible ? 'Badge is now visible' : 'Badge is now hidden',
      data: userBadge
    })
  }
)

/**
 * @desc    Manually check badges for current user
 * @route   POST /api/badges/check
 * @access  Private
 */
export const checkMyBadges = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id

    // Check role badges
    await BadgeService.checkRoleBadges(userId)

    // Check all activity badges
    await BadgeService.checkAllActivityBadges(userId)

    const badges = await BadgeService.getUserBadges(userId, true)

    res.status(200).json({
      success: true,
      message: 'Badges checked successfully',
      count: badges.length,
      data: badges
    })
  }
)

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * @desc    Get all badges (admin)
 * @route   GET /api/badges/admin/all
 * @access  Private (super_admin)
 */
export const getAllBadges = asyncHandler(
  async (req: Request, res: Response) => {
    const { category, type, rarity, isActive } = req.query

    const filter: any = {}
    if (category) filter.category = category
    if (type) filter.type = type
    if (rarity) filter.rarity = rarity
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const badges = await Badge.find(filter)
      .sort({ category: 1, order: 1, createdAt: -1 })
      .populate('createdBy', 'displayName twitterUsername')

    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    })
  }
)

/**
 * @desc    Get single badge (admin)
 * @route   GET /api/badges/admin/:badgeId
 * @access  Private (super_admin)
 */
export const getBadge = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { badgeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid badge ID', 400))
    }

    const badge = await Badge.findById(badgeId).populate('createdBy', 'displayName twitterUsername')

    if (!badge) {
      return next(new AppError('Badge not found', 404))
    }

    // Get stats: how many users have this badge
    const userCount = await UserBadge.countDocuments({ badgeId })

    res.status(200).json({
      success: true,
      data: {
        badge,
        stats: {
          usersWithBadge: userCount
        }
      }
    })
  }
)

/**
 * @desc    Create badge (admin)
 * @route   POST /api/badges/admin/create
 * @access  Private (super_admin)
 */
export const createBadge = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      name,
      displayName,
      description,
      iconName,
      color,
      gradientStart,
      gradientEnd,
      animationType,
      type,
      category,
      criteria,
      requiredRoles,
      rarity,
      tier,
      order
    } = req.body

    // Validation
    if (!name || !displayName || !description || !iconName || !color || !type || !category) {
      return next(new AppError('Missing required fields', 400))
    }

    // Check if badge with same name exists
    const existingBadge = await Badge.findOne({ name: name.toLowerCase() })
    if (existingBadge) {
      return next(new AppError('Badge with this name already exists', 400))
    }

    const badge = await Badge.create({
      name: name.toLowerCase(),
      displayName,
      description,
      iconName,
      color,
      gradientStart,
      gradientEnd,
      animationType: animationType || 'pulse',
      type,
      category,
      criteria,
      requiredRoles,
      rarity: rarity || 'common',
      tier,
      order: order || 0,
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      message: 'Badge created successfully',
      data: badge
    })
  }
)

/**
 * @desc    Update badge (admin)
 * @route   PUT /api/badges/admin/:badgeId
 * @access  Private (super_admin)
 */
export const updateBadge = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { badgeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid badge ID', 400))
    }

    const badge = await Badge.findById(badgeId)
    if (!badge) {
      return next(new AppError('Badge not found', 404))
    }

    // Update fields
    const updateFields = [
      'displayName', 'description', 'iconName', 'color', 'gradientStart', 'gradientEnd',
      'animationType', 'type', 'category', 'criteria', 'requiredRoles', 'rarity',
      'tier', 'order', 'isActive'
    ]

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        (badge as any)[field] = req.body[field]
      }
    })

    await badge.save()

    res.status(200).json({
      success: true,
      message: 'Badge updated successfully',
      data: badge
    })
  }
)

/**
 * @desc    Delete badge (admin)
 * @route   DELETE /api/badges/admin/:badgeId
 * @access  Private (super_admin)
 */
export const deleteBadge = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { badgeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid badge ID', 400))
    }

    const badge = await Badge.findById(badgeId)
    if (!badge) {
      return next(new AppError('Badge not found', 404))
    }

    // Check if any users have this badge
    const userBadgeCount = await UserBadge.countDocuments({ badgeId })
    if (userBadgeCount > 0) {
      return next(new AppError(`Cannot delete badge. ${userBadgeCount} users have this badge.`, 400))
    }

    await badge.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Badge deleted successfully'
    })
  }
)

/**
 * @desc    Manually award badge to user (admin)
 * @route   POST /api/badges/admin/award
 * @access  Private (super_admin)
 */
export const manualAwardBadge = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, badgeId, note } = req.body

    if (!userId || !badgeId) {
      return next(new AppError('User ID and Badge ID are required', 400))
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid user ID or badge ID', 400))
    }

    const badge = await Badge.findById(badgeId)
    if (!badge) {
      return next(new AppError('Badge not found', 404))
    }

    const awarded = await BadgeService.awardBadge(
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(badgeId),
      'manual',
      { manualNote: note, awardedBy: req.user._id }
    )

    if (!awarded) {
      return next(new AppError('User already has this badge', 400))
    }

    res.status(200).json({
      success: true,
      message: 'Badge awarded successfully'
    })
  }
)

/**
 * @desc    Remove badge from user (admin)
 * @route   DELETE /api/badges/admin/remove
 * @access  Private (super_admin)
 */
export const removeBadgeFromUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, badgeId } = req.body

    if (!userId || !badgeId) {
      return next(new AppError('User ID and Badge ID are required', 400))
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(badgeId)) {
      return next(new AppError('Invalid user ID or badge ID', 400))
    }

    const removed = await BadgeService.removeBadge(
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(badgeId)
    )

    if (!removed) {
      return next(new AppError('User does not have this badge', 404))
    }

    res.status(200).json({
      success: true,
      message: 'Badge removed from user successfully'
    })
  }
)

/**
 * @desc    Get badge statistics (admin)
 * @route   GET /api/badges/admin/stats
 * @access  Private (super_admin)
 */
export const getBadgeStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    const [
      totalBadges,
      activeBadges,
      totalAwarded,
      byRarity,
      byCategory,
      topBadges
    ] = await Promise.all([
      Badge.countDocuments(),
      Badge.countDocuments({ isActive: true }),
      UserBadge.countDocuments(),

      // By rarity
      Badge.aggregate([
        { $group: { _id: '$rarity', count: { $sum: 1 } } }
      ]),

      // By category
      Badge.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),

      // Top 10 most earned badges
      UserBadge.aggregate([
        { $group: { _id: '$badgeId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'badges',
            localField: '_id',
            foreignField: '_id',
            as: 'badge'
          }
        },
        { $unwind: '$badge' },
        {
          $project: {
            name: '$badge.displayName',
            icon: '$badge.iconName',
            count: 1
          }
        }
      ])
    ])

    res.status(200).json({
      success: true,
      data: {
        totalBadges,
        activeBadges,
        totalAwarded,
        byRarity: byRarity.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {} as any),
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {} as any),
        topBadges
      }
    })
  }
)
