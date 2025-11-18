import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import { uploadConfig, setUploadType } from '../middleware/upload.middleware'
import { validateFileType, validateFileSize } from '../middleware/validate-config'
import {
  uploadSingle,
  uploadMultiple,
  uploadImage,
  uploadProfilePicture,
  deleteFile,
} from '../controllers/upload.controller'

const router = Router()

// All routes require authentication
router.use(protect)

// Single file upload
router.post(
  '/single',
  setUploadType('general'),
  uploadConfig.single('file'),
  uploadSingle
)

// Multiple files upload
router.post(
  '/multiple',
  setUploadType('general'),
  uploadConfig.array('files', 10),
  uploadMultiple
)

// Image upload with processing
router.post(
  '/image',
  setUploadType('images'),
  uploadConfig.single('image'),
  validateFileType('allowed_image_types'),
  validateFileSize('image'),
  uploadImage
)

// Profile picture upload
router.post(
  '/profile-picture',
  setUploadType('profiles'),
  uploadConfig.single('image'),
  validateFileType('allowed_image_types'),
  validateFileSize('image'),
  uploadProfilePicture
)

// Content media upload
router.post(
  '/content-media',
  setUploadType('content'),
  uploadConfig.array('files', 5),
  uploadMultiple
)

// Delete file
router.delete('/:filename', deleteFile)

export default router
