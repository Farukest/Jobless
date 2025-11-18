import { Request, Response, NextFunction } from 'express'
import { ProductionRequest } from '../models/ProductionRequest.model'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { configHelper } from '../utils/config-helper'

/**
 * @desc    Get all production requests
 * @route   GET /api/studio/requests
 * @access  Private
 */
export const getAllRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const filters: any = {}

    if (req.query.status) filters.status = req.query.status
    if (req.query.requestType) filters.requestType = req.query.requestType
    if (req.query.platform) filters.platform = req.query.platform

    // If user is designer/editor, show assigned requests
    if (req.query.assigned === 'true') {
      filters.assignedTo = req.user._id
    }

    const requests = await ProductionRequest.find(filters)
      .populate('requesterId', 'displayName twitterUsername profileImage')
      .populate('assignedTo', 'displayName twitterUsername profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await ProductionRequest.countDocuments(filters)

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: requests,
    })
  }
)

/**
 * @desc    Get single production request
 * @route   GET /api/studio/requests/:id
 * @access  Private
 */
export const getRequest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const request = await ProductionRequest.findById(id)
      .populate('requesterId', 'displayName twitterUsername profileImage')
      .populate('assignedTo', 'displayName twitterUsername profileImage')

    if (!request) {
      return next(new AppError('Production request not found', 404))
    }

    res.status(200).json({
      success: true,
      data: request,
    })
  }
)

/**
 * @desc    Create production request
 * @route   POST /api/studio/requests
 * @access  Private
 */
export const createRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const {
      requestType,
      platform,
      title,
      description,
      requirements,
      referenceFiles,
    } = req.body

    // Validate dynamic config
    const validTypes = await configHelper.get('production_request_types')
    if (!validTypes.includes(requestType)) {
      return next(new AppError('Invalid request type', 400))
    }

    if (platform) {
      const validPlatforms = await configHelper.get('platforms')
      if (!validPlatforms.includes(platform)) {
        return next(new AppError('Invalid platform', 400))
      }
    }

    const request = await ProductionRequest.create({
      requesterId: userId,
      requestType,
      platform,
      title,
      description,
      requirements,
      referenceFiles: referenceFiles || [],
    })

    res.status(201).json({
      success: true,
      data: request,
    })
  }
)

/**
 * @desc    Submit proposal for production request
 * @route   POST /api/studio/requests/:id/proposal
 * @access  Private (designers/editors)
 */
export const submitProposal = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { proposalDescription, proposalDeadline } = req.body

    const request = await ProductionRequest.findById(id)

    if (!request) {
      return next(new AppError('Production request not found', 404))
    }

    if (request.status !== 'pending') {
      return next(new AppError('Request is no longer available', 400))
    }

    request.assignedTo = userId as any
    request.assignedAt = new Date()
    request.proposalDescription = proposalDescription
    request.proposalDeadline = proposalDeadline ? new Date(proposalDeadline) : undefined
    request.proposalSubmittedAt = new Date()
    request.status = 'proposal_sent'

    await request.save()

    res.status(200).json({
      success: true,
      data: request,
    })
  }
)

/**
 * @desc    Accept/Reject proposal
 * @route   PUT /api/studio/requests/:id/proposal-response
 * @access  Private (requester only)
 */
export const respondToProposal = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { accept } = req.body

    const request = await ProductionRequest.findById(id)

    if (!request) {
      return next(new AppError('Production request not found', 404))
    }

    if (request.requesterId.toString() !== userId.toString()) {
      return next(new AppError('Not authorized', 403))
    }

    if (accept) {
      request.status = 'in_progress'
    } else {
      request.status = 'pending'
      request.assignedTo = undefined
      request.assignedAt = undefined
      request.proposalDescription = undefined
      request.proposalDeadline = undefined
      request.proposalSubmittedAt = undefined
    }

    await request.save()

    res.status(200).json({
      success: true,
      data: request,
    })
  }
)

/**
 * @desc    Deliver production
 * @route   POST /api/studio/requests/:id/deliver
 * @access  Private (assigned designer/editor)
 */
export const deliverProduction = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { deliveryFiles } = req.body

    const request = await ProductionRequest.findById(id)

    if (!request) {
      return next(new AppError('Production request not found', 404))
    }

    if (request.assignedTo?.toString() !== userId.toString()) {
      return next(new AppError('Not authorized', 403))
    }

    request.deliveryFiles = deliveryFiles || []
    request.deliveredAt = new Date()
    request.status = 'delivered'

    await request.save()

    res.status(200).json({
      success: true,
      data: request,
    })
  }
)

/**
 * @desc    Submit feedback and complete request
 * @route   POST /api/studio/requests/:id/feedback
 * @access  Private (requester only)
 */
export const submitFeedback = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const { feedback, rating } = req.body

    const request = await ProductionRequest.findById(id)

    if (!request) {
      return next(new AppError('Production request not found', 404))
    }

    if (request.requesterId.toString() !== userId.toString()) {
      return next(new AppError('Not authorized', 403))
    }

    request.feedback = feedback
    request.rating = rating
    request.status = 'completed'

    // Award points to designer/editor
    const pointsConfig = await configHelper.get('points_config')
    request.pointsAwarded = pointsConfig?.production_completed || 20

    await request.save()

    // Update designer stats
    if (request.assignedTo) {
      await User.findByIdAndUpdate(request.assignedTo, {
        $inc: { jRankPoints: request.pointsAwarded },
      })
    }

    res.status(200).json({
      success: true,
      data: request,
    })
  }
)

/**
 * @desc    Get my requests (as requester)
 * @route   GET /api/studio/my-requests
 * @access  Private
 */
export const getMyRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id

    const requests = await ProductionRequest.find({ requesterId: userId })
      .populate('assignedTo', 'displayName twitterUsername profileImage')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    })
  }
)

/**
 * @desc    Get my assigned requests (as designer/editor)
 * @route   GET /api/studio/my-assignments
 * @access  Private
 */
export const getMyAssignments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id

    const requests = await ProductionRequest.find({ assignedTo: userId })
      .populate('requesterId', 'displayName twitterUsername profileImage')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    })
  }
)
