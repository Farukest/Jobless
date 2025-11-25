import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler, AppError } from '../middleware/error-handler'
import { Comment } from '../models/Comment.model'
import { Content } from '../models/Content.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { Course } from '../models/Course.model'
import { sanitizeHelper } from '../utils/sanitize-helper'
import { emitNewComment, emitNewReply, emitCommentLikeUpdate, emitCommentDeleted } from '../socket'

/**
 * @desc    Get comments for content
 * @route   GET /api/comments/:contentType/:contentId
 * @access  Private
 */
export const getComments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { contentType, contentId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit
    const userId = req.user._id

    const comments = await Comment.find({
      contentType,
      contentId,
      parentCommentId: { $exists: false }, // Top-level comments only
    })
      .populate('userId', 'displayName twitterUsername profileImage walletAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Comment.countDocuments({
      contentType,
      contentId,
      parentCommentId: { $exists: false },
    })

    // For each comment, find the current user's reply (if any)
    // This enables Twitter-style "show my reply" feature
    const commentIds = comments.map((c) => c._id)
    const userReplies = await Comment.find({
      parentCommentId: { $in: commentIds },
      userId: userId,
    })
      .populate('userId', 'displayName twitterUsername profileImage walletAddress')
      .sort({ createdAt: -1 }) // Get the latest reply if multiple

    // Create a map of parentCommentId -> user's reply
    const userReplyMap: Record<string, any> = {}
    userReplies.forEach((reply) => {
      const parentId = reply.parentCommentId?.toString()
      if (parentId && !userReplyMap[parentId]) {
        // Only keep the first (most recent) reply per parent
        userReplyMap[parentId] = reply
      }
    })

    // Attach myReply to each comment
    const commentsWithMyReply = comments.map((comment) => {
      const commentObj = comment.toObject()
      const myReply = userReplyMap[comment._id.toString()] || null
      return {
        ...commentObj,
        myReply: myReply ? myReply.toObject() : null,
      }
    })

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: commentsWithMyReply,
    })
  }
)

/**
 * @desc    Get single comment by ID
 * @route   GET /api/comments/single/:id
 * @access  Private
 */
export const getCommentById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const comment = await Comment.findById(id)
      .populate('userId', 'displayName twitterUsername profileImage walletAddress')

    if (!comment) {
      throw new AppError('Comment not found', 404)
    }

    res.status(200).json({
      success: true,
      data: comment,
    })
  }
)

/**
 * @desc    Get replies for a comment
 * @route   GET /api/comments/:commentId/replies
 * @access  Private
 */
export const getReplies = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { commentId } = req.params
    const userId = req.user._id

    const replies = await Comment.find({ parentCommentId: commentId })
      .populate('userId', 'displayName twitterUsername profileImage walletAddress')
      .sort({ createdAt: 1 }) // Oldest first (chronological, like Twitter)

    // For each reply, find the current user's reply (if any) - for nested threads
    const replyIds = replies.map((r) => r._id)
    const userNestedReplies = await Comment.find({
      parentCommentId: { $in: replyIds },
      userId: userId,
    })
      .populate('userId', 'displayName twitterUsername profileImage walletAddress')
      .sort({ createdAt: -1 }) // Most recent first

    // Create a map of parentCommentId -> user's reply
    const userReplyMap: Record<string, any> = {}
    userNestedReplies.forEach((reply) => {
      const parentId = reply.parentCommentId?.toString()
      if (parentId && !userReplyMap[parentId]) {
        userReplyMap[parentId] = reply
      }
    })

    // Attach myReply to each reply
    const repliesWithMyReply = replies.map((reply) => {
      const replyObj = reply.toObject()
      const myReply = userReplyMap[reply._id.toString()] || null
      return {
        ...replyObj,
        myReply: myReply ? myReply.toObject() : null,
      }
    })

    res.status(200).json({
      success: true,
      count: replies.length,
      data: repliesWithMyReply,
    })
  }
)

/**
 * @desc    Create comment
 * @route   POST /api/comments/:contentType/:contentId
 * @access  Private
 */
export const createComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { contentType, contentId } = req.params
    const { content, parentCommentId } = req.body
    const userId = req.user._id

    // 1. VALIDATE REQUIRED FIELDS (before sanitization)
    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400)
    }

    // Validate contentType
    const validTypes = ['hub_content', 'alpha_post', 'course', 'engagement_post']
    if (!validTypes.includes(contentType)) {
      throw new AppError('Invalid content type', 400)
    }

    // 2. SANITIZE USER INPUT
    const sanitizedContent = sanitizeHelper.sanitizeRichText(content.trim())

    // 3. ENFORCE LENGTH LIMIT (2000 chars for comments)
    const COMMENT_MAX_LENGTH = 2000
    try {
      sanitizeHelper.enforceMaxLength(
        sanitizedContent,
        COMMENT_MAX_LENGTH,
        'Comment'
      )
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }

    // 4. CREATE WITH SANITIZED DATA
    const comment = await Comment.create({
      userId,
      contentType,
      contentId,
      content: sanitizedContent,
      parentCommentId: parentCommentId || undefined,
    })

    // Update parent content's comment count OR parent comment's reply count
    if (!parentCommentId) {
      // Only increment for top-level comments
      if (contentType === 'hub_content') {
        await Content.findByIdAndUpdate(contentId, {
          $inc: { commentsCount: 1 },
        })
      } else if (contentType === 'alpha_post') {
        await AlphaPost.findByIdAndUpdate(contentId, {
          $inc: { commentsCount: 1 },
        })
      }
    } else {
      // Increment parent comment's reply count
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { repliesCount: 1 },
      })
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      'userId',
      'displayName twitterUsername profileImage walletAddress'
    )

    // Emit real-time event
    if (parentCommentId) {
      // This is a reply
      emitNewReply(parentCommentId, populatedComment)

      // Also emit to content room so parent comment's reply count updates
      const io = require('../socket').getIO()
      io.to(`content:${contentId}`).emit('newReply', {
        ...populatedComment.toObject(),
        parentCommentId: parentCommentId
      })
      console.log(`[Socket] Also emitted newReply to content room: content:${contentId}`)
    } else {
      // This is a top-level comment
      emitNewComment(contentId, contentType, populatedComment)
    }

    res.status(201).json({
      success: true,
      data: populatedComment,
    })
  }
)

/**
 * @desc    Update comment
 * @route   PUT /api/comments/:id
 * @access  Private (author only)
 */
export const updateComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { content } = req.body
    const userId = req.user._id

    const comment = await Comment.findById(id)

    if (!comment) {
      throw new AppError('Comment not found', 404)
    }

    // Check authorization
    if (comment.userId.toString() !== userId.toString()) {
      throw new AppError('Not authorized to update this comment', 403)
    }

    // 1. VALIDATE REQUIRED FIELDS
    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400)
    }

    // 2. SANITIZE USER INPUT
    const sanitizedContent = sanitizeHelper.sanitizeRichText(content.trim())

    // 3. ENFORCE LENGTH LIMIT (2000 chars for comments)
    const COMMENT_MAX_LENGTH = 2000
    try {
      sanitizeHelper.enforceMaxLength(
        sanitizedContent,
        COMMENT_MAX_LENGTH,
        'Comment'
      )
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }

    // 4. UPDATE WITH SANITIZED DATA
    comment.content = sanitizedContent
    comment.isEdited = true
    comment.editedAt = new Date()

    await comment.save()

    const populatedComment = await Comment.findById(comment._id).populate(
      'userId',
      'displayName twitterUsername profileImage walletAddress'
    )

    res.status(200).json({
      success: true,
      data: populatedComment,
    })
  }
)

/**
 * @desc    Delete comment
 * @route   DELETE /api/comments/:id
 * @access  Private (author or moderator)
 */
export const deleteComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const userId = req.user._id
    const isModerator = req.user.permissions.canModerateContent

    const comment = await Comment.findById(id)

    if (!comment) {
      throw new AppError('Comment not found', 404)
    }

    // Check authorization
    const isAuthor = comment.userId.toString() === userId.toString()
    if (!isAuthor && !isModerator) {
      throw new AppError('Not authorized to delete this comment', 403)
    }

    // Track deleted reply IDs for WebSocket emission
    let deletedReplies: string[] = []

    // Decrement parent content's comment count OR parent comment's reply count
    if (!comment.parentCommentId) {
      // This is a parent comment - decrement content's comment count
      if (comment.contentType === 'hub_content') {
        await Content.findByIdAndUpdate(comment.contentId, {
          $inc: { commentsCount: -1 },
        })
      } else if (comment.contentType === 'alpha_post') {
        await AlphaPost.findByIdAndUpdate(comment.contentId, {
          $inc: { commentsCount: -1 },
        })
      }

      // Find all replies before deleting (for WebSocket)
      const replies = await Comment.find({ parentCommentId: id })
      deletedReplies = replies.map((reply) => reply._id.toString())

      // Delete all replies
      await Comment.deleteMany({ parentCommentId: id })
    } else {
      // This is a reply - decrement parent comment's reply count
      await Comment.findByIdAndUpdate(comment.parentCommentId, {
        $inc: { repliesCount: -1 },
      })
    }

    // Delete the comment itself
    await comment.deleteOne()

    // Emit real-time deletion event
    emitCommentDeleted(
      id,
      comment.contentId.toString(),
      comment.contentType,
      comment.parentCommentId?.toString(),
      deletedReplies
    )

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    })
  }
)

/**
 * @desc    Toggle like on comment
 * @route   POST /api/comments/:id/like
 * @access  Private
 */
export const toggleCommentLike = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const userId = req.user._id

    const comment = await Comment.findById(id)

    if (!comment) {
      throw new AppError('Comment not found', 404)
    }

    // Check if user already liked
    const hasLiked = comment.likedBy.some(
      (uid) => uid.toString() === userId.toString()
    )

    if (hasLiked) {
      // Unlike
      comment.likedBy = comment.likedBy.filter(
        (uid) => uid.toString() !== userId.toString()
      )
      comment.likes = Math.max(0, comment.likes - 1)
    } else {
      // Like
      comment.likedBy.push(userId as any)
      comment.likes += 1
    }

    await comment.save()

    // Emit real-time like update
    const likeData = {
      commentId: id,
      likes: comment.likes,
      isLiked: !hasLiked,
      userId: userId.toString(),
    }

    // Emit to comment's own room and content room
    emitCommentLikeUpdate(
      id,
      comment.contentId.toString(),
      comment.contentType,
      likeData
    )

    // If this is a reply, also emit to parent comment's room
    if (comment.parentCommentId) {
      const io = require('../socket').getIO()
      io.to(`comment:${comment.parentCommentId}`).emit('commentLikeUpdate', likeData)
      console.log(`[Socket] Also emitted commentLikeUpdate to parent room: comment:${comment.parentCommentId}`)
    }

    res.status(200).json({
      success: true,
      data: {
        likes: comment.likes,
        isLiked: !hasLiked,
      },
    })
  }
)
