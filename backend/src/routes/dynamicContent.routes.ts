import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'
import {
  getAllItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
} from '../controllers/dynamicContent.controller'

const router = Router()

// Dynamic content management routes
// Supports: hub-content-types, studio-request-types, academy-categories,
//           info-platforms, info-engagement-types, alpha-categories

// Public GET routes - anyone can read dynamic content types
router.get('/:type', getAllItems)
router.get('/:type/:id', getItem)

// Admin-only routes - require super_admin for write operations
router.post('/:type', protect, authorize('super_admin'), createItem)
router.put('/:type/:id', protect, authorize('super_admin'), updateItem)
router.delete('/:type/:id', protect, authorize('super_admin'), deleteItem)
router.patch('/:type/:id/toggle', protect, authorize('super_admin'), toggleItemStatus)

export default router
