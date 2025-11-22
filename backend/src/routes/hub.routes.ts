import { Router } from 'express'
import { protect, checkPermission } from '../middleware/auth.middleware'
import {
  getAllContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getMyContents,
  toggleLike,
  toggleBookmark,
  moderateContent,
  getFeaturedContents,
  getAllowedContentTypes,
} from '../controllers/hub.controller'

const router = Router()

// Public routes
router.get('/featured', getFeaturedContents)

// Protected routes
router.get('/content', protect, getAllContents)
router.get('/my-content', protect, getMyContents)
router.get('/allowed-content-types', protect, getAllowedContentTypes)
router.get('/content/:id', protect, getContent)
router.post('/content', protect, checkPermission('canCreateContent'), createContent)
router.put('/content/:id', protect, updateContent)
router.delete('/content/:id', protect, deleteContent)

// Interactions
router.post('/content/:id/like', protect, toggleLike)
router.post('/content/:id/bookmark', protect, toggleBookmark)

// Moderation
router.put(
  '/content/:id/moderate',
  protect,
  checkPermission('canModerateContent'),
  moderateContent
)

export default router
