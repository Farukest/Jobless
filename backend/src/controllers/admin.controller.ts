import { Response } from 'express'
import { User } from '../models/User.model'
import { Role } from '../models/Role.model'
import { SiteSettings } from '../models/SiteSettings.model'
import { SystemConfig } from '../models/SystemConfig.model'
import { Content } from '../models/Content.model'
import { asyncHandler, AppError } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { BadgeService } from '../services/badge.service'
import { configHelper } from '../utils/config-helper'
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
    .populate('roles', 'name displayName') // Populate role details
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

  const user = await User.findById(id)
    .populate('roles', 'name displayName') // Populate role details
    .select('-twitterAccessToken -twitterRefreshToken')

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

  const user = await User.findById(id).populate('roles', 'name')

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Check if user has super_admin role
  const hasSuperAdmin = user.roles.some((role: any) => role.name === 'super_admin')
  if (hasSuperAdmin) {
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

// Helper function to get permissions based on role ObjectIds (dynamically from database)
const getPermissionsForRoleIds = async (roleIds: mongoose.Types.ObjectId[]) => {
  // Fetch all roles from database
  const roles = await Role.find({ _id: { $in: roleIds }, status: 'active' })

  // Base permissions structure (nested by module)
  const mergedPermissions: any = {
    hub: {
      canAccess: false,
      canCreate: false,
      canModerate: false,
      allowedContentTypes: []
    },
    studio: {
      canAccess: false,
      canCreateRequest: false,
      canClaimRequest: false,
      allowedRequestTypes: []
    },
    academy: {
      canAccess: false,
      canEnroll: false,
      canTeach: false,
      canCreateCourseRequest: false,
      allowedCourseCategories: []
    },
    info: {
      canAccess: false,
      canSubmitEngagement: false,
      allowedPlatforms: [],
      allowedEngagementTypes: []
    },
    alpha: {
      canAccess: false,
      canSubmitAlpha: false,
      canModerate: false,
      allowedAlphaCategories: []
    },
    admin: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSiteSettings: false,
      canModerateAllContent: false
    }
  }

  // Merge permissions from all roles (OR logic for booleans, union for arrays)
  roles.forEach((role) => {
    const rolePerms = role.permissions as any

    // Merge each module's permissions
    Object.keys(mergedPermissions).forEach((module) => {
      if (rolePerms[module]) {
        Object.keys(mergedPermissions[module]).forEach((key) => {
          const roleValue = rolePerms[module][key]

          if (typeof roleValue === 'boolean') {
            // Boolean: OR logic (if any role has true, user gets true)
            if (roleValue) {
              mergedPermissions[module][key] = true
            }
          } else if (Array.isArray(roleValue)) {
            // Array: Union (combine all unique values)
            mergedPermissions[module][key] = [
              ...new Set([...mergedPermissions[module][key], ...roleValue])
            ]
          }
        })
      }
    })
  })

  return mergedPermissions
}

export const updateUserRoles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { roles } = req.body // roles is array of role names (strings) from frontend

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', 400)
  }

  if (!roles || !Array.isArray(roles)) {
    throw new AppError('Roles must be an array', 400)
  }

  // Convert role names to ObjectIds
  const roleDocuments = await Role.find({ name: { $in: roles }, status: 'active' })

  if (roleDocuments.length !== roles.length) {
    const foundRoleNames = roleDocuments.map(r => r.name)
    const notFoundRoles = roles.filter(r => !foundRoleNames.includes(r))
    throw new AppError(`Invalid or inactive roles: ${notFoundRoles.join(', ')}`, 400)
  }

  const roleIds = roleDocuments.map(r => r._id)

  const user = await User.findById(id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  user.roles = roleIds as mongoose.Types.ObjectId[]

  // Automatically update permissions based on new roles (dynamically from database)
  const newPermissions = await getPermissionsForRoleIds(roleIds as mongoose.Types.ObjectId[])
  user.permissions = { ...user.permissions, ...newPermissions }

  await user.save()

  // Check for role-based badges (non-blocking)
  BadgeService.checkRoleBadges(user._id as any).catch(err => {
    console.error('Badge check error:', err)
  })

  // Populate roles for response
  await user.populate('roles', 'name displayName')

  res.status(200).json({
    success: true,
    message: 'User roles and permissions updated successfully',
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

// ============================================
// DYNAMIC J HUB CONFIGURATION MANAGEMENT
// ============================================

/**
 * GET /api/admin/hub/config
 * Get all J Hub dynamic configurations (super_admin only)
 * Returns: categories, content types, difficulty levels
 */
export const getHubConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [categoriesConfig, typesConfig, difficultyConfig] = await Promise.all([
    SystemConfig.findOne({ configKey: 'content_categories' }),
    SystemConfig.findOne({ configKey: 'content_types' }),
    SystemConfig.findOne({ configKey: 'difficulty_levels' })
  ])

  res.status(200).json({
    success: true,
    data: {
      categories: categoriesConfig?.value || [],
      contentTypes: typesConfig?.value || [],
      difficultyLevels: difficultyConfig?.value || []
    }
  })
})

/**
 * GET /api/admin/hub/categories
 * Get all content categories (super_admin only)
 */
export const getContentCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const config = await SystemConfig.findOne({ configKey: 'content_categories' })

  if (!config) {
    throw new AppError('Content categories configuration not found', 404)
  }

  res.status(200).json({
    success: true,
    data: config.value || []
  })
})

/**
 * POST /api/admin/hub/categories
 * Add a new content category (super_admin only)
 */
export const addContentCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category } = req.body

  if (!category || typeof category !== 'string') {
    throw new AppError('Category name is required', 400)
  }

  // Validate category name (lowercase, alphanumeric + underscore)
  const categorySlug = category.toLowerCase().trim().replace(/\s+/g, '_')

  if (!/^[a-z0-9_]+$/.test(categorySlug)) {
    throw new AppError('Category name can only contain lowercase letters, numbers, and underscores', 400)
  }

  if (categorySlug.length < 2 || categorySlug.length > 50) {
    throw new AppError('Category name must be between 2 and 50 characters', 400)
  }

  const config = await SystemConfig.findOne({ configKey: 'content_categories' })

  if (!config) {
    throw new AppError('Content categories configuration not found', 404)
  }

  const categories = config.value as string[]

  // Check if category already exists
  if (categories.includes(categorySlug)) {
    throw new AppError('Category already exists', 400)
  }

  // Add new category - create new array to trigger Mongoose change detection
  config.value = [...categories, categorySlug]
  config.updatedBy = req.user._id
  config.markModified('value') // Explicitly mark as modified
  await config.save()

  res.status(201).json({
    success: true,
    message: 'Category added successfully',
    data: categories
  })
})

/**
 * DELETE /api/admin/hub/categories/:slug
 * Delete a content category with cascade handling (super_admin only)
 *
 * Query params:
 * - force=true: Force delete and move content to 'other' category
 */
export const deleteContentCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params
  const { force } = req.query

  // Prevent deletion of 'other' category (default fallback)
  if (slug === 'other') {
    throw new AppError('Cannot delete the "other" category (it is the default fallback)', 403)
  }

  const config = await SystemConfig.findOne({ configKey: 'content_categories' })

  if (!config) {
    throw new AppError('Content categories configuration not found', 404)
  }

  const categories = config.value as string[]

  // Check if category exists
  if (!categories.includes(slug)) {
    throw new AppError('Category not found', 404)
  }

  // Check if content uses this category
  const contentCount = await Content.countDocuments({ category: slug })

  if (contentCount > 0) {
    if (force !== 'true') {
      // Return error with count, suggesting force delete
      throw new AppError(
        `Cannot delete category. ${contentCount} content(s) use this category. Add ?force=true to move them to "other" category.`,
        400
      )
    }

    // Force delete: Move all content to 'other' category
    await Content.updateMany(
      { category: slug },
      { $set: { category: 'other' } }
    )

    console.log(`[ADMIN] Moved ${contentCount} content(s) from "${slug}" to "other" category`)
  }

  // Remove category from config
  config.value = categories.filter(cat => cat !== slug)
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  res.status(200).json({
    success: true,
    message: contentCount > 0
      ? `Category deleted. ${contentCount} content(s) moved to "other" category.`
      : 'Category deleted successfully',
    data: config.value,
    movedContent: contentCount
  })
})

/**
 * PUT /api/admin/hub/categories/:oldSlug
 * Rename a content category (super_admin only)
 */
export const renameContentCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { oldSlug } = req.params
  const { newName } = req.body

  if (!newName || typeof newName !== 'string') {
    throw new AppError('New category name is required', 400)
  }

  // Validate new category name
  const newSlug = newName.toLowerCase().trim().replace(/\s+/g, '_')

  if (!/^[a-z0-9_]+$/.test(newSlug)) {
    throw new AppError('Category name can only contain lowercase letters, numbers, and underscores', 400)
  }

  if (newSlug.length < 2 || newSlug.length > 50) {
    throw new AppError('Category name must be between 2 and 50 characters', 400)
  }

  // Prevent renaming 'other' category
  if (oldSlug === 'other') {
    throw new AppError('Cannot rename the "other" category (it is the default fallback)', 403)
  }

  const config = await SystemConfig.findOne({ configKey: 'content_categories' })

  if (!config) {
    throw new AppError('Content categories configuration not found', 404)
  }

  const categories = config.value as string[]

  // Check if old category exists
  if (!categories.includes(oldSlug)) {
    throw new AppError('Category not found', 404)
  }

  // Check if new category name already exists
  if (categories.includes(newSlug) && oldSlug !== newSlug) {
    throw new AppError('A category with this name already exists', 400)
  }

  // Update category in config
  config.value = categories.map(cat => cat === oldSlug ? newSlug : cat)
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  // Update all content using this category
  const result = await Content.updateMany(
    { category: oldSlug },
    { $set: { category: newSlug } }
  )

  res.status(200).json({
    success: true,
    message: 'Category renamed successfully',
    data: config.value,
    updatedContent: result.modifiedCount
  })
})

// ============================================
// CONTENT TYPES MANAGEMENT
// ============================================

/**
 * POST /api/admin/hub/types
 * Add a new content type (super_admin only)
 */
export const addContentType = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type } = req.body

  if (!type || typeof type !== 'string') {
    throw new AppError('Content type name is required', 400)
  }

  const typeSlug = type.toLowerCase().trim().replace(/\s+/g, '_')

  if (!/^[a-z0-9_]+$/.test(typeSlug)) {
    throw new AppError('Type name can only contain lowercase letters, numbers, and underscores', 400)
  }

  if (typeSlug.length < 2 || typeSlug.length > 50) {
    throw new AppError('Type name must be between 2 and 50 characters', 400)
  }

  const config = await SystemConfig.findOne({ configKey: 'content_types' })

  if (!config) {
    throw new AppError('Content types configuration not found', 404)
  }

  const types = config.value as string[]

  if (types.includes(typeSlug)) {
    throw new AppError('Content type already exists', 400)
  }

  config.value = [...types, typeSlug]
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  res.status(201).json({
    success: true,
    message: 'Content type added successfully',
    data: types
  })
})

/**
 * DELETE /api/admin/hub/types/:slug
 * Delete a content type with cascade handling (super_admin only)
 */
export const deleteContentType = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params
  const { force } = req.query

  const config = await SystemConfig.findOne({ configKey: 'content_types' })

  if (!config) {
    throw new AppError('Content types configuration not found', 404)
  }

  const types = config.value as string[]

  if (!types.includes(slug)) {
    throw new AppError('Content type not found', 404)
  }

  // Check if content uses this type
  const contentCount = await Content.countDocuments({ contentType: slug })

  if (contentCount > 0) {
    if (force !== 'true') {
      throw new AppError(
        `Cannot delete content type. ${contentCount} content(s) use this type. Add ?force=true to move them to the first available type.`,
        400
      )
    }

    // Force delete: Move to first available type (excluding the one being deleted)
    const remainingTypes = types.filter(t => t !== slug)
    if (remainingTypes.length === 0) {
      throw new AppError('Cannot delete the last content type', 400)
    }

    const fallbackType = remainingTypes[0]
    await Content.updateMany(
      { contentType: slug },
      { $set: { contentType: fallbackType } }
    )

    console.log(`[ADMIN] Moved ${contentCount} content(s) from "${slug}" to "${fallbackType}" type`)
  }

  config.value = types.filter(t => t !== slug)
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  res.status(200).json({
    success: true,
    message: contentCount > 0
      ? `Content type deleted. ${contentCount} content(s) moved to "${types.filter(t => t !== slug)[0]}" type.`
      : 'Content type deleted successfully',
    data: config.value,
    movedContent: contentCount
  })
})

/**
 * PUT /api/admin/hub/types/:oldSlug
 * Rename a content type (super_admin only)
 */
export const renameContentType = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { oldSlug } = req.params
  const { newName } = req.body

  if (!newName || typeof newName !== 'string') {
    throw new AppError('New type name is required', 400)
  }

  const newSlug = newName.toLowerCase().trim().replace(/\s+/g, '_')

  if (!/^[a-z0-9_]+$/.test(newSlug)) {
    throw new AppError('Type name can only contain lowercase letters, numbers, and underscores', 400)
  }

  if (newSlug.length < 2 || newSlug.length > 50) {
    throw new AppError('Type name must be between 2 and 50 characters', 400)
  }

  const config = await SystemConfig.findOne({ configKey: 'content_types' })

  if (!config) {
    throw new AppError('Content types configuration not found', 404)
  }

  const types = config.value as string[]

  if (!types.includes(oldSlug)) {
    throw new AppError('Content type not found', 404)
  }

  if (types.includes(newSlug) && oldSlug !== newSlug) {
    throw new AppError('A content type with this name already exists', 400)
  }

  config.value = types.map(t => t === oldSlug ? newSlug : t)
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  const result = await Content.updateMany(
    { contentType: oldSlug },
    { $set: { contentType: newSlug } }
  )

  res.status(200).json({
    success: true,
    message: 'Content type renamed successfully',
    data: config.value,
    updatedContent: result.modifiedCount
  })
})

// ============================================
// DIFFICULTY LEVELS MANAGEMENT
// ============================================

/**
 * POST /api/admin/hub/difficulty
 * Add a new difficulty level (super_admin only)
 */
export const addDifficultyLevel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { level } = req.body

  if (!level || typeof level !== 'string') {
    throw new AppError('Difficulty level name is required', 400)
  }

  const levelSlug = level.toLowerCase().trim().replace(/\s+/g, '_')

  if (!/^[a-z0-9_]+$/.test(levelSlug)) {
    throw new AppError('Level name can only contain lowercase letters, numbers, and underscores', 400)
  }

  if (levelSlug.length < 2 || levelSlug.length > 50) {
    throw new AppError('Level name must be between 2 and 50 characters', 400)
  }

  const config = await SystemConfig.findOne({ configKey: 'difficulty_levels' })

  if (!config) {
    throw new AppError('Difficulty levels configuration not found', 404)
  }

  const levels = config.value as string[]

  if (levels.includes(levelSlug)) {
    throw new AppError('Difficulty level already exists', 400)
  }

  config.value = [...levels, levelSlug]
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  res.status(201).json({
    success: true,
    message: 'Difficulty level added successfully',
    data: levels
  })
})

/**
 * DELETE /api/admin/hub/difficulty/:slug
 * Delete a difficulty level (super_admin only)
 */
export const deleteDifficultyLevel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params

  const config = await SystemConfig.findOne({ configKey: 'difficulty_levels' })

  if (!config) {
    throw new AppError('Difficulty levels configuration not found', 404)
  }

  const levels = config.value as string[]

  if (!levels.includes(slug)) {
    throw new AppError('Difficulty level not found', 404)
  }

  // Difficulty is optional, so we just set it to null for affected content
  const result = await Content.updateMany(
    { difficulty: slug },
    { $unset: { difficulty: '' } }
  )

  config.value = levels.filter(l => l !== slug)
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  res.status(200).json({
    success: true,
    message: result.modifiedCount > 0
      ? `Difficulty level deleted. ${result.modifiedCount} content(s) difficulty cleared.`
      : 'Difficulty level deleted successfully',
    data: config.value,
    clearedContent: result.modifiedCount
  })
})

/**
 * PUT /api/admin/hub/difficulty/:oldSlug
 * Rename a difficulty level (super_admin only)
 */
export const renameDifficultyLevel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { oldSlug } = req.params
  const { newName } = req.body

  if (!newName || typeof newName !== 'string') {
    throw new AppError('New level name is required', 400)
  }

  const newSlug = newName.toLowerCase().trim().replace(/\s+/g, '_')

  if (!/^[a-z0-9_]+$/.test(newSlug)) {
    throw new AppError('Level name can only contain lowercase letters, numbers, and underscores', 400)
  }

  if (newSlug.length < 2 || newSlug.length > 50) {
    throw new AppError('Level name must be between 2 and 50 characters', 400)
  }

  const config = await SystemConfig.findOne({ configKey: 'difficulty_levels' })

  if (!config) {
    throw new AppError('Difficulty levels configuration not found', 404)
  }

  const levels = config.value as string[]

  if (!levels.includes(oldSlug)) {
    throw new AppError('Difficulty level not found', 404)
  }

  if (levels.includes(newSlug) && oldSlug !== newSlug) {
    throw new AppError('A difficulty level with this name already exists', 400)
  }

  config.value = levels.map(l => l === oldSlug ? newSlug : l)
  config.updatedBy = req.user._id
  config.markModified('value')
  await config.save()

  const result = await Content.updateMany(
    { difficulty: oldSlug },
    { $set: { difficulty: newSlug } }
  )

  res.status(200).json({
    success: true,
    message: 'Difficulty level renamed successfully',
    data: config.value,
    updatedContent: result.modifiedCount
  })
})

// System Config Update
export const updateSystemConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { configKey } = req.params
  const { value } = req.body

  if (!value) {
    throw new AppError('Value is required', 400)
  }

  // Use updateOne with $set to properly update Mixed type fields
  const result = await SystemConfig.updateOne(
    { configKey },
    {
      $set: {
        value: value,
        updatedBy: req.user._id,
        isActive: true
      }
    }
  )

  if (result.matchedCount === 0) {
    throw new AppError('System config not found', 404)
  }

  // Clear configHelper cache to ensure fresh data on next request
  configHelper.clearCache()

  // Fetch updated document to return
  const config = await SystemConfig.findOne({ configKey })

  res.status(200).json({
    success: true,
    message: 'System config updated successfully',
    data: config
  })
})
