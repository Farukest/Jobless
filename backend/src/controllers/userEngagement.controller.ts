import { Response } from 'express'
import { UserEngagement } from '../models/UserEngagement.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const createEngagement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const { engagementPostId, proofUrl, screenshot } = req.body

  const existing = await UserEngagement.findOne({ userId, engagementPostId })
  if (existing) {
    throw new AppError('Already engaged with this post', 400)
  }

  const engagement = await UserEngagement.create({
    userId,
    engagementPostId,
    proofUrl,
    screenshot,
  })

  res.status(201).json({
    success: true,
    data: engagement,
  })
})

export const getUserEngagements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const engagements = await UserEngagement.find({ userId })
    .populate('engagementPostId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await UserEngagement.countDocuments({ userId })

  res.status(200).json({
    success: true,
    count: engagements.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: engagements,
  })
})

export const verifyEngagement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status, pointsEarned } = req.body

  // Check permission: Info moderator OR admin with global moderation rights
  const canModerate =
    req.user.permissions?.info?.canModerate ||
    req.user.permissions?.admin?.canModerateAllContent

  if (!canModerate) {
    throw new AppError('You do not have permission to verify engagements', 403)
  }

  const engagement = await UserEngagement.findByIdAndUpdate(
    id,
    { status, pointsEarned, verifiedAt: new Date() },
    { new: true }
  )

  if (!engagement) {
    throw new AppError('Engagement not found', 404)
  }

  res.status(200).json({
    success: true,
    data: engagement,
  })
})
