import express from 'express'
import { createEngagement, getUserEngagements, verifyEngagement } from '../controllers/userEngagement.controller'
import { protect, checkPermission } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/', createEngagement)
router.get('/', getUserEngagements)
router.put('/:id/verify', checkPermission('canModerateContent'), verifyEngagement)

export default router
