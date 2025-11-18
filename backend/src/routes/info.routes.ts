import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'
import {
  getAllPosts,
  getPost,
  createPost,
  submitEngagement,
  getMyEngagements,
  verifyPost,
} from '../controllers/info.controller'

const router = Router()

// Engagement posts
router.get('/posts', protect, getAllPosts)
router.get('/posts/:id', protect, getPost)
router.post('/posts', protect, createPost)

// User engagement
router.post('/posts/:id/engage', protect, submitEngagement)
router.get('/my-engagements', protect, getMyEngagements)

// Admin verification
router.put('/posts/:id/verify', protect, authorize('admin', 'super_admin'), verifyPost)

export default router
