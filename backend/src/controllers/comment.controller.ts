import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler, AppError } from '../middleware/error-handler'
import { Comment } from '../models/Comment.model'
import { Content } from '../models/Content.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { sanitizeHelper } from '../utils/sanitize-helper'
import { emitNewComment, emitNewReply, emitCommentLikeUpdate, emitCommentDeleted } from '../socket'

/**
 * Get comments for content (top-level only, parentCommentId = null)
 * Returns flat list sorted by createdAt DESC
 */
export const getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contentType, contentId } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const skip = (page - 1) * limit

  // Validate contentType
  const validTypes = ['hub_content', 'alpha_post', 'course', 'engagement_post']
  if (!validTypes.includes(contentType)) {
    throw new AppError('Invalid content type', 400)
  }

  // Get top-level comments only
  const comments = await Comment.find({
    contentType,
    contentId,
    parentCommentId: { $exists: false }
  })
    .populate('userId', 'displayName twitterUsername profileImage walletAddress')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Comment.countDocuments({
    contentType,
    contentId,
    parentCommentId: { $exists: false }
  })

  res.status(200).json({
    success: true,
    count: comments.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: comments
  })
})

/**
 * Get single comment by ID
 */
export const getCommentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const comment = await Comment.findById(id)
    .populate('userId', 'displayName twitterUsername profileImage walletAddress')
    .lean()

  if (!comment) {
    throw new AppError('Comment not found', 404)
  }

  res.status(200).json({
    success: true,
    data: comment
  })
})

/**
 * Get replies for a comment
 * Returns all direct replies sorted by createdAt ASC (oldest first)
 */
export const getReplies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { commentId } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const skip = (page - 1) * limit

  const replies = await Comment.find({ parentCommentId: commentId })
    .populate('userId', 'displayName twitterUsername profileImage walletAddress')
    .sort({ createdAt: 1 }) // Oldest first for replies
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Comment.countDocuments({ parentCommentId: commentId })

  res.status(200).json({
    success: true,
    count: replies.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: replies
  })
})

/**
 * Create comment or reply
 */
export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contentType, contentId } = req.params
  const userId = req.user._id
  const { content, parentCommentId } = req.body

  // Validate contentType
  const validTypes = ['hub_content', 'alpha_post', 'course', 'engagement_post']
  if (!validTypes.includes(contentType)) {
    throw new AppError('Invalid content type', 400)
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400)
  }

  if (content.length > 1000) {
    throw new AppError('Comment cannot exceed 1000 characters', 400)
  }

  // Sanitize content
  const sanitizedContent = sanitizeHelper.sanitizeHTML(content.trim())

  // If this is a reply, verify parent comment exists
  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId)
    if (!parentComment) {
      throw new AppError('Parent comment not found', 404)
    }
    // Verify parent is for same content
    if (parentComment.contentId.toString() !== contentId) {
      throw new AppError('Parent comment does not belong to this content', 400)
    }
  }

  // Create comment
  const comment = await Comment.create({
    userId,
    contentType,
    contentId,
    content: sanitizedContent,
    parentCommentId: parentCommentId || undefined
  })

  // Populate user data
  const populatedComment = await Comment.findById(comment._id)
    .populate('userId', 'displayName twitterUsername profileImage walletAddress')
    .lean()

  // Update parent comment's repliesCount if this is a reply
  if (parentCommentId) {
    await Comment.findByIdAndUpdate(parentCommentId, {
      $inc: { repliesCount: 1 }
    })

    // Emit reply event
    emitNewReply(parentCommentId, populatedComment)
  } else {
    // Update content's commentsCount for top-level comments
    if (contentType === 'hub_content') {
      await Content.findByIdAndUpdate(contentId, {
        $inc: { commentsCount: 1 }
      })
    } else if (contentType === 'alpha_post') {
      await AlphaPost.findByIdAndUpdate(contentId, {
        $inc: { commentsCount: 1 }
      })
    }

    // Emit new comment event
    emitNewComment(contentId, contentType, populatedComment)
  }

  res.status(201).json({
    success: true,
    data: populatedComment
  })
})

/**
 * Update comment
 */
export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user._id
  const { content } = req.body

  const comment = await Comment.findById(id)

  if (!comment) {
    throw new AppError('Comment not found', 404)
  }

  // Check ownership
  if (comment.userId.toString() !== userId.toString()) {
    throw new AppError('Not authorized to edit this comment', 403)
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400)
  }

  if (content.length > 1000) {
    throw new AppError('Comment cannot exceed 1000 characters', 400)
  }

  // Sanitize and update
  comment.content = sanitizeHelper.sanitizeHTML(content.trim())
  comment.isEdited = true
  comment.editedAt = new Date()
  await comment.save()

  const updatedComment = await Comment.findById(id)
    .populate('userId', 'displayName twitterUsername profileImage walletAddress')
    .lean()

  res.status(200).json({
    success: true,
    data: updatedComment
  })
})

/**
 * Delete comment
 * Also deletes all replies if it's a top-level comment
 */
export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user._id

  const comment = await Comment.findById(id)

  if (!comment) {
    throw new AppError('Comment not found', 404)
  }

  // Check ownership or moderation rights
  const isModerator =
    req.user.permissions?.hub?.canModerate ||
    req.user.permissions?.admin?.canModerateAllContent

  if (comment.userId.toString() !== userId.toString() && !isModerator) {
    throw new AppError('Not authorized to delete this comment', 403)
  }

  const parentCommentId = comment.parentCommentId?.toString()
  const contentId = comment.contentId.toString()
  const contentType = comment.contentType

  // Get all replies that will be deleted (for WebSocket notification)
  const deletedReplies = await Comment.find({ parentCommentId: id }).select('_id').lean()
  const deletedReplyIds = deletedReplies.map(r => r._id.toString())

  // Delete all replies if this is a top-level comment
  if (!parentCommentId) {
    await Comment.deleteMany({ parentCommentId: id })

    // Update content's commentsCount
    if (contentType === 'hub_content') {
      await Content.findByIdAndUpdate(contentId, {
        $inc: { commentsCount: -1 }
      })
    } else if (contentType === 'alpha_post') {
      await AlphaPost.findByIdAndUpdate(contentId, {
        $inc: { commentsCount: -1 }
      })
    }
  } else {
    // Update parent comment's repliesCount
    await Comment.findByIdAndUpdate(parentCommentId, {
      $inc: { repliesCount: -1 }
    })
  }

  // Delete the comment
  await Comment.findByIdAndDelete(id)

  // Emit deletion event
  emitCommentDeleted(id, contentId, contentType, parentCommentId, deletedReplyIds)

  res.status(200).json({
    success: true,
    message: 'Comment deleted'
  })
})

/**
 * Toggle like on comment
 */
export const toggleCommentLike = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user._id

  const comment = await Comment.findById(id)

  if (!comment) {
    throw new AppError('Comment not found', 404)
  }

  const userIdStr = userId.toString()
  const isLiked = comment.likedBy.some(uid => uid.toString() === userIdStr)

  if (isLiked) {
    // Unlike
    comment.likedBy = comment.likedBy.filter(uid => uid.toString() !== userIdStr)
    comment.likes = Math.max(0, comment.likes - 1)
  } else {
    // Like
    comment.likedBy.push(userId)
    comment.likes += 1
  }

  await comment.save()

  // Emit like update
  emitCommentLikeUpdate(
    id,
    comment.contentId.toString(),
    comment.contentType,
    {
      commentId: id,
      likes: comment.likes,
      isLiked: !isLiked,
      userId: userIdStr
    }
  )

  res.status(200).json({
    success: true,
    data: {
      likes: comment.likes,
      isLiked: !isLiked
    }
  })
})
