import { Response } from 'express'
import { ContentComment } from '../models/ContentComment.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { emitCommentDeleted } from '../socket'

export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contentId } = req.params
  const userId = req.user._id
  const { comment, parentCommentId } = req.body

  const newComment = await ContentComment.create({
    contentId,
    userId,
    comment,
    parentCommentId,
  })

  // If this is a reply, increment parent's repliesCount
  if (parentCommentId) {
    await ContentComment.findByIdAndUpdate(parentCommentId, {
      $inc: { repliesCount: 1 }
    })
  }

  const populatedComment = await ContentComment.findById(newComment._id).populate(
    'userId',
    'displayName twitterUsername profileImage'
  )

  res.status(201).json({
    success: true,
    data: populatedComment,
  })
})

export const getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contentId } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const comments = await ContentComment.find({ contentId, status: 'active', parentCommentId: null })
    .populate('userId', 'displayName twitterUsername profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await ContentComment.countDocuments({ contentId, status: 'active', parentCommentId: null })

  res.status(200).json({
    success: true,
    count: comments.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: comments,
  })
})

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user._id

  const comment = await ContentComment.findById(id)

  if (!comment) {
    throw new AppError('Comment not found', 404)
  }

  // Check if user is comment author or has moderation rights
  const isModerator = req.user.permissions.hub?.canModerate || req.user.permissions.admin?.canModerateAllContent
  if (comment.userId.toString() !== userId.toString() && !isModerator) {
    throw new AppError('Not authorized', 403)
  }

  comment.status = 'deleted'
  await comment.save()

  // If this was a reply, decrement parent's repliesCount
  if (comment.parentCommentId) {
    await ContentComment.findByIdAndUpdate(comment.parentCommentId, {
      $inc: { repliesCount: -1 }
    })
  }

  // Emit WebSocket event for real-time update
  emitCommentDeleted(
    id,
    comment.contentId.toString(),
    'hub_content',
    comment.parentCommentId?.toString(),
    []
  )

  res.status(200).json({
    success: true,
    message: 'Comment deleted',
  })
})
