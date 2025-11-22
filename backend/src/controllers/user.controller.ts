import { Request, Response, NextFunction } from 'express'
import { User } from '../models/User.model'
import { Content } from '../models/Content.model'
import { ProductionRequest } from '../models/ProductionRequest.model'
import { Course } from '../models/Course.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { EngagementPost } from '../models/EngagementPost.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { FileProcessor } from '../utils/file-processor'
import { BadgeService } from '../services/badge.service'
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
