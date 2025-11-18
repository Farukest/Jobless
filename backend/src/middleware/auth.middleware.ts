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

    const user = await User.findById(decoded.id).select('-twitterAccessToken -twitterRefreshToken')

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

    const hasRole = roles.some(role => req.user.roles.includes(role))

    if (!hasRole) {
      throw new AppError(
        `User role ${req.user.roles.join(', ')} is not authorized to access this route`,
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

    const hasPermission = req.user.permissions[permission] === true ||
                         req.user.permissions.customPermissions?.includes(permission)

    if (!hasPermission) {
      throw new AppError('You do not have permission to perform this action', 403)
    }

    next()
  }
}
