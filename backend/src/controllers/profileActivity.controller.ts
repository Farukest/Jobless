import { Response } from 'express'
import { ProfileActivity } from '../models/ProfileActivity.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const createActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const { activityType, moduleSource, description, relatedEntityId, relatedEntityType, points } = req.body

  const activity = await ProfileActivity.create({
    userId,
    activityType,
    moduleSource,
    description,
    relatedEntityId,
    relatedEntityType,
    points: points || 0,
  })

  res.status(201).json({
    success: true,
    data: activity,
  })
})

export const getUserActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId || req.user._id
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const filters: any = { userId }
  if (req.query.moduleSource) filters.moduleSource = req.query.moduleSource

  const activities = await ProfileActivity.find(filters)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)

  const total = await ProfileActivity.countDocuments(filters)

  res.status(200).json({
    success: true,
    count: activities.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: activities,
  })
})

export const deleteActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const activity = await ProfileActivity.findByIdAndDelete(id)

  if (!activity) {
    throw new AppError('Activity not found', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Activity deleted',
  })
})
