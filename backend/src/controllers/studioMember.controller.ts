import { Response } from 'express'
import { StudioMember } from '../models/StudioMember.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const createStudioMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const { specialty, skills, portfolio } = req.body

  const existing = await StudioMember.findOne({ userId })
  if (existing) {
    throw new AppError('Already a studio member', 400)
  }

  const member = await StudioMember.create({
    userId,
    specialty,
    skills,
    portfolio,
  })

  res.status(201).json({
    success: true,
    data: member,
  })
})

export const getStudioMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters: any = { isActive: true }
  if (req.query.specialty) filters.specialty = req.query.specialty
  if (req.query.availability) filters.availability = req.query.availability

  const members = await StudioMember.find(filters)
    .populate('userId', 'displayName twitterUsername profileImage')
    .sort({ averageRating: -1 })

  res.status(200).json({
    success: true,
    count: members.length,
    data: members,
  })
})

export const updateStudioMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const updates = req.body

  const member = await StudioMember.findOneAndUpdate({ userId }, updates, { new: true })

  if (!member) {
    throw new AppError('Studio member not found', 404)
  }

  res.status(200).json({
    success: true,
    data: member,
  })
})
