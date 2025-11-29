import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'

// System config controllers
import {
  getAllConfigs,
  getConfig,
  updateConfig,
  addToConfigList,
  removeFromConfigList,
  createConfig,
  deleteConfig,
  getPublicConfigs,
} from '../controllers/config.controller'

// Dynamic content controllers
import {
  getAllItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
} from '../controllers/dynamicContent.controller'

const router = Router()

// ======================
// PUBLIC ROUTES
// ======================

// Public system configs (e.g., hub_limits, token_prices)
router.get('/public', getPublicConfigs)

// Public dynamic content types (anyone can read dropdown options)
router.get('/:type', getAllItems) // hub-content-types, studio-request-types, etc.
router.get('/:type/:id', getItem)

// ======================
// ADMIN ROUTES (super_admin only)
// ======================

router.use(protect) // All routes below require authentication

// System Config Management (super_admin only)
router.get('/', authorize('super_admin'), getAllConfigs)
router.get('/system/:key', authorize('super_admin'), getConfig)
router.post('/system', authorize('super_admin'), createConfig)
router.put('/system/:key', authorize('super_admin'), updateConfig)
router.post('/system/:key/add', authorize('super_admin'), addToConfigList)
router.delete('/system/:key/remove', authorize('super_admin'), removeFromConfigList)
router.delete('/system/:key', authorize('super_admin'), deleteConfig)

// Dynamic Content Management (super_admin only)
// Supports: hub-content-types, studio-request-types, academy-categories,
//           info-platforms, info-engagement-types, alpha-categories
router.post('/:type', authorize('super_admin'), createItem)
router.put('/:type/:id', authorize('super_admin'), updateItem)
router.delete('/:type/:id', authorize('super_admin'), deleteItem)
router.patch('/:type/:id/toggle', authorize('super_admin'), toggleItemStatus)

export default router
