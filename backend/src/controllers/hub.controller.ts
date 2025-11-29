import { Request, Response, NextFunction } from 'express'
import { Content } from '../models/Content.model'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { configHelper } from '../utils/config-helper'
import { sanitizeHelper } from '../utils/sanitize-helper'
import { engagementService } from '../services/engagement.service'
import { emitLikeUpdate, emitBookmarkUpdate, emitViewUpdate, emitContentCreated } from '../socket'
import { canUserCreateContentType, canUserModerateContent } from '../utils/content-permissions'
import { BadgeService } from '../services/badge.service'
import mongoose from 'mongoose'

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
    const filters: any = {}

    // Status filter
    // If status query param exists, use it (including if it's empty string for "all")
    // If no status param provided, default to published (for regular users browsing)
    if (req.query.hasOwnProperty('status')) {
      // If status is provided and not empty, filter by it
      if (req.query.status && req.query.status !== 'all') {
        filters.status = req.query.status
      }
      // If status is empty or 'all', don't filter by status (show all)
    } else {
      // No status parameter means regular user browsing - show only published
      filters.status = 'published'
    }

    if (req.query.category) filters.category = req.query.category
    if (req.query.contentType) filters.contentType = req.query.contentType
    if (req.query.difficulty) filters.difficulty = req.query.difficulty
    if (req.query.authorId) filters.authorId = req.query.authorId
    if (req.query.tags) {
      filters.tags = { $in: (req.query.tags as string).split(',') }
    }

    // Search by title
    if (req.query.search) {
      filters.title = { $regex: req.query.search, $options: 'i' }
    }

    // Sorting - Admin pinned items always first, then user pinned, then by requested sort
    const sortBy = (req.query.sortBy as string) || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const contents = await Content.find(filters)
      .populate('authorId', 'displayName twitterUsername profileImage walletAddress')
      .sort({
        isAdminPinned: -1,  // Admin pinned first
        isPinned: -1,        // Then user pinned
        [sortBy]: sortOrder  // Then by requested sort
      })
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

    try {
      const content = await Content.findById(id).populate(
        'authorId',
        'displayName twitterUsername profileImage walletAddress'
      )

      if (!content) {
        return next(new AppError('Content not found', 404))
      }

      // Authorization check for non-published content
      const authReq = req as AuthRequest
      const userId = authReq.user?._id || null
      const userRoles = authReq.user?.roles || []

      // Only published content is publicly visible
      // draft/rejected/archived can only be viewed by author or admin/super_admin
      if (content.status !== 'published') {
        const isAuthor = userId && content.authorId && content.authorId.toString() === userId.toString()
        const isAdmin = userRoles.some((role: any) =>
          (typeof role === 'string' ? role : role.name) === 'admin' ||
          (typeof role === 'string' ? role : role.name) === 'super_admin'
        )

        if (!isAuthor && !isAdmin) {
          return next(new AppError('Content not found', 404))
        }
      }

      // Track view with engagement service (non-blocking, catch errors silently)

      try {
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown'
        const userAgent = req.headers['user-agent']

        const viewResult = await engagementService.trackView(
          userId,
          content._id as mongoose.Types.ObjectId,
          'hub_content',
          ipAddress,
          userAgent
        )

        // Emit WebSocket event if view was counted
        if (viewResult.counted) {
          emitViewUpdate(id, 'content', {
            contentId: id,
            viewsCount: content.viewsCount + 1,
          })
        }
      } catch (viewError) {
        // Log but don't fail the request
        console.error('View tracking error:', viewError)
      }

      // Get engagement status for authenticated users
      let isLiked = false
      let isBookmarked = false

      if (authReq.user) {
        try {
          const [likeStatus, bookmarkStatus] = await Promise.all([
            engagementService.getLikeStatus(authReq.user._id, content._id as mongoose.Types.ObjectId, 'hub_content'),
            engagementService.getBookmarkStatus(authReq.user._id, content._id as mongoose.Types.ObjectId, 'hub_content'),
          ])
          isLiked = likeStatus
          isBookmarked = bookmarkStatus
        } catch (engagementError) {
          // Log but don't fail the request
          console.error('Engagement status error:', engagementError)
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ...content.toObject(),
          isLiked,
          isBookmarked,
        },
      })
    } catch (error: any) {
      console.error('GetContent error:', error)
      return next(new AppError(error.message || 'Failed to fetch content', 500))
    }
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

    // 1. VALIDATE REQUIRED FIELDS (before sanitization)
    if (!title || !title.trim()) {
      return next(new AppError('Title is required', 400))
    }

    if (!body || !body.trim()) {
      return next(new AppError('Content body is required', 400))
    }

    // 2. SANITIZE USER INPUT
    const sanitizedTitle = sanitizeHelper.sanitizeHTML(title.trim())
    const sanitizedDescription = description
      ? sanitizeHelper.sanitizeRichText(description.trim())
      : ''
    const sanitizedBody = sanitizeHelper.sanitizeRichText(body.trim())

    // 3. ENFORCE LENGTH LIMITS
    const hubLimits = await configHelper.get('hub_limits')

    try {
      sanitizeHelper.enforceMaxLength(
        sanitizedTitle,
        hubLimits.content_title_max_length,
        'Title'
      )
      sanitizeHelper.enforceMaxLength(
        sanitizedBody,
        hubLimits.content_body_max_length,
        'Body'
      )
    } catch (error: any) {
      return next(new AppError(error.message, 400))
    }

    // 4. VALIDATE ARRAYS
    const validatedMediaUrls = mediaUrls
      ? sanitizeHelper.validateURLArray(mediaUrls, 10)
      : []
    const validatedTags = tags ? sanitizeHelper.validateTagArray(tags) : []

    // 5. VALIDATE AGAINST DYNAMIC CONFIG
    const validCategories = await configHelper.get('content_categories')
    if (category && !validCategories.includes(category)) {
      return next(new AppError('Invalid content category', 400))
    }

    const validTypes = await configHelper.get('content_types')
    if (!validTypes.includes(contentType)) {
      return next(new AppError('Invalid content type', 400))
    }

    // Check if user has permission to create this content type
    const canCreate = canUserCreateContentType(req.user, contentType)
    if (!canCreate) {
      return next(
        new AppError(
          `You don't have permission to create ${contentType} content. Contact admin to update your allowed content types.`,
          403
        )
      )
    }

    if (difficulty) {
      const validDifficulties = await configHelper.get('difficulty_levels')
      if (!validDifficulties.includes(difficulty)) {
        return next(new AppError('Invalid difficulty level', 400))
      }
    }

    // 6. DETERMINE STATUS BASED ON USER ROLE
    // Super admin → can publish immediately
    // Admin & Content Creator → goes to review (needs super admin approval)
    // Default → draft
    let finalStatus = 'draft'

    if (status) {
      // User explicitly set status
      if (status === 'published') {
        // Only super_admin can publish directly
        const userRoles = req.user.roles || []
        const isSuperAdmin = userRoles.some((role: any) =>
          (typeof role === 'string' ? role : role.name) === 'super_admin'
        )

        if (isSuperAdmin) {
          finalStatus = 'published'
        } else {
          // Admin and content_creator go to review
          finalStatus = 'in_review'
        }
      } else if (status === 'draft') {
        finalStatus = 'draft'
      } else {
        // Invalid status for creation
        return next(new AppError('Invalid status. Use "draft" or "published"', 400))
      }
    }

    // 7. CREATE WITH SANITIZED DATA
    const content = await Content.create({
      authorId: userId,
      title: sanitizedTitle,
      description: sanitizedDescription,
      contentType,
      body: sanitizedBody,
      mediaUrls: validatedMediaUrls,
      tags: validatedTags,
      category,
      difficulty,
      status: finalStatus,
    })

    // Populate author for socket emission
    await content.populate('authorId', 'displayName twitterUsername profileImage walletAddress')

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { contentCreated: 1 },
    })

    // Check for badge awards (non-blocking)
    BadgeService.checkActivityBadges(userId, 'hub').catch(err => {
      console.error('Badge check error:', err)
    })

    // Emit WebSocket event if content is published
    if (content.status === 'published') {
      emitContentCreated(content)
    }

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
    const canModerate = canUserModerateContent(req.user)

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

    // Get hub limits for validation
    const hubLimits = await configHelper.get('hub_limits')

    // Update allowed fields with sanitization
    if (title !== undefined) {
      const sanitizedTitle = sanitizeHelper.sanitizeHTML(title.trim())
      try {
        sanitizeHelper.enforceMaxLength(
          sanitizedTitle,
          hubLimits.content_title_max_length,
          'Title'
        )
        content.title = sanitizedTitle
      } catch (error: any) {
        return next(new AppError(error.message, 400))
      }
    }

    if (description !== undefined) {
      content.description = sanitizeHelper.sanitizeRichText(description.trim())
    }

    if (body !== undefined) {
      const sanitizedBody = sanitizeHelper.sanitizeRichText(body.trim())
      try {
        sanitizeHelper.enforceMaxLength(
          sanitizedBody,
          hubLimits.content_body_max_length,
          'Body'
        )
        content.body = sanitizedBody
      } catch (error: any) {
        return next(new AppError(error.message, 400))
      }
    }

    if (mediaUrls !== undefined) {
      content.mediaUrls = sanitizeHelper.validateURLArray(mediaUrls, 10) as any
    }

    if (tags !== undefined) {
      content.tags = sanitizeHelper.validateTagArray(tags)
    }

    if (contentType !== undefined) content.contentType = contentType
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
    const canModerate = canUserModerateContent(req.user)

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
    const userId = req.user._id

    // Verify content exists
    const content = await Content.findById(id)
    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    // Toggle like using engagement service
    const result = await engagementService.toggleLike(
      userId,
      new mongoose.Types.ObjectId(id),
      'hub_content'
    )

    // Emit WebSocket event for real-time update
    emitLikeUpdate(id, 'content', {
      contentId: id,
      likesCount: result.likesCount,
      isLiked: result.isLiked,
    })

    res.status(200).json({
      success: true,
      data: result,
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
    const userId = req.user._id

    // Verify content exists
    const content = await Content.findById(id)
    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    // Toggle bookmark using engagement service
    const result = await engagementService.toggleBookmark(
      userId,
      new mongoose.Types.ObjectId(id),
      'hub_content'
    )

    // Emit WebSocket event for real-time update
    emitBookmarkUpdate(id, 'content', {
      contentId: id,
      bookmarksCount: result.bookmarksCount,
      isBookmarked: result.isBookmarked,
    })

    res.status(200).json({
      success: true,
      data: result,
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
    // Check permission: Hub moderator OR admin with global moderation rights
    const canModerate =
      req.user.permissions?.hub?.canModerate ||
      req.user.permissions?.admin?.canModerateAllContent

    if (!canModerate) {
      return next(new AppError('You do not have permission to moderate content', 403))
    }

    const { id } = req.params
    const { status, moderationNotes, isFeatured, isPinned } = req.body
    const userId = req.user._id

    const content = await Content.findById(id)

    if (!content) {
      return next(new AppError('Content not found', 404))
    }

    // Validate archive logic - only published content can be archived
    if (status === 'archived') {
      if (content.status !== 'published') {
        return next(new AppError('Only published content can be archived. Draft or rejected content should be deleted instead.', 400))
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['draft', 'in_review', 'published', 'archived', 'rejected']
      if (!validStatuses.includes(status)) {
        return next(new AppError('Invalid status value', 400))
      }

      // When approving (in_review → published), set publishedAt
      if (status === 'published' && content.status === 'in_review') {
        content.publishedAt = new Date()
      }

      content.status = status
      content.moderatedBy = userId as any
      content.moderatedAt = new Date()
    }

    // Update moderation notes if provided
    if (moderationNotes !== undefined) {
      content.moderationNotes = moderationNotes
    }

    // Update featured status if provided
    if (isFeatured !== undefined) {
      content.isFeatured = isFeatured
    }

    // Update pinned status if provided
    if (isPinned !== undefined) {
      content.isPinned = isPinned
    }

    // Update admin pinned status if provided
    if (req.body.isAdminPinned !== undefined) {
      content.isAdminPinned = req.body.isAdminPinned
    }

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

/**
 * @desc    Get user's allowed content types
 * @route   GET /api/hub/allowed-content-types
 * @access  Private
 */
export const getAllowedContentTypes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { getAllowedContentTypes: getContentTypes } = await import('../utils/content-permissions')
    const allowedTypes = getContentTypes(req.user)

    res.status(200).json({
      success: true,
      data: allowedTypes,
    })
  }
)

/**
 * @desc    Upload document (PDF, DOC, DOCX) for content
 * @route   POST /api/hub/upload/document
 * @access  Private (requires hub.canCreate permission)
 */
export const uploadDocumentFile = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check permission: User must have hub.canCreate permission
    if (!req.user.permissions?.hub?.canCreate) {
      return next(new AppError('You do not have permission to upload documents', 403))
    }

    // Check if file was uploaded
    if (!req.file) {
      return next(new AppError('No file uploaded', 400))
    }

    // Return file URL
    const fileUrl = `/uploads/documents/${req.file.filename}`

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
    })
  }
)
