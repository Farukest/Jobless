import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from './error-handler'

export interface AuthRequest extends Request {
  user?: any
}

export const protect = asyncHandler(async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    throw new AppError('Not authorized to access this route', 401)
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

    // Populate roles to have access to role names for authorization
    const user = await User.findById(decoded.id)
      .populate('roles', 'name displayName')
      .select('-twitterAccessToken -twitterRefreshToken')

    if (!user) {
      throw new AppError('User not found', 404)
    }

    if (user.status !== 'active') {
      throw new AppError('User account is not active', 403)
    }

    req.user = user
    next()
  } catch (error) {
    throw new AppError('Not authorized to access this route', 401)
  }
})

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Not authorized', 401)
    }

    // Check if user has any of the required roles (roles are now populated objects)
    const userRoleNames = req.user.roles.map((role: any) => role.name)
    const hasRole = roles.some(role => userRoleNames.includes(role))

    if (!hasRole) {
      throw new AppError(
        `User role ${userRoleNames.join(', ')} is not authorized to access this route`,
        403
      )
    }

    next()
  }
}

// Alias for authorize (same functionality)
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Not authorized', 401)
    }

    // Check if user has any of the required roles (roles are now populated objects)
    const userRoleNames = req.user.roles.map((role: any) => role.name)
    const hasRole = roles.some(role => userRoleNames.includes(role))

    if (!hasRole) {
      throw new AppError(
        `User role ${userRoleNames.join(', ')} is not authorized to access this route`,
        403
      )
    }

    next()
  }
}

export const checkPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Not authorized', 401)
    }

    // Support nested permission checks with dot notation (e.g., 'hub.canCreate')
    let hasPermission = false

    if (permission.includes('.')) {
      // Nested permission check (e.g., 'hub.canCreate')
      const [module, key] = permission.split('.')
      hasPermission = req.user.permissions?.[module]?.[key] === true
    } else {
      // Legacy flat permission check (for backward compatibility)
      hasPermission = req.user.permissions[permission] === true ||
                     req.user.permissions.customPermissions?.includes(permission)
    }

    if (!hasPermission) {
      throw new AppError('You do not have permission to perform this action', 403)
    }

    next()
  }
}
