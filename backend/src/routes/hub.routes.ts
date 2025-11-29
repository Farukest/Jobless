import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import { uploadDocument } from '../middleware/upload.middleware'
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
  uploadDocumentFile,
} from '../controllers/hub.controller'

const router = Router()

// Public routes
router.get('/featured', getFeaturedContents)

// Protected routes
router.get('/content', protect, getAllContents)
router.get('/my-content', protect, getMyContents)
router.get('/allowed-content-types', protect, getAllowedContentTypes)
router.get('/content/:id', protect, getContent)
router.post('/content', protect, createContent)
router.put('/content/:id', protect, updateContent)
router.delete('/content/:id', protect, deleteContent)

// File upload - DOCUMENTS ONLY (PDF, DOC, DOCX)
router.post(
  '/upload/document',
  protect,
  uploadDocument.single('document'),
  uploadDocumentFile
)

// Interactions
router.post('/content/:id/like', protect, toggleLike)
router.post('/content/:id/bookmark', protect, toggleBookmark)

// Moderation
router.put('/content/:id/moderate', protect, moderateContent)

export default router
