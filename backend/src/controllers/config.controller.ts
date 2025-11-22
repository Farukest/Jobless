import { Request, Response, NextFunction } from 'express'
import { SystemConfig } from '../models/SystemConfig.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { configHelper } from '../utils/config-helper'
import { AuthRequest } from '../middleware/auth.middleware'

/**
 * @desc    Get all system configurations
 * @route   GET /api/admin/configs
 * @access  Private (Admin)
 */
export const getAllConfigs = asyncHandler(async (req: Request, res: Response) => {
  const configs = await configHelper.getAll()

  res.status(200).json({
    success: true,
    count: configs.length,
    data: configs,
  })
})

/**
 * @desc    Get specific configuration
 * @route   GET /api/admin/configs/:key
 * @access  Private (Admin)
 */
export const getConfig = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { key } = req.params

    const value = await configHelper.get(key, false)

    if (!value) {
      return next(new AppError('Configuration not found', 404))
    }

    res.status(200).json({
      success: true,
      data: value,
    })
  }
)

/**
 * @desc    Update configuration value
 * @route   PUT /api/admin/configs/:key
 * @access  Private (Super Admin)
 */
export const updateConfig = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { key } = req.params
    const { value } = req.body
    const userId = req.user._id

    if (value === undefined) {
      return next(new AppError('Value is required', 400))
    }

    const updated = await configHelper.update(key, value, userId)

    if (!updated) {
      return next(new AppError('Configuration not found', 404))
    }

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
    })
  }
)

/**
 * @desc    Add value to list configuration
 * @route   POST /api/admin/configs/:key/add
 * @access  Private (Super Admin)
 */
export const addToConfigList = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { key } = req.params
    const { value } = req.body
    const userId = req.user._id

    if (!value) {
      return next(new AppError('Value is required', 400))
    }

    const added = await configHelper.addToList(key, value, userId)

    if (!added) {
      return next(new AppError('Failed to add value to list', 400))
    }

    res.status(200).json({
      success: true,
      message: 'Value added to configuration list',
    })
  }
)

/**
 * @desc    Remove value from list configuration
 * @route   DELETE /api/admin/configs/:key/remove
 * @access  Private (Super Admin)
 */
export const removeFromConfigList = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { key } = req.params
    const { value } = req.body
    const userId = req.user._id

    if (!value) {
      return next(new AppError('Value is required', 400))
    }

    const removed = await configHelper.removeFromList(key, value, userId)

    if (!removed) {
      return next(new AppError('Failed to remove value from list', 400))
    }

    res.status(200).json({
      success: true,
      message: 'Value removed from configuration list',
    })
  }
)

/**
 * @desc    Create new configuration
 * @route   POST /api/admin/configs
 * @access  Private (Super Admin)
 */
export const createConfig = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { configKey, configType, value, description } = req.body
    const userId = req.user._id

    if (!configKey || !configType || value === undefined) {
      return next(new AppError('configKey, configType, and value are required', 400))
    }

    const exists = await SystemConfig.findOne({ configKey })

    if (exists) {
      return next(new AppError('Configuration key already exists', 400))
    }

    const config = await SystemConfig.create({
      configKey,
      configType,
      value,
      description,
      updatedBy: userId,
    })

    res.status(201).json({
      success: true,
      data: config,
    })
  }
)

/**
 * @desc    Delete configuration
 * @route   DELETE /api/admin/configs/:key
 * @access  Private (Super Admin)
 */
export const deleteConfig = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { key } = req.params

    const config = await SystemConfig.findOneAndUpdate(
      { configKey: key },
      { isActive: false },
      { new: true }
    )

    if (!config) {
      return next(new AppError('Configuration not found', 404))
    }

    configHelper.clearCache()

    res.status(200).json({
      success: true,
      message: 'Configuration deactivated successfully',
    })
  }
)

/**
 * @desc    Get public configurations (for frontend)
 * @route   GET /api/configs/public
 * @access  Public
 */
export const getPublicConfigs = asyncHandler(async (req: Request, res: Response) => {
  const publicKeys = [
    'content_categories',
    'content_types',
    'difficulty_levels',
    'platforms',
    'course_categories',
    'alpha_categories',
    'supported_blockchains',
    'link_types',
    'hub_limits',
    'points_config',
    'max_file_sizes',
  ]

  const configs = await configHelper.getMultiple(publicKeys)

  res.status(200).json({
    success: true,
    data: configs,
  })
})
