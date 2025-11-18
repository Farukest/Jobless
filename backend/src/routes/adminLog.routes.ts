import express from 'express'
import { getAdminLogs } from '../controllers/adminLog.controller'
import { protect, authorize } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)
router.use(authorize('admin', 'super_admin'))

router.get('/', getAdminLogs)

export default router
