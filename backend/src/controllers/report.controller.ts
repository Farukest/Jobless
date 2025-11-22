import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler, AppError } from '../middleware/error-handler'
import { Report } from '../models/Report.model'

/**
 * @desc    Create report
 * @route   POST /api/reports
 * @access  Private
 */
export const createReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { contentType, contentId, reason, description } = req.body
    const reporterId = req.user._id

    if (!contentType || !contentId || !reason) {
      throw new AppError('Content type, content ID, and reason are required', 400)
    }

    // Validate contentType
    const validTypes = ['hub_content', 'alpha_post', 'course', 'comment', 'user']
    if (!validTypes.includes(contentType)) {
      throw new AppError('Invalid content type', 400)
    }

    // Validate reason
    const validReasons = [
      'spam',
      'harassment',
      'misinformation',
      'inappropriate_content',
      'copyright_violation',
      'scam',
      'other',
    ]
    if (!validReasons.includes(reason)) {
      throw new AppError('Invalid reason', 400)
    }

    // Check if user already reported this content
    const existingReport = await Report.findOne({
      reporterId,
      contentType,
      contentId,
    })

    if (existingReport) {
      throw new AppError('You have already reported this content', 400)
    }

    const report = await Report.create({
      reporterId,
      contentType,
      contentId,
      reason,
      description,
    })

    const populatedReport = await Report.findById(report._id).populate(
      'reporterId',
      'displayName twitterUsername'
    )

    res.status(201).json({
      success: true,
      data: populatedReport,
    })
  }
)

/**
 * @desc    Get all reports (admin)
 * @route   GET /api/reports
 * @access  Private (moderator/admin)
 */
export const getAllReports = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const filters: any = {}

    if (req.query.status) filters.status = req.query.status
    if (req.query.contentType) filters.contentType = req.query.contentType
    if (req.query.reason) filters.reason = req.query.reason

    const reports = await Report.find(filters)
      .populate('reporterId', 'displayName twitterUsername profileImage')
      .populate('reviewedBy', 'displayName twitterUsername')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Report.countDocuments(filters)

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reports,
    })
  }
)

/**
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private (moderator/admin)
 */
export const getReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const report = await Report.findById(id)
      .populate('reporterId', 'displayName twitterUsername profileImage')
      .populate('reviewedBy', 'displayName twitterUsername')

    if (!report) {
      throw new AppError('Report not found', 404)
    }

    res.status(200).json({
      success: true,
      data: report,
    })
  }
)

/**
 * @desc    Review report
 * @route   PUT /api/reports/:id/review
 * @access  Private (moderator/admin)
 */
export const reviewReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { status, action, reviewNotes } = req.body
    const reviewerId = req.user._id

    const report = await Report.findById(id)

    if (!report) {
      throw new AppError('Report not found', 404)
    }

    if (!status) {
      throw new AppError('Status is required', 400)
    }

    // Validate status
    const validStatuses = ['reviewing', 'resolved', 'dismissed']
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400)
    }

    // Validate action if provided
    if (action) {
      const validActions = [
        'none',
        'content_removed',
        'user_warned',
        'user_suspended',
        'user_banned',
      ]
      if (!validActions.includes(action)) {
        throw new AppError('Invalid action', 400)
      }
    }

    report.status = status
    report.reviewedBy = reviewerId as any
    report.reviewedAt = new Date()
    if (reviewNotes) report.reviewNotes = reviewNotes
    if (action) report.action = action

    await report.save()

    const populatedReport = await Report.findById(report._id)
      .populate('reporterId', 'displayName twitterUsername profileImage')
      .populate('reviewedBy', 'displayName twitterUsername')

    res.status(200).json({
      success: true,
      data: populatedReport,
    })
  }
)

/**
 * @desc    Delete report
 * @route   DELETE /api/reports/:id
 * @access  Private (admin)
 */
export const deleteReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const report = await Report.findById(id)

    if (!report) {
      throw new AppError('Report not found', 404)
    }

    await report.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    })
  }
)

/**
 * @desc    Get my reports
 * @route   GET /api/reports/my-reports
 * @access  Private
 */
export const getMyReports = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const reporterId = req.user._id

    const reports = await Report.find({ reporterId })
      .populate('reviewedBy', 'displayName twitterUsername')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    })
  }
)
