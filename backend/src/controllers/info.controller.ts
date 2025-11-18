import { Request, Response, NextFunction } from 'express'
import { EngagementPost } from '../models/EngagementPost.model'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

/**
 * @desc    Get all engagement posts with filtering and pagination
 * @route   GET /api/info/posts
 * @access  Private
 */
export const getAllPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Filters
    const filters: any = {}

    if (req.query.platform) filters.platform = req.query.platform
    if (req.query.status) filters.status = req.query.status
    if (req.query.engagementType) filters.engagementType = req.query.engagementType
    if (req.query.isVerified !== undefined) filters.isVerified = req.query.isVerified === 'true'
    if (req.query.submitterId) filters.submitterId = req.query.submitterId

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const posts = await EngagementPost.find(filters)
      .populate('submitterId', 'displayName twitterUsername profileImage')
      .populate('participants.userId', 'displayName twitterUsername profileImage')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)

    const total = await EngagementPost.countDocuments(filters)

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: posts,
    })
  }
)

/**
 * @desc    Get single engagement post by ID
 * @route   GET /api/info/posts/:id
 * @access  Private
 */
export const getPost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const post = await EngagementPost.findById(id)
      .populate('submitterId', 'displayName twitterUsername profileImage')
      .populate('participants.userId', 'displayName twitterUsername profileImage')
      .populate('verifiedBy', 'displayName twitterUsername')

    if (!post) {
      return next(new AppError('Engagement post not found', 404))
    }

    res.status(200).json({
      success: true,
      data: post,
    })
  }
)

/**
 * @desc    Create new engagement post
 * @route   POST /api/info/posts
 * @access  Private
 */
export const createPost = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const {
      platform,
      postUrl,
      postType,
      campaignName,
      engagementType,
      requiredActions,
      description,
      expiresAt,
    } = req.body

    // Validate required fields
    if (!platform || !postUrl || !campaignName || !engagementType || !requiredActions) {
      return next(new AppError('Please provide all required fields', 400))
    }

    if (!['twitter', 'farcaster'].includes(platform)) {
      return next(new AppError('Invalid platform', 400))
    }

    if (!Array.isArray(requiredActions) || requiredActions.length === 0) {
      return next(new AppError('Required actions must be a non-empty array', 400))
    }

    const post = await EngagementPost.create({
      submitterId: userId,
      platform,
      postUrl,
      postType: postType || 'tweet',
      campaignName,
      engagementType,
      requiredActions,
      description,
      expiresAt,
      status: 'active',
    })

    const populatedPost = await EngagementPost.findById(post._id)
      .populate('submitterId', 'displayName twitterUsername profileImage')

    res.status(201).json({
      success: true,
      data: populatedPost,
    })
  }
)

/**
 * @desc    Submit engagement proof
 * @route   POST /api/info/posts/:id/engage
 * @access  Private
 */
export const submitEngagement = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { proofUrl } = req.body

    if (!proofUrl) {
      return next(new AppError('Proof URL is required', 400))
    }

    const post = await EngagementPost.findById(id)

    if (!post) {
      return next(new AppError('Engagement post not found', 404))
    }

    if (post.status !== 'active') {
      return next(new AppError('This engagement post is no longer active', 400))
    }

    if (post.expiresAt && new Date() > post.expiresAt) {
      post.status = 'expired'
      await post.save()
      return next(new AppError('This engagement post has expired', 400))
    }

    // Check if user already engaged
    const hasEngaged = post.participants.some(
      (p) => p.userId.toString() === userId.toString()
    )

    if (hasEngaged) {
      return next(new AppError('You have already engaged with this post', 400))
    }

    // Add participant
    const pointsEarned = post.isVerified ? 10 : 5 // Base points, can be adjusted

    post.participants.push({
      userId: userId as any,
      proofUrl,
      engagedAt: new Date(),
      pointsEarned,
    })

    post.engagementCount = post.participants.length
    await post.save()

    // Update user points
    await User.findByIdAndUpdate(userId, {
      $inc: { jRankPoints: pointsEarned },
    })

    const updatedPost = await EngagementPost.findById(id)
      .populate('submitterId', 'displayName twitterUsername profileImage')
      .populate('participants.userId', 'displayName twitterUsername profileImage')

    res.status(200).json({
      success: true,
      message: 'Engagement submitted successfully',
      data: {
        post: updatedPost,
        pointsEarned,
      },
    })
  }
)

/**
 * @desc    Get user's engagements
 * @route   GET /api/info/my-engagements
 * @access  Private
 */
export const getMyEngagements = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Find posts where user is a participant
    const posts = await EngagementPost.find({
      'participants.userId': userId,
    })
      .populate('submitterId', 'displayName twitterUsername profileImage')
      .sort({ 'participants.engagedAt': -1 })
      .skip(skip)
      .limit(limit)

    const total = await EngagementPost.countDocuments({
      'participants.userId': userId,
    })

    // Extract user's engagement data from each post
    const engagements = posts.map((post) => {
      const userEngagement = post.participants.find(
        (p) => p.userId.toString() === userId.toString()
      )
      return {
        post: {
          _id: post._id,
          platform: post.platform,
          postUrl: post.postUrl,
          campaignName: post.campaignName,
          engagementType: post.engagementType,
          status: post.status,
          isVerified: post.isVerified,
          submitterId: post.submitterId,
        },
        engagement: userEngagement,
      }
    })

    // Calculate total points earned
    const totalPointsEarned = engagements.reduce(
      (sum, e) => sum + (e.engagement?.pointsEarned || 0),
      0
    )

    res.status(200).json({
      success: true,
      count: engagements.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      totalPointsEarned,
      data: engagements,
    })
  }
)

/**
 * @desc    Verify engagement post (admin only)
 * @route   PUT /api/info/posts/:id/verify
 * @access  Private (admin)
 */
export const verifyPost = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { isVerified } = req.body

    if (typeof isVerified !== 'boolean') {
      return next(new AppError('isVerified must be a boolean', 400))
    }

    const post = await EngagementPost.findById(id)

    if (!post) {
      return next(new AppError('Engagement post not found', 404))
    }

    const wasVerified = post.isVerified

    post.isVerified = isVerified
    if (isVerified) {
      post.verifiedBy = userId as any
    } else {
      post.verifiedBy = undefined
    }

    await post.save()

    // If newly verified, update points for all participants
    if (isVerified && !wasVerified) {
      const bonusPoints = 5 // Bonus points for verified engagement

      for (const participant of post.participants) {
        participant.pointsEarned += bonusPoints
        await User.findByIdAndUpdate(participant.userId, {
          $inc: { jRankPoints: bonusPoints },
        })
      }
      await post.save()
    }

    const updatedPost = await EngagementPost.findById(id)
      .populate('submitterId', 'displayName twitterUsername profileImage')
      .populate('participants.userId', 'displayName twitterUsername profileImage')
      .populate('verifiedBy', 'displayName twitterUsername')

    res.status(200).json({
      success: true,
      message: `Engagement post ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: updatedPost,
    })
  }
)
