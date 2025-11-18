import { Request, Response, NextFunction } from 'express'
import { Content } from '../models/Content.model'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { configHelper } from '../utils/config-helper'

/**
 * @desc    Get all contents with filtering and pagination
 * @route   GET /api/hub/content
 * @access  Private
 */
export const getAllContents = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Filters
    const filters: any = { status: 'published' }

    if (req.query.category) filters.category = req.query.category
    if (req.query.contentType) filters.contentType = req.query.contentType
    if (req.query.difficulty) filters.difficulty = req.query.difficulty
    if (req.query.authorId) filters.authorId = req.query.authorId
    if (req.query.tags) {
      filters.tags = { $in: (req.query.tags as string).split(',') }
    }

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const contents = await Content.find(filters)
      .populate('authorId', 'displayName twitterUsername profileImage')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)

    const total = await Content.countDocuments(filters)

    res.status(200).json({
      success: true,
      count: contents.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: contents,
    })
  }
)

/**
 * @desc    Get single content by ID
 * @route   GET /api/hub/content/:id
 * @access  Private
 */
export const getContent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const content = await Content.findById(id).populate(
      'authorId',
      'displayName twitterUsername profileImage'
    )

    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    // Increment view count
    content.views += 1
    await content.save()

    res.status(200).json({
      success: true,
      data: content,
    })
  }
)

/**
 * @desc    Create new content
 * @route   POST /api/hub/content
 * @access  Private (requires canCreateContent permission)
 */
export const createContent = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const {
      title,
      description,
      contentType,
      body,
      mediaUrls,
      tags,
      category,
      difficulty,
      status,
    } = req.body

    // Validate against dynamic config
    const validCategories = await configHelper.get('content_categories')
    if (category && !validCategories.includes(category)) {
      return next(new AppError('Invalid content category', 400))
    }

    const validTypes = await configHelper.get('content_types')
    if (!validTypes.includes(contentType)) {
      return next(new AppError('Invalid content type', 400))
    }

    if (difficulty) {
      const validDifficulties = await configHelper.get('difficulty_levels')
      if (!validDifficulties.includes(difficulty)) {
        return next(new AppError('Invalid difficulty level', 400))
      }
    }

    const content = await Content.create({
      authorId: userId,
      title,
      description,
      contentType,
      body,
      mediaUrls: mediaUrls || [],
      tags: tags || [],
      category,
      difficulty,
      status: status || 'draft',
    })

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { contentCreated: 1 },
    })

    res.status(201).json({
      success: true,
      data: content,
    })
  }
)

/**
 * @desc    Update content
 * @route   PUT /api/hub/content/:id
 * @access  Private (author or moderator)
 */
export const updateContent = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const canModerate = req.user.permissions.canModerateContent

    const content = await Content.findById(id)

    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    // Check authorization
    if (content.authorId.toString() !== userId.toString() && !canModerate) {
      return next(new AppError('Not authorized to update this content', 403))
    }

    const {
      title,
      description,
      contentType,
      body,
      mediaUrls,
      tags,
      category,
      difficulty,
      status,
      isFeatured,
      isPinned,
    } = req.body

    // Update allowed fields
    if (title !== undefined) content.title = title
    if (description !== undefined) content.description = description
    if (contentType !== undefined) content.contentType = contentType
    if (body !== undefined) content.body = body
    if (mediaUrls !== undefined) content.mediaUrls = mediaUrls
    if (tags !== undefined) content.tags = tags
    if (category !== undefined) content.category = category
    if (difficulty !== undefined) content.difficulty = difficulty
    if (status !== undefined) content.status = status

    // Only moderators can feature/pin
    if (canModerate) {
      if (isFeatured !== undefined) content.isFeatured = isFeatured
      if (isPinned !== undefined) content.isPinned = isPinned
    }

    await content.save()

    res.status(200).json({
      success: true,
      data: content,
    })
  }
)

/**
 * @desc    Delete content
 * @route   DELETE /api/hub/content/:id
 * @access  Private (author or moderator)
 */
export const deleteContent = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const canModerate = req.user.permissions.canModerateContent

    const content = await Content.findById(id)

    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    // Check authorization
    if (content.authorId.toString() !== userId.toString() && !canModerate) {
      return next(new AppError('Not authorized to delete this content', 403))
    }

    await content.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    })
  }
)

/**
 * @desc    Get my contents
 * @route   GET /api/hub/my-content
 * @access  Private
 */
export const getMyContents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const filters: any = { authorId: userId }

    if (req.query.status) filters.status = req.query.status

    const contents = await Content.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Content.countDocuments(filters)

    res.status(200).json({
      success: true,
      count: contents.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: contents,
    })
  }
)

/**
 * @desc    Toggle content like
 * @route   POST /api/hub/content/:id/like
 * @access  Private
 */
export const toggleLike = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params

    const content = await Content.findById(id)

    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    // Note: In a production app, you'd track who liked what in a separate collection
    // For simplicity, we're just incrementing the count here
    content.likes += 1
    await content.save()

    res.status(200).json({
      success: true,
      data: {
        likes: content.likes,
      },
    })
  }
)

/**
 * @desc    Toggle bookmark
 * @route   POST /api/hub/content/:id/bookmark
 * @access  Private
 */
export const toggleBookmark = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params

    const content = await Content.findById(id)

    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    content.bookmarks += 1
    await content.save()

    res.status(200).json({
      success: true,
      data: {
        bookmarks: content.bookmarks,
      },
    })
  }
)

/**
 * @desc    Moderate content
 * @route   PUT /api/hub/content/:id/moderate
 * @access  Private (moderators only)
 */
export const moderateContent = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { status, moderationNotes } = req.body
    const userId = req.user._id

    const content = await Content.findById(id)

    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    content.status = status
    content.moderatedBy = userId as any
    content.moderatedAt = new Date()
    if (moderationNotes) content.moderationNotes = moderationNotes

    await content.save()

    res.status(200).json({
      success: true,
      data: content,
    })
  }
)

/**
 * @desc    Get featured contents
 * @route   GET /api/hub/featured
 * @access  Public
 */
export const getFeaturedContents = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10

    const contents = await Content.find({
      status: 'published',
      isFeatured: true,
    })
      .populate('authorId', 'displayName twitterUsername profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)

    res.status(200).json({
      success: true,
      count: contents.length,
      data: contents,
    })
  }
)
