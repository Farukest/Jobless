import { Request, Response, NextFunction } from 'express'
import { Course, CourseEnrollment, CourseRequest } from '../models/Course.model'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { engagementService } from '../services/engagement.service'
import mongoose from 'mongoose'

/**
 * @desc    Get all courses with filtering
 * @route   GET /api/academy/courses
 * @access  Private
 */
export const getAllCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Filters
    const filters: any = {}

    if (req.query.status) filters.status = req.query.status
    if (req.query.category) filters.category = req.query.category
    if (req.query.difficulty) filters.difficulty = req.query.difficulty
    if (req.query.mentorId) filters.mentorId = req.query.mentorId
    if (req.query.isLiveSession) filters.isLiveSession = req.query.isLiveSession === 'true'

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const courses = await Course.find(filters)
      .populate('mentorId', 'displayName twitterUsername profileImage')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)

    const total = await Course.countDocuments(filters)

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: courses,
    })
  }
)

/**
 * @desc    Get single course by ID
 * @route   GET /api/academy/courses/:id
 * @access  Private
 */
export const getCourse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const course = await Course.findById(id).populate(
      'mentorId',
      'displayName twitterUsername profileImage bio'
    )

    if (!course) {
      return next(new AppError('Course not found', 404))
    }

    // Track view with engagement service
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent']
    const authReq = req as AuthRequest
    const userId = authReq.user?._id || null

    await engagementService.trackView(
      userId,
      course._id as mongoose.Types.ObjectId,
      'course',
      ipAddress,
      userAgent
    )

    // Get engagement status for authenticated users
    let isLiked = false
    let isBookmarked = false

    if (authReq.user) {
      const [likeStatus, bookmarkStatus] = await Promise.all([
        engagementService.getLikeStatus(authReq.user._id, course._id as mongoose.Types.ObjectId, 'course'),
        engagementService.getBookmarkStatus(authReq.user._id, course._id as mongoose.Types.ObjectId, 'course'),
      ])
      isLiked = likeStatus
      isBookmarked = bookmarkStatus
    }

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        isLiked,
        isBookmarked,
      },
    })
  }
)

/**
 * @desc    Create new course
 * @route   POST /api/academy/courses
 * @access  Private (mentor only)
 */
export const createCourse = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const userRoleNames = req.user.roles.map((role: any) => role.name)
    const canCreateCourse = req.user.permissions.canCreateCourse || userRoleNames.includes('mentor') || userRoleNames.includes('admin') || userRoleNames.includes('super_admin')

    if (!canCreateCourse) {
      return next(new AppError('Only mentors can create courses', 403))
    }

    const {
      title,
      description,
      shortDescription,
      category,
      difficulty,
      thumbnailUrl,
      modules,
      duration,
      language,
      prerequisites,
      isLiveSession,
      sessionDate,
      sessionLink,
      maxParticipants,
      status,
    } = req.body

    const course = await Course.create({
      mentorId: userId,
      title,
      description,
      shortDescription,
      category,
      difficulty,
      thumbnailUrl,
      modules: modules || [],
      duration: duration || 0,
      language: language || 'en',
      prerequisites: prerequisites || [],
      isLiveSession: isLiveSession || false,
      sessionDate: sessionDate ? new Date(sessionDate) : undefined,
      sessionLink,
      maxParticipants,
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : undefined,
    })

    res.status(201).json({
      success: true,
      data: course,
    })
  }
)

/**
 * @desc    Update course
 * @route   PUT /api/academy/courses/:id
 * @access  Private (mentor only - own courses)
 */
export const updateCourse = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id

    const course = await Course.findById(id)

    if (!course) {
      return next(new AppError('Course not found', 404))
    }

    // Check authorization
    if (course.mentorId.toString() !== userId.toString()) {
      return next(new AppError('Not authorized to update this course', 403))
    }

    const {
      title,
      description,
      shortDescription,
      category,
      difficulty,
      thumbnailUrl,
      modules,
      duration,
      language,
      prerequisites,
      isLiveSession,
      sessionDate,
      sessionLink,
      maxParticipants,
      status,
    } = req.body

    // Update allowed fields
    if (title !== undefined) course.title = title
    if (description !== undefined) course.description = description
    if (shortDescription !== undefined) course.shortDescription = shortDescription
    if (category !== undefined) course.category = category
    if (difficulty !== undefined) course.difficulty = difficulty
    if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl
    if (modules !== undefined) course.modules = modules
    if (duration !== undefined) course.duration = duration
    if (language !== undefined) course.language = language
    if (prerequisites !== undefined) course.prerequisites = prerequisites
    if (isLiveSession !== undefined) course.isLiveSession = isLiveSession
    if (sessionDate !== undefined) course.sessionDate = sessionDate ? new Date(sessionDate) : undefined
    if (sessionLink !== undefined) course.sessionLink = sessionLink
    if (maxParticipants !== undefined) course.maxParticipants = maxParticipants

    // Handle status change
    if (status !== undefined) {
      const previousStatus = course.status
      course.status = status

      // Set publishedAt when first published
      if (status === 'published' && previousStatus !== 'published') {
        course.publishedAt = new Date()
      }
    }

    await course.save()

    res.status(200).json({
      success: true,
      data: course,
    })
  }
)

/**
 * @desc    Enroll in course
 * @route   POST /api/academy/courses/:id/enroll
 * @access  Private
 */
export const enrollInCourse = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id

    const course = await Course.findById(id)

    if (!course) {
      return next(new AppError('Course not found', 404))
    }

    if (course.status !== 'published') {
      return next(new AppError('Course is not available for enrollment', 400))
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      courseId: id,
      learnerId: userId,
    })

    if (existingEnrollment) {
      return next(new AppError('Already enrolled in this course', 400))
    }

    // Check if live session has space
    if (course.isLiveSession && course.maxParticipants) {
      const enrollmentCount = await CourseEnrollment.countDocuments({
        courseId: id,
        status: 'active',
      })

      if (enrollmentCount >= course.maxParticipants) {
        return next(new AppError('Course is full', 400))
      }
    }

    // Create enrollment
    const enrollment = await CourseEnrollment.create({
      courseId: id,
      learnerId: userId,
    })

    // Update course enrolled count
    course.enrolledCount += 1
    await course.save()

    res.status(201).json({
      success: true,
      data: enrollment,
    })
  }
)

/**
 * @desc    Update enrollment progress
 * @route   PUT /api/academy/enrollment/:id/progress
 * @access  Private
 */
export const updateEnrollmentProgress = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id
    const {
      progress,
      currentModule,
      currentLesson,
      completedLessons,
      rating,
      review,
    } = req.body

    const enrollment = await CourseEnrollment.findById(id)

    if (!enrollment) {
      return next(new AppError('Enrollment not found', 404))
    }

    // Check authorization
    if (enrollment.learnerId.toString() !== userId.toString()) {
      return next(new AppError('Not authorized to update this enrollment', 403))
    }

    // Update fields
    if (progress !== undefined) {
      enrollment.progress = progress

      // Auto-complete if progress reaches 100
      if (progress >= 100 && enrollment.status !== 'completed') {
        enrollment.status = 'completed'
        enrollment.completedAt = new Date()

        // Update course completed count
        const course = await Course.findById(enrollment.courseId)
        if (course) {
          course.completedCount += 1
          await course.save()
        }
      }
    }

    if (currentModule !== undefined) enrollment.currentModule = currentModule
    if (currentLesson !== undefined) enrollment.currentLesson = currentLesson
    if (completedLessons !== undefined) enrollment.completedLessons = completedLessons

    // Update rating and review
    if (rating !== undefined) {
      enrollment.rating = rating

      // Update course average rating
      const course = await Course.findById(enrollment.courseId)
      if (course) {
        const enrollments = await CourseEnrollment.find({
          courseId: enrollment.courseId,
          rating: { $exists: true, $ne: null },
        })

        const totalRating = enrollments.reduce((sum, e) => sum + (e.rating || 0), 0)
        course.averageRating = totalRating / enrollments.length
        course.reviewsCount = enrollments.length
        await course.save()
      }
    }

    if (review !== undefined) enrollment.review = review

    enrollment.lastAccessedAt = new Date()
    await enrollment.save()

    res.status(200).json({
      success: true,
      data: enrollment,
    })
  }
)

/**
 * @desc    Get all course requests
 * @route   GET /api/academy/course-requests
 * @access  Private
 */
export const getCourseRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const filters: any = {}

    if (req.query.status) filters.status = req.query.status
    if (req.query.category) filters.category = req.query.category

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'votes'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const requests = await CourseRequest.find(filters)
      .populate('requesterId', 'displayName twitterUsername profileImage')
      .populate('approvedBy', 'displayName twitterUsername')
      .populate('assignedMentor', 'displayName twitterUsername profileImage')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)

    const total = await CourseRequest.countDocuments(filters)

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
 * @desc    Create course request
 * @route   POST /api/academy/course-requests
 * @access  Private
 */
export const createCourseRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id
    const { title, description, category } = req.body

    const courseRequest = await CourseRequest.create({
      requesterId: userId,
      title,
      description,
      category,
    })

    res.status(201).json({
      success: true,
      data: courseRequest,
    })
  }
)

/**
 * @desc    Get user's courses (as learner or mentor)
 * @route   GET /api/academy/my-courses
 * @access  Private
 */
export const getMyCourses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user._id
    const role = (req.query.role as string) || 'learner'

    if (role === 'mentor') {
      // Get courses created by user as mentor
      const courses = await Course.find({ mentorId: userId })
        .sort({ createdAt: -1 })

      res.status(200).json({
        success: true,
        count: courses.length,
        data: courses,
      })
    } else {
      // Get courses enrolled by user as learner
      const enrollments = await CourseEnrollment.find({ learnerId: userId })
        .populate({
          path: 'courseId',
          populate: {
            path: 'mentorId',
            select: 'displayName twitterUsername profileImage',
          },
        })
        .sort({ lastAccessedAt: -1 })

      res.status(200).json({
        success: true,
        count: enrollments.length,
        data: enrollments,
      })
    }
  }
)

/**
 * @desc    Toggle course like
 * @route   POST /api/academy/courses/:id/like
 * @access  Private
 */
export const toggleCourseLike = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id

    // Verify course exists
    const course = await Course.findById(id)
    if (!course) {
      return next(new AppError('Course not found', 404))
    }

    // Toggle like using engagement service
    const result = await engagementService.toggleLike(
      userId,
      new mongoose.Types.ObjectId(id),
      'course'
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)

/**
 * @desc    Toggle course bookmark
 * @route   POST /api/academy/courses/:id/bookmark
 * @access  Private
 */
export const toggleCourseBookmark = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user._id

    // Verify course exists
    const course = await Course.findById(id)
    if (!course) {
      return next(new AppError('Course not found', 404))
    }

    // Toggle bookmark using engagement service
    const result = await engagementService.toggleBookmark(
      userId,
      new mongoose.Types.ObjectId(id),
      'course'
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)
