import { Response } from 'express'
import { AlphaComment } from '../models/AlphaComment.model'
import { AlphaPost } from '../models/AlphaPost.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { alphaPostId } = req.params
  const userId = req.user._id
  const { comment } = req.body

  const alpha = await AlphaPost.findById(alphaPostId)
  if (!alpha) {
    throw new AppError('Alpha post not found', 404)
  }

  const newComment = await AlphaComment.create({
    alphaPostId,
    userId,
    comment,
  })

  alpha.commentsCount += 1
  await alpha.save()

  const populatedComment = await AlphaComment.findById(newComment._id).populate(
    'userId',
    'displayName twitterUsername profileImage'
  )

  res.status(201).json({
    success: true,
    data: populatedComment,
  })
})

export const getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { alphaPostId } = req.params

  const comments = await AlphaComment.find({ alphaPostId, status: 'active' })
    .populate('userId', 'displayName twitterUsername profileImage')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: comments.length,
    data: comments,
  })
})

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user._id

  const comment = await AlphaComment.findById(id)

  if (!comment) {
    throw new AppError('Comment not found', 404)
  }

  if (comment.userId.toString() !== userId.toString() && !req.user.permissions.canModerateContent) {
    throw new AppError('Not authorized', 403)
  }

  comment.status = 'deleted'
  await comment.save()

  const alpha = await AlphaPost.findById(comment.alphaPostId)
  if (alpha) {
    alpha.commentsCount = Math.max(0, alpha.commentsCount - 1)
    await alpha.save()
  }

  res.status(200).json({
    success: true,
    message: 'Comment deleted',
  })
})
