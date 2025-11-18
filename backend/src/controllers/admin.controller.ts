import { Response } from 'express'
import { User } from '../models/User.model'
import { SiteSettings } from '../models/SiteSettings.model'
import { asyncHandler, AppError } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import mongoose from 'mongoose'

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    role,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  const query: any = {}

  if (status) {
    query.status = status
  }

  if (role) {
    query.roles = role
  }

  if (search) {
    query.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { twitterUsername: { $regex: search, $options: 'i' } },
      { walletAddress: { $regex: search, $options: 'i' } }
    ]
  }

  const pageNum = parseInt(page as string, 10)
  const limitNum = parseInt(limit as string, 10)
  const skip = (pageNum - 1) * limitNum

  const sortOptions: any = {}
  sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1

  const users = await User.find(query)
    .select('-twitterAccessToken -twitterRefreshToken')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)

  const total = await User.countDocuments(query)

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  })
})

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', 400)
  }

  const user = await User.findById(id).select('-twitterAccessToken -twitterRefreshToken')

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.status(200).json({
    success: true,
    data: user
  })
})

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const {
    displayName,
    bio,
    status,
    jRankPoints,
    contributionScore,
    theme,
    emailNotifications
  } = req.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', 400)
  }

  const user = await User.findById(id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (displayName !== undefined) user.displayName = displayName
  if (bio !== undefined) user.bio = bio
  if (status !== undefined) {
    if (!['active', 'suspended', 'banned'].includes(status)) {
      throw new AppError('Invalid status value', 400)
    }
    user.status = status
  }
  if (jRankPoints !== undefined) user.jRankPoints = jRankPoints
  if (contributionScore !== undefined) user.contributionScore = contributionScore
  if (theme !== undefined) {
    if (!['light', 'dark'].includes(theme)) {
      throw new AppError('Invalid theme value', 400)
    }
    user.theme = theme
  }
  if (emailNotifications !== undefined) user.emailNotifications = emailNotifications

  await user.save()

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  })
})

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', 400)
  }

  const user = await User.findById(id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.roles.includes('super_admin')) {
    throw new AppError('Cannot delete a super admin user', 403)
  }

  user.status = 'banned'
  await user.save()

  res.status(200).json({
    success: true,
    message: 'User banned successfully',
    data: user
  })
})

export const updateUserRoles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { roles } = req.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', 400)
  }

  if (!roles || !Array.isArray(roles)) {
    throw new AppError('Roles must be an array', 400)
  }

  const validRoles = ['member', 'content_creator', 'admin', 'super_admin', 'scout', 'mentor', 'learner', 'requester']
  const invalidRoles = roles.filter(role => !validRoles.includes(role))

  if (invalidRoles.length > 0) {
    throw new AppError(`Invalid roles: ${invalidRoles.join(', ')}`, 400)
  }

  const user = await User.findById(id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  user.roles = roles
  await user.save()

  res.status(200).json({
    success: true,
    message: 'User roles updated successfully',
    data: user
  })
})

export const updateUserPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { permissions } = req.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', 400)
  }

  if (!permissions || typeof permissions !== 'object') {
    throw new AppError('Permissions must be an object', 400)
  }

  const user = await User.findById(id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  const validPermissionKeys = [
    'canAccessJHub',
    'canAccessJStudio',
    'canAccessJAcademy',
    'canAccessJInfo',
    'canAccessJAlpha',
    'canCreateContent',
    'canModerateContent',
    'canManageUsers',
    'canManageRoles',
    'canManageSiteSettings',
    'customPermissions'
  ]

  Object.keys(permissions).forEach(key => {
    if (validPermissionKeys.includes(key)) {
      if (key === 'customPermissions' && Array.isArray(permissions[key])) {
        user.permissions[key] = permissions[key]
      } else if (typeof permissions[key] === 'boolean') {
        user.permissions[key] = permissions[key]
      }
    }
  })

  await user.save()

  res.status(200).json({
    success: true,
    message: 'User permissions updated successfully',
    data: user
  })
})

export const getSiteSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await SiteSettings.findOne()

  if (!settings) {
    settings = await SiteSettings.create({})
  }

  res.status(200).json({
    success: true,
    data: settings
  })
})

export const updateSiteSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    header,
    footer,
    theme,
    modules,
    siteName,
    siteDescription,
    maintenanceMode
  } = req.body

  let settings = await SiteSettings.findOne()

  if (!settings) {
    settings = await SiteSettings.create({
      updatedBy: req.user._id
    })
  }

  if (header !== undefined) settings.header = header
  if (footer !== undefined) settings.footer = footer
  if (theme !== undefined) settings.theme = theme
  if (modules !== undefined) settings.modules = modules
  if (siteName !== undefined) settings.siteName = siteName
  if (siteDescription !== undefined) settings.siteDescription = siteDescription
  if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode

  settings.updatedBy = req.user._id
  await settings.save()

  res.status(200).json({
    success: true,
    message: 'Site settings updated successfully',
    data: settings
  })
})

export const getAdminLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 50,
    action,
    userId,
    startDate,
    endDate,
    sortOrder = 'desc'
  } = req.query

  const query: any = {}

  if (action) {
    query.action = action
  }

  if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
    query.userId = userId
  }

  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) {
      query.createdAt.$gte = new Date(startDate as string)
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate as string)
    }
  }

  const pageNum = parseInt(page as string, 10)
  const limitNum = parseInt(limit as string, 10)
  const skip = (pageNum - 1) * limitNum

  const sortOptions: any = { createdAt: sortOrder === 'asc' ? 1 : -1 }

  const logs: any[] = []
  const total = 0

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  })
})

export const getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period = '30d' } = req.query

  let startDate = new Date()

  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(startDate.getDate() - 30)
  }

  const totalUsers = await User.countDocuments()
  const activeUsers = await User.countDocuments({ status: 'active' })
  const suspendedUsers = await User.countDocuments({ status: 'suspended' })
  const bannedUsers = await User.countDocuments({ status: 'banned' })

  const newUsers = await User.countDocuments({
    joinedAt: { $gte: startDate }
  })

  const usersByRole = await User.aggregate([
    {
      $unwind: '$roles'
    },
    {
      $group: {
        _id: '$roles',
        count: { $sum: 1 }
      }
    }
  ])

  const recentLogins = await User.countDocuments({
    lastLogin: { $gte: startDate }
  })

  const analytics = {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      banned: bannedUsers,
      new: newUsers,
      recentLogins,
      byRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {} as Record<string, number>)
    },
    engagement: {
      totalContentCreated: await User.aggregate([
        { $group: { _id: null, total: { $sum: '$contentCreated' } } }
      ]).then(result => result[0]?.total || 0),
      totalInteractions: await User.aggregate([
        { $group: { _id: null, total: { $sum: '$interactionsGiven' } } }
      ]).then(result => result[0]?.total || 0),
      averageJRankPoints: await User.aggregate([
        { $group: { _id: null, avg: { $avg: '$jRankPoints' } } }
      ]).then(result => Math.round(result[0]?.avg || 0)),
      averageContributionScore: await User.aggregate([
        { $group: { _id: null, avg: { $avg: '$contributionScore' } } }
      ]).then(result => Math.round(result[0]?.avg || 0))
    },
    period: period as string,
    startDate,
    endDate: new Date()
  }

  res.status(200).json({
    success: true,
    data: analytics
  })
})
