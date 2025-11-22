import { Request, Response, NextFunction } from 'express'
import { AlphaPost } from '../models/AlphaPost.model'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { engagementService } from '../services/engagement.service'
import { BadgeService } from '../services/badge.service'
import mongoose from 'mongoose'

/**
 * @desc    Get all alpha posts with filtering and pagination
 * @route   GET /api/alpha/posts
 * @access  Private
 */
export const getAllAlphaPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Filters
    const filters: any = {}

    if (req.query.category) filters.category = req.query.category
    if (req.query.status) filters.status = req.query.status
    if (req.query.blockchain) filters.blockchain = req.query.blockchain
    if (req.query.scoutId) filters.scoutId = req.query.scoutId
    if (req.query.potentialRating) filters.potentialRating = req.query.potentialRating
    if (req.query.riskRating) filters.riskRating = req.query.riskRating
    if (req.query.outcome) filters.outcome = req.query.outcome
    if (req.query.tags) {
      filters.tags = { $in: (req.query.tags as string).split(',') }
    }

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const posts = await AlphaPost.find(filters)
      .populate('scoutId', 'displayName twitterUsername profileImage')
      .populate('validatedBy', 'displayName twitterUsername')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)

    const total = await AlphaPost.countDocuments(filters)

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
 * @desc    Get single alpha post by ID
 * @route   GET /api/alpha/posts/:id
 * @access  Private
 */
export const getAlphaPost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const post = await AlphaPost.findById(id)
      .populate('scoutId', 'displayName twitterUsername profileImage')
      .populate('validatedBy', 'displayName twitterUsername')

    if (!post) {
      return next(new AppError('Alpha post not found', 404))
    }

    // Track view with engagement service
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent']
    const authReq = req as AuthRequest
    const userId = authReq.user?._id || null

    await engagementService.trackView(
      userId,
      post._id as mongoose.Types.ObjectId,
      'alpha_post',
      ipAddress,
      userAgent
    )

    // Get like status for authenticated users
    let isLiked = false

    if (authReq.user) {
      isLiked = await engagementService.getLikeStatus(
        authReq.user._id,
        post._id as mongoose.Types.ObjectId,
        'alpha_post'
      )
    }

    res.status(200).json({
      success: true,
      data: {
        ...post.toObject(),
        isLiked,
      },
    })
  }
)

/**
 * @desc    Create new alpha post
 * @route   POST /api/alpha/posts
 * @access  Private (Scout role required)
 */
export const createAlphaPost = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id

    // Check if user has scout role (roles are populated objects with .name)
    const userRoleNames = req.user.roles.map((role: any) => role.name)
    if (!userRoleNames.includes('scout') && !userRoleNames.includes('admin') && !userRoleNames.includes('super_admin')) {
      return next(
        new AppError('Only scouts can create alpha posts', 403)
      )
    }

    const {
      category,
      projectName,
      projectDescription,
      blockchain,
      potentialRating,
      riskRating,
      details,
      requirements,
      deadline,
      links,
      tags,
      status,
    } = req.body

    // Validate required fields
    if (
      !category ||
      !projectName ||
      !projectDescription ||
      !blockchain ||
      !potentialRating ||
      !riskRating ||
      !details
    ) {
      return next(
        new AppError(
          'Please provide all required fields: category, projectName, projectDescription, blockchain, potentialRating, riskRating, details',
          400
        )
      )
    }

    // Validate category
    const validCategories = [
      'airdrop_radar',
      'testnet_tracker',
      'memecoin_calls',
      'defi_signals',
    ]
    if (!validCategories.includes(category)) {
      return next(new AppError('Invalid category', 400))
    }

    // Validate potential rating
    const validPotentialRatings = ['low', 'medium', 'high', 'very_high']
    if (!validPotentialRatings.includes(potentialRating)) {
      return next(new AppError('Invalid potential rating', 400))
    }

    // Validate risk rating
    const validRiskRatings = ['low', 'medium', 'high']
    if (!validRiskRatings.includes(riskRating)) {
      return next(new AppError('Invalid risk rating', 400))
    }

    const post = await AlphaPost.create({
      scoutId: userId,
      category,
      projectName,
      projectDescription,
      blockchain,
      potentialRating,
      riskRating,
      details,
      requirements,
      deadline,
      links: links || [],
      tags: tags || [],
      status: status || 'pending',
    })

    // Check for badge awards (non-blocking)
    BadgeService.checkActivityBadges(userId, 'alpha').catch(err => {
      console.error('Badge check error:', err)
    })

    res.status(201).json({
      success: true,
      data: post,
    })
  }
)

/**
 * @desc    Update alpha post
 * @route   PUT /api/alpha/posts/:id
 * @access  Private (author or admin)
 */
export const updateAlphaPost = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const userRoleNames = req.user.roles.map((role: any) => role.name)
    const isAdmin = userRoleNames.includes('admin') || userRoleNames.includes('super_admin')

    const post = await AlphaPost.findById(id)

    if (!post) {
      return next(new AppError('Alpha post not found', 404))
    }

    // Check authorization - must be author or admin
    if (post.scoutId.toString() !== userId.toString() && !isAdmin) {
      return next(
        new AppError('Not authorized to update this alpha post', 403)
      )
    }

    const {
      category,
      projectName,
      projectDescription,
      blockchain,
      potentialRating,
      riskRating,
      details,
      requirements,
      deadline,
      links,
      tags,
      status,
      outcome,
      outcomeNotes,
    } = req.body

    // Update allowed fields
    if (category !== undefined) post.category = category
    if (projectName !== undefined) post.projectName = projectName
    if (projectDescription !== undefined)
      post.projectDescription = projectDescription
    if (blockchain !== undefined) post.blockchain = blockchain
    if (potentialRating !== undefined) post.potentialRating = potentialRating
    if (riskRating !== undefined) post.riskRating = riskRating
    if (details !== undefined) post.details = details
    if (requirements !== undefined) post.requirements = requirements
    if (deadline !== undefined) post.deadline = deadline
    if (links !== undefined) post.links = links
    if (tags !== undefined) post.tags = tags
    if (status !== undefined) post.status = status
    if (outcome !== undefined) post.outcome = outcome
    if (outcomeNotes !== undefined) post.outcomeNotes = outcomeNotes

    await post.save()

    res.status(200).json({
      success: true,
      data: post,
    })
  }
)

/**
 * @desc    Vote on alpha post (bullish/bearish)
 * @route   POST /api/alpha/posts/:id/vote
 * @access  Private
 */
export const voteOnAlphaPost = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { vote } = req.body

    // Validate vote
    if (!vote || !['bullish', 'bearish'].includes(vote)) {
      return next(
        new AppError('Vote must be either "bullish" or "bearish"', 400)
      )
    }

    const post = await AlphaPost.findById(id)

    if (!post) {
      return next(new AppError('Alpha post not found', 404))
    }

    // Check if user already voted
    const existingVoteIndex = post.voters.findIndex(
      (voter) => voter.userId.toString() === userId.toString()
    )

    if (existingVoteIndex !== -1) {
      const existingVote = post.voters[existingVoteIndex].vote

      // If voting the same, remove vote
      if (existingVote === vote) {
        post.voters.splice(existingVoteIndex, 1)
        if (vote === 'bullish') {
          post.bullishVotes = Math.max(0, post.bullishVotes - 1)
        } else {
          post.bearishVotes = Math.max(0, post.bearishVotes - 1)
        }
      } else {
        // Change vote
        post.voters[existingVoteIndex].vote = vote
        post.voters[existingVoteIndex].votedAt = new Date()

        if (existingVote === 'bullish') {
          post.bullishVotes = Math.max(0, post.bullishVotes - 1)
          post.bearishVotes += 1
        } else {
          post.bearishVotes = Math.max(0, post.bearishVotes - 1)
          post.bullishVotes += 1
        }
      }
    } else {
      // Add new vote
      post.voters.push({
        userId: userId as any,
        vote,
        votedAt: new Date(),
      })

      if (vote === 'bullish') {
        post.bullishVotes += 1
      } else {
        post.bearishVotes += 1
      }
    }

    await post.save()

    res.status(200).json({
      success: true,
      data: {
        bullishVotes: post.bullishVotes,
        bearishVotes: post.bearishVotes,
        userVote: post.voters.find(
          (v) => v.userId.toString() === userId.toString()
        )?.vote || null,
      },
    })
  }
)

/**
 * @desc    Get comments for alpha post
 * @route   GET /api/alpha/posts/:id/comments
 * @access  Private
 */
export const getAlphaComments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const post = await AlphaPost.findById(id)

    if (!post) {
      return next(new AppError('Alpha post not found', 404))
    }

    // Note: This is a placeholder. In production, you would have a separate Comment model
    // For now, returning a mock structure
    res.status(200).json({
      success: true,
      message: 'Comments endpoint - requires Comment model implementation',
      count: 0,
      total: 0,
      page,
      pages: 0,
      data: [],
    })
  }
)

/**
 * @desc    Add comment to alpha post
 * @route   POST /api/alpha/posts/:id/comments
 * @access  Private
 */
export const addAlphaComment = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { content } = req.body

    if (!content || content.trim().length === 0) {
      return next(new AppError('Comment content is required', 400))
    }

    const post = await AlphaPost.findById(id)

    if (!post) {
      return next(new AppError('Alpha post not found', 404))
    }

    // Increment comment count
    post.commentsCount += 1
    await post.save()

    // Note: This is a placeholder. In production, you would create a Comment document
    // in a separate Comment model and return it
    res.status(201).json({
      success: true,
      message: 'Comment added - requires Comment model implementation',
      data: {
        postId: id,
        userId,
        content,
        createdAt: new Date(),
      },
    })
  }
)

/**
 * @desc    Delete alpha post
 * @route   DELETE /api/alpha/posts/:id
 * @access  Private (author or admin)
 */
export const deleteAlphaPost = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const userRoleNames = req.user.roles.map((role: any) => role.name)
    const isAdmin = userRoleNames.includes('admin') || userRoleNames.includes('super_admin')

    const post = await AlphaPost.findById(id)

    if (!post) {
      return next(new AppError('Alpha post not found', 404))
    }

    // Check authorization - must be author or admin
    if (post.scoutId.toString() !== userId.toString() && !isAdmin) {
      return next(
        new AppError('Not authorized to delete this alpha post', 403)
      )
    }

    await post.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Alpha post deleted successfully',
    })
  }
)

/**
 * @desc    Toggle alpha post like
 * @route   POST /api/alpha/posts/:id/like
 * @access  Private
 */
export const toggleAlphaLike = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id

    // Verify post exists
    const post = await AlphaPost.findById(id)
    if (!post) {
      return next(new AppError('Alpha post not found', 404))
    }

    // Toggle like using engagement service
    const result = await engagementService.toggleLike(
      userId,
      new mongoose.Types.ObjectId(id),
      'alpha_post'
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)
