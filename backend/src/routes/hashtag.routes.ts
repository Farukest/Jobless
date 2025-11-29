import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'
import {
  getAllHashtags,
  createHashtag,
  deleteHashtag,
  searchHashtags,
} from '../controllers/hashtag.controller'

const router = Router()

// Public routes
router.get('/', getAllHashtags)
router.get('/search', searchHashtags)

// Admin only routes
router.post('/', protect, authorize('admin', 'super_admin'), createHashtag)
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteHashtag)

export default router
