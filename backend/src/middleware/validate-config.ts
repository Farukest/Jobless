import { Request, Response, NextFunction } from 'express'
import { configHelper } from '../utils/config-helper'
import { AppError } from './error-handler'

/**
 * Middleware to validate dynamic enum values
 */
export const validateConfigEnum = (configKey: string, field: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[field]

    if (!value) {
      return next()
    }

    const isValid = await configHelper.validateEnum(configKey, value)

    if (!isValid) {
      const allowedValues = await configHelper.get(configKey)
      return next(
        new AppError(
          `Invalid ${field}. Allowed values: ${allowedValues.join(', ')}`,
          400
        )
      )
    }

    next()
  }
}

/**
 * Middleware to validate array of dynamic enum values
 */
export const validateConfigEnumArray = (configKey: string, field: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const values = req.body[field]

    if (!values || !Array.isArray(values)) {
      return next()
    }

    const isValid = await configHelper.validateEnumArray(configKey, values)

    if (!isValid) {
      const allowedValues = await configHelper.get(configKey)
      return next(
        new AppError(
          `Invalid ${field}. Allowed values: ${allowedValues.join(', ')}`,
          400
        )
      )
    }

    next()
  }
}

/**
 * Middleware to validate file type based on dynamic configuration
 */
export const validateFileType = (fileTypeConfig: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next()
    }

    const allowedTypes = await configHelper.get(fileTypeConfig)

    if (!allowedTypes || !Array.isArray(allowedTypes)) {
      return next(new AppError('File type validation configuration not found', 500))
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(
        new AppError(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          400
        )
      )
    }

    next()
  }
}

/**
 * Middleware to validate file size based on dynamic configuration
 */
export const validateFileSize = (sizeType: 'image' | 'video' | 'document' | 'audio') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next()
    }

    const maxSizes = await configHelper.get('max_file_sizes')

    if (!maxSizes || !maxSizes[sizeType]) {
      return next(new AppError('File size validation configuration not found', 500))
    }

    if (req.file.size > maxSizes[sizeType]) {
      return next(
        new AppError(
          `File too large. Maximum size: ${(maxSizes[sizeType] / 1024 / 1024).toFixed(2)}MB`,
          400
        )
      )
    }

    next()
  }
}
