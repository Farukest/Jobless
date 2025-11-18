import { Response } from 'express'
import { Notification } from '../models/Notification.model'
import { asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const createNotification = async (
  userId: string,
  type: string,
  category: string,
  title: string,
  message: string,
  options?: {
    relatedModule?: string
    relatedEntityId?: string
    relatedEntityType?: string
    actionUrl?: string
  }
) => {
  await Notification.create({
    userId,
    type,
    category,
    title,
    message,
    ...options,
  })
}

export const getUserNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const filters: any = { userId }
  if (req.query.isRead !== undefined) filters.isRead = req.query.isRead === 'true'

  const notifications = await Notification.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await Notification.countDocuments(filters)
  const unreadCount = await Notification.countDocuments({ userId, isRead: false })

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    page,
    pages: Math.ceil(total / limit),
    data: notifications,
  })
})

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user._id

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  )

  res.status(200).json({
    success: true,
    data: notification,
  })
})

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id

  await Notification.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() })

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  })
})

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user._id

  await Notification.findOneAndDelete({ _id: id, userId })

  res.status(200).json({
    success: true,
    message: 'Notification deleted',
  })
})
