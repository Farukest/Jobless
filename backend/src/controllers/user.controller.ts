import { Request, Response, NextFunction } from 'express'
import { User } from '../models/User.model'
import { Content } from '../models/Content.model'
import { ProductionRequest } from '../models/ProductionRequest.model'
import { Course } from '../models/Course.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { EngagementPost } from '../models/EngagementPost.model'
import { Comment } from '../models/Comment.model'
import { Like } from '../models/Like.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { FileProcessor } from '../utils/file-processor'
import { BadgeService } from '../services/badge.service'
import { configHelper } from '../utils/config-helper'
import mongoose from 'mongoose'

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile/:userId
 * @access  Private
 */
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params

    const user = await User.findById(userId)
      .populate('roles', 'name displayName description')
      .select('-twitterAccessToken -twitterRefreshToken')

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  }
)

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { displayName, bio, theme } = req.body

    const user = await User.findById(userId)

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Update allowed fields
    if (displayName !== undefined) user.displayName = displayName
    if (bio !== undefined) user.bio = bio
    if (theme !== undefined) user.theme = theme

    await user.save()

    res.status(200).json({
      success: true,
      data: user,
    })
  }
)

/**
 * @desc    Update profile picture
 * @route   PUT /api/users/profile-picture
 * @access  Private
 */
export const updateProfilePicture = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { imageUrl } = req.body

    if (!imageUrl) {
      return next(new AppError('Image URL is required', 400))
    }

    const user = await User.findById(userId)

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Delete old profile picture if exists
    if (user.profileImage) {
      // Extract filename from URL and delete
      const oldPath = user.profileImage.replace(
        `${process.env.BACKEND_URL}/uploads/`,
        'uploads/'
      )
      FileProcessor.deleteFile(oldPath)
    }

    user.profileImage = imageUrl
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        profileImage: user.profileImage,
      },
    })
  }
)

/**
 * @desc    Get user stats
 * @route   GET /api/users/stats
 * @access  Private
 */
export const getUserStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id

    const [
      contentsCreated,
      productionRequests,
      coursesEnrolled,
      alphasSubmitted,
      engagementsGiven,
    ] = await Promise.all([
      Content.countDocuments({ authorId: userId }),
      ProductionRequest.countDocuments({ requesterId: userId }),
      Course.countDocuments({ mentorId: userId }),
      AlphaPost.countDocuments({ scoutId: userId }),
      EngagementPost.countDocuments({ submitterId: userId }),
    ])

    const user = await User.findById(userId)

    res.status(200).json({
      success: true,
      data: {
        jHub: {
          contentsCreated,
        },
        jStudio: {
          requestsSubmitted: productionRequests,
        },
        jAcademy: {
          coursesCreated: coursesEnrolled,
        },
        jAlpha: {
          alphasSubmitted,
        },
        jInfo: {
          engagementsGiven,
        },
        overall: {
          jRankPoints: user?.jRankPoints || 0,
          contributionScore: user?.contributionScore || 0,
        },
      },
    })
  }
)

/**
 * @desc    Get user activity
 * @route   GET /api/users/activity
 * @access  Private
 */
export const getUserActivity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const activities: any[] = []

    // Get recent contents
    const contents = await Content.find({ authorId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title contentType createdAt status')

    contents.forEach(content => {
      activities.push({
        type: 'content_created',
        module: 'j_hub',
        description: `Created ${content.contentType}: ${content.title}`,
        timestamp: (content as any).createdAt,
        status: content.status,
      })
    })

    // Get recent production requests
    const requests = await ProductionRequest.find({ requesterId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title requestType createdAt status')

    requests.forEach(request => {
      activities.push({
        type: 'production_request',
        module: 'j_studio',
        description: `Submitted ${request.requestType} request: ${request.title}`,
        timestamp: (request as any).createdAt,
        status: request.status,
      })
    })

    // Get recent alphas
    const alphas = await AlphaPost.find({ scoutId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('projectName category createdAt status')

    alphas.forEach(alpha => {
      activities.push({
        type: 'alpha_submitted',
        module: 'j_alpha',
        description: `Submitted alpha: ${alpha.projectName}`,
        timestamp: (alpha as any).createdAt,
        status: alpha.status,
      })
    })

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedActivities = activities.slice(startIndex, endIndex)

    res.status(200).json({
      success: true,
      count: paginatedActivities.length,
      total: activities.length,
      page,
      pages: Math.ceil(activities.length / limit),
      data: paginatedActivities,
    })
  }
)

/**
 * @desc    Add wallet to whitelist
 * @route   POST /api/users/wallet
 * @access  Private
 */
export const addWhitelistWallet = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { walletAddress } = req.body

    if (!walletAddress) {
      return next(new AppError('Wallet address is required', 400))
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return next(new AppError('Invalid Ethereum address', 400))
    }

    const user = await User.findById(userId)

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    const normalizedAddress = walletAddress.toLowerCase()

    // Check if already whitelisted
    if (user.whitelistWallets.includes(normalizedAddress)) {
      return next(new AppError('Wallet already whitelisted', 400))
    }

    user.whitelistWallets.push(normalizedAddress)
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Wallet added to whitelist',
      data: {
        whitelistWallets: user.whitelistWallets,
      },
    })
  }
)

/**
 * @desc    Remove wallet from whitelist
 * @route   DELETE /api/users/wallet/:walletAddress
 * @access  Private
 */
export const removeWhitelistWallet = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { walletAddress } = req.params

    const user = await User.findById(userId)

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    const normalizedAddress = walletAddress.toLowerCase()

    user.whitelistWallets = user.whitelistWallets.filter(
      addr => addr !== normalizedAddress
    )
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Wallet removed from whitelist',
      data: {
        whitelistWallets: user.whitelistWallets,
      },
    })
  }
)

/**
 * @desc    Get user leaderboard
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
export const getLeaderboard = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const sortBy = (req.query.sortBy as string) || 'jRankPoints'

    const skip = (page - 1) * limit

    const users = await User.find({ status: 'active' })
      .select('displayName twitterUsername profileImage jRankPoints contributionScore')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments({ status: 'active' })

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    })
  }
)

/**
 * @desc    Search users for mentions
 * @route   GET /api/users/search?q=query
 * @access  Private
 */
export const searchUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const query = (req.query.q as string) || ''
    const limit = parseInt(req.query.limit as string) || 10

    if (!query || query.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: [],
      })
    }

    const searchTerm = query.trim()

    // Search by displayName or twitterUsername (case-insensitive, partial match)
    const users = await User.find({
      status: 'active',
      $or: [
        { displayName: { $regex: searchTerm, $options: 'i' } },
        { twitterUsername: { $regex: searchTerm, $options: 'i' } },
      ],
    })
      .select('_id displayName twitterUsername profileImage')
      .limit(limit)
      .lean()

    res.status(200).json({
      success: true,
      data: users,
    })
  }
)

/**
 * @desc    Get user badges
 * @route   GET /api/users/:userId/badges
 * @access  Private
 */
export const getUserBadges = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params
    const onlyVisible = req.query.onlyVisible === 'true'

    const badges = await BadgeService.getUserBadges(
      new mongoose.Types.ObjectId(userId),
      onlyVisible
    )

    res.status(200).json({
      success: true,
      data: badges,
    })
  }
)

/**
 * @desc    Get user badge stats
 * @route   GET /api/users/:userId/badges/stats
 * @access  Private
 */
export const getUserBadgeStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params

    const stats = await BadgeService.getBadgeStats(
      new mongoose.Types.ObjectId(userId)
    )

    res.status(200).json({
      success: true,
      data: stats,
    })
  }
)

// ============ PROFILE FEED ENDPOINTS ============

/**
 * @desc    Get user's own content (My Zone feed)
 * @route   GET /api/users/:userId/feed/my-zone
 * @access  Private
 */
export const getMyZoneFeed = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1

    // Get limit from system config
    const hubLimits = await configHelper.get('hub_limits')
    const limit = hubLimits?.profile_feed_limit || 10
    const skip = (page - 1) * limit

    // Fetch user's own content (published only)
    const contents = await Content.find({
      authorId: new mongoose.Types.ObjectId(userId),
      status: 'published',
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'username displayName profileImage')
      .lean()

    const totalCount = await Content.countDocuments({
      authorId: new mongoose.Types.ObjectId(userId),
      status: 'published',
    })

    res.status(200).json({
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page < Math.ceil(totalCount / limit),
      },
    })
  }
)

/**
 * @desc    Get user's liked content (Liked feed)
 * @route   GET /api/users/:userId/feed/liked
 * @access  Private
 */
export const getLikedFeed = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1

    const hubLimits = await configHelper.get('hub_limits')
    const limit = hubLimits?.profile_feed_limit || 10
    const skip = (page - 1) * limit

    // Find all likes by this user
    const likes = await Like.find({
      userId: new mongoose.Types.ObjectId(userId),
      targetType: 'hub_content',
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const contentIds = likes.map((like) => like.targetId)

    // Fetch the actual content
    const contents = await Content.find({
      _id: { $in: contentIds },
      status: 'published',
    })
      .populate('authorId', 'username displayName profileImage')
      .lean()

    // Sort by like date (maintain like order)
    const sortedContents = contentIds
      .map((id) => contents.find((c: any) => c._id.toString() === id.toString()))
      .filter(Boolean)

    const totalCount = await Like.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      targetType: 'hub_content',
    })

    res.status(200).json({
      success: true,
      data: sortedContents,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page < Math.ceil(totalCount / limit),
      },
    })
  }
)

/**
 * @desc    Get user's commented posts (Commented feed with thread structure)
 * @route   GET /api/users/:userId/feed/commented
 * @access  Private
 */
export const getCommentedFeed = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1

    const hubLimits = await configHelper.get('hub_limits')
    const limit = hubLimits?.profile_feed_limit || 10
    const skip = (page - 1) * limit

    // Find all comments by this user
    const userComments = await Comment.find({
      userId: new mongoose.Types.ObjectId(userId),
      contentType: 'hub_content',
    })
      .sort({ createdAt: -1 })
      .lean()

    // Group comments by content (one post per content)
    const contentMap = new Map()

    for (const comment of userComments) {
      const contentId = comment.contentId.toString()
      if (!contentMap.has(contentId)) {
        contentMap.set(contentId, [])
      }
      contentMap.get(contentId).push(comment)
    }

    // Get unique content IDs (sorted by most recent comment)
    const uniqueContentIds = Array.from(contentMap.keys()).slice(skip, skip + limit)

    // Fetch the main content posts
    const contents = await Content.find({
      _id: { $in: uniqueContentIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .populate('authorId', 'username displayName profileImage')
      .lean()

    // Build comment threads for each content
    const threadsData = await Promise.all(
      uniqueContentIds.map(async (contentId) => {
        const userCommentsForContent = contentMap.get(contentId)
        const content = contents.find((c: any) => c._id.toString() === contentId)

        if (!content) return null

        // Build thread: Start with main post, then all comments in the chain
        const thread = []

        // Add main post as first item
        thread.push({
          type: 'content',
          data: content,
          isUserComment: false,
        })

        // For each user comment, build the chain from main post to that comment
        for (const userComment of userCommentsForContent) {
          const commentChain = await buildCommentChain(userComment._id, userId)
          thread.push(...commentChain)
        }

        return {
          contentId,
          content,
          thread,
        }
      })
    )

    const totalCount = contentMap.size

    res.status(200).json({
      success: true,
      data: threadsData.filter(Boolean),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page < Math.ceil(totalCount / limit),
      },
    })
  }
)

// Helper function to build comment chain
async function buildCommentChain(commentId: mongoose.Types.ObjectId, userId: string) {
  const chain = []
  let currentCommentId: mongoose.Types.ObjectId | undefined = commentId

  while (currentCommentId) {
    const comment = await Comment.findById(currentCommentId)
      .populate('userId', 'username displayName profileImage')
      .lean()

    if (!comment) break

    chain.unshift({
      type: 'comment',
      data: comment,
      isUserComment: comment.userId._id.toString() === userId,
    })

    currentCommentId = comment.parentCommentId
  }

  return chain
}

/**
 * @desc    Get user's personalized feed (My Feed - based on interests)
 * @route   GET /api/users/:userId/feed/my-feed
 * @access  Private
 */
export const getMyFeed = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1

    const hubLimits = await configHelper.get('hub_limits')
    const limit = hubLimits?.profile_feed_limit || 10
    const skip = (page - 1) * limit

    // Analyze user's interests based on their interactions
    const interests = await analyzeUserInterests(userId)

    // If no interests found, return recent popular content
    if (interests.length === 0) {
      const contents = await Content.find({
        status: 'published',
        authorId: { $ne: new mongoose.Types.ObjectId(userId) }, // Exclude own posts
      })
        .sort({ likesCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'username displayName profileImage')
        .lean()

      const totalCount = await Content.countDocuments({
        status: 'published',
        authorId: { $ne: new mongoose.Types.ObjectId(userId) },
      })

      return res.status(200).json({
        success: true,
        data: contents,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasMore: page < Math.ceil(totalCount / limit),
        },
      })
    }

    // Fetch content matching user's interests
    const contents = await Content.find({
      status: 'published',
      authorId: { $ne: new mongoose.Types.ObjectId(userId) },
      $or: interests.map((interest) => ({
        contentType: interest.contentType,
        category: interest.category,
      })),
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'username displayName profileImage')
      .lean()

    const totalCount = await Content.countDocuments({
      status: 'published',
      authorId: { $ne: new mongoose.Types.ObjectId(userId) },
      $or: interests.map((interest) => ({
        contentType: interest.contentType,
        category: interest.category,
      })),
    })

    res.status(200).json({
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page < Math.ceil(totalCount / limit),
      },
    })
  }
)

// Helper function to analyze user interests
async function analyzeUserInterests(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Find user's likes and comments
  const likes = await Like.find({
    userId: userObjectId,
    targetType: 'hub_content',
  }).lean()

  const comments = await Comment.find({
    userId: userObjectId,
    contentType: 'hub_content',
  }).lean()

  // Get content IDs from interactions
  const likedContentIds = likes.map((like) => like.targetId)
  const commentedContentIds = comments.map((comment) => comment.contentId)
  const allContentIds = [...likedContentIds, ...commentedContentIds]

  if (allContentIds.length === 0) {
    return []
  }

  // Fetch interacted content to analyze patterns
  const interactedContent = await Content.find({
    _id: { $in: allContentIds },
  })
    .select('contentType category')
    .lean()

  // Count content type + category combinations
  const combinationCounts: Record<string, number> = {}

  for (const content of interactedContent) {
    const key = `${content.contentType}|${content.category}`
    combinationCounts[key] = (combinationCounts[key] || 0) + 1
  }

  // Sort by count and return top combinations
  const sortedCombinations = Object.entries(combinationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5 interests
    .map(([key]) => {
      const [contentType, category] = key.split('|')
      return { contentType, category }
    })

  return sortedCombinations
}
