import { Router } from 'express'
import { protect, authorize, checkPermission } from '../middleware/auth.middleware'
import {
  createReport,
  getAllReports,
  getReport,
  reviewReport,
  deleteReport,
  getMyReports,
} from '../controllers/report.controller'

const router = Router()

// All routes require authentication
router.use(protect)

// User routes
router.post('/', createReport)
router.get('/my-reports', getMyReports)

// Moderator/Admin routes
router.get('/', checkPermission('canModerateContent'), getAllReports)
router.get('/:id', checkPermission('canModerateContent'), getReport)
router.put('/:id/review', checkPermission('canModerateContent'), reviewReport)
router.delete('/:id', authorize('admin', 'super_admin'), deleteReport)

export default router
