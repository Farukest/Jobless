import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler, AppError } from '../middleware/error-handler'
import { HubContentType } from '../models/HubContentType.model'
import { StudioRequestType } from '../models/StudioRequestType.model'
import { AcademyCategory } from '../models/AcademyCategory.model'
import { InfoPlatform } from '../models/InfoPlatform.model'
import { InfoEngagementType } from '../models/InfoEngagementType.model'
import { AlphaCategory } from '../models/AlphaCategory.model'

// Model mapping
const models: Record<string, any> = {
  'hub-content-types': HubContentType,
  'studio-request-types': StudioRequestType,
  'academy-categories': AcademyCategory,
  'info-platforms': InfoPlatform,
  'info-engagement-types': InfoEngagementType,
  'alpha-categories': AlphaCategory,
}

/**
 * @desc    Get all items of a dynamic content type
 * @route   GET /api/admin/dynamic-content/:type
 * @access  Private (admin)
 */
export const getAllItems = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { type } = req.params
    const Model = models[type]

    if (!Model) {
      throw new AppError('Invalid content type', 400)
    }

    const items = await Model.find().sort({ order: 1, name: 1 })

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    })
  }
)

/**
 * @desc    Get single item
 * @route   GET /api/admin/dynamic-content/:type/:id
 * @access  Private (admin)
 */
export const getItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { type, id } = req.params
    const Model = models[type]

    if (!Model) {
      throw new AppError('Invalid content type', 400)
    }

    const item = await Model.findById(id)

    if (!item) {
      throw new AppError('Item not found', 404)
    }

    res.status(200).json({
      success: true,
      data: item,
    })
  }
)

/**
 * @desc    Create new item
 * @route   POST /api/admin/dynamic-content/:type
 * @access  Private (super_admin)
 */
export const createItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { type } = req.params
    const { name, description, order } = req.body
    const Model = models[type]

    if (!Model) {
      throw new AppError('Invalid content type', 400)
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists
    const existingItem = await Model.findOne({ slug })
    if (existingItem) {
      throw new AppError('Item with this name already exists', 400)
    }

    const item = await Model.create({
      name,
      slug,
      description,
      order: order || 0,
      isActive: true,
    })

    res.status(201).json({
      success: true,
      data: item,
    })
  }
)

/**
 * @desc    Update item
 * @route   PUT /api/admin/dynamic-content/:type/:id
 * @access  Private (super_admin)
 */
export const updateItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { type, id } = req.params
    const { name, description, order, isActive } = req.body
    const Model = models[type]

    if (!Model) {
      throw new AppError('Invalid content type', 400)
    }

    const item = await Model.findById(id)

    if (!item) {
      throw new AppError('Item not found', 404)
    }

    // Update fields
    if (name !== undefined) {
      item.name = name
      // Regenerate slug if name changed
      item.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    if (description !== undefined) item.description = description
    if (order !== undefined) item.order = order
    if (isActive !== undefined) item.isActive = isActive

    await item.save()

    res.status(200).json({
      success: true,
      data: item,
    })
  }
)

/**
 * @desc    Delete item
 * @route   DELETE /api/admin/dynamic-content/:type/:id
 * @access  Private (super_admin)
 */
export const deleteItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { type, id } = req.params
    const Model = models[type]

    if (!Model) {
      throw new AppError('Invalid content type', 400)
    }

    const item = await Model.findById(id)

    if (!item) {
      throw new AppError('Item not found', 404)
    }

    await item.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    })
  }
)

/**
 * @desc    Toggle item active status
 * @route   PATCH /api/admin/dynamic-content/:type/:id/toggle
 * @access  Private (super_admin)
 */
export const toggleItemStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { type, id } = req.params
    const Model = models[type]

    if (!Model) {
      throw new AppError('Invalid content type', 400)
    }

    const item = await Model.findById(id)

    if (!item) {
      throw new AppError('Item not found', 404)
    }

    item.isActive = !item.isActive
    await item.save()

    res.status(200).json({
      success: true,
      data: item,
    })
  }
)
