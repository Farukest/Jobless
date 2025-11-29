import { Response } from 'express'
import { Hashtag } from '../models/Hashtag.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

/**
 * @desc    Get all hashtags (sorted by usage)
 * @route   GET /api/hashtags
 * @access  Public
 */
export const getAllHashtags = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const search = req.query.search as string

    const filter: any = {}
    if (search) {
      filter.tag = { $regex: search, $options: 'i' }
    }

    const hashtags = await Hashtag.find(filter)
      .sort({ usageCount: -1, tag: 1 })
      .limit(100)
      .select('tag usageCount')

    res.status(200).json({
      success: true,
      count: hashtags.length,
      data: hashtags,
    })
  }
)

/**
 * @desc    Create new hashtag
 * @route   POST /api/hashtags
 * @access  Private (admin only)
 */
export const createHashtag = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { tag } = req.body
    const userId = req.user._id

    if (!tag || !tag.trim()) {
      throw new AppError('Tag is required', 400)
    }

    // Validate format (alphanumeric, underscore, hyphen only)
    const cleanTag = tag.toLowerCase().trim().replace(/^#/, '') // Remove # if present
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanTag)) {
      throw new AppError('Invalid tag format. Only alphanumeric, underscore, and hyphen allowed', 400)
    }

    if (cleanTag.length > 30) {
      throw new AppError('Tag too long (max 30 characters)', 400)
    }

    // Check if already exists
    const existing = await Hashtag.findOne({ tag: cleanTag })
    if (existing) {
      throw new AppError('Hashtag already exists', 400)
    }

    const hashtag = await Hashtag.create({
      tag: cleanTag,
      createdBy: userId,
    })

    res.status(201).json({
      success: true,
      data: hashtag,
    })
  }
)

/**
 * @desc    Delete hashtag
 * @route   DELETE /api/hashtags/:id
 * @access  Private (admin only)
 */
export const deleteHashtag = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const hashtag = await Hashtag.findById(id)
    if (!hashtag) {
      throw new AppError('Hashtag not found', 404)
    }

    await hashtag.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Hashtag deleted successfully',
    })
  }
)

/**
 * @desc    Search hashtags (autocomplete)
 * @route   GET /api/hashtags/search
 * @access  Public
 */
export const searchHashtags = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { q } = req.query

    if (!q || typeof q !== 'string') {
      return res.status(200).json({
        success: true,
        data: [],
      })
    }

    const cleanQuery = q.toLowerCase().trim().replace(/^#/, '')

    const hashtags = await Hashtag.find({
      tag: { $regex: `^${cleanQuery}`, $options: 'i' },
    })
      .sort({ usageCount: -1, tag: 1 })
      .limit(10)
      .select('tag usageCount')

    res.status(200).json({
      success: true,
      data: hashtags,
    })
  }
)
