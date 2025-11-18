import { Response } from 'express'
import { AdminLog } from '../models/AdminLog.model'
import { asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const createLog = async (
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  changes: any,
  req?: any
) => {
  await AdminLog.create({
    adminId,
    action,
    targetType,
    targetId,
    changes,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent'),
  })
}

export const getAdminLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const skip = (page - 1) * limit

  const filters: any = {}
  if (req.query.adminId) filters.adminId = req.query.adminId
  if (req.query.action) filters.action = req.query.action
  if (req.query.targetType) filters.targetType = req.query.targetType

  const logs = await AdminLog.find(filters)
    .populate('adminId', 'displayName twitterUsername')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)

  const total = await AdminLog.countDocuments(filters)

  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: logs,
  })
})
