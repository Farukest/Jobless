import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  enrollInCourse,
  updateEnrollmentProgress,
  getCourseRequests,
  createCourseRequest,
  getMyCourses,
  toggleCourseLike,
  toggleCourseBookmark,
} from '../controllers/academy.controller'

const router = Router()

// Course routes
router.get('/courses', protect, getAllCourses)
router.get('/courses/:id', protect, getCourse)
router.post('/courses', protect, createCourse)
router.put('/courses/:id', protect, updateCourse)

// Course engagement
router.post('/courses/:id/like', protect, toggleCourseLike)
router.post('/courses/:id/bookmark', protect, toggleCourseBookmark)

// Enrollment
router.post('/courses/:id/enroll', protect, enrollInCourse)
router.put('/enrollment/:id/progress', protect, updateEnrollmentProgress)

// Course requests
router.get('/course-requests', protect, getCourseRequests)
router.post('/course-requests', protect, createCourseRequest)

// User's courses
router.get('/my-courses', protect, getMyCourses)

export default router
