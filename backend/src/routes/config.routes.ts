import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'
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

const router = Router()

// Public routes
router.get('/public', getPublicConfigs)

// Admin routes - All require authentication
router.use(protect)
router.use(authorize('admin', 'super_admin'))

router.get('/', getAllConfigs)
router.get('/:key', getConfig)

// Super admin only routes
router.post('/', authorize('super_admin'), createConfig)
router.put('/:key', authorize('super_admin'), updateConfig)
router.post('/:key/add', authorize('super_admin'), addToConfigList)
router.delete('/:key/remove', authorize('super_admin'), removeFromConfigList)
router.delete('/:key', authorize('super_admin'), deleteConfig)

export default router
