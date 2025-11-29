import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
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

// Moderator/Admin routes (permission check in controller)
router.get('/', getAllReports)
router.get('/:id', getReport)
router.put('/:id/review', reviewReport)
router.delete('/:id', deleteReport)

export default router
