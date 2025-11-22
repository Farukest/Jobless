import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'
import * as badgeController from '../controllers/badge.controller'

const router = Router()

// All routes require authentication
router.use(protect)

// User badge endpoints
router.get('/my-badges', badgeController.getMyBadges)
router.get('/pinned', badgeController.getMyPinnedBadges)
router.get('/user/:userId', badgeController.getUserBadges)
router.post('/pin/:badgeId', badgeController.pinBadge)
router.delete('/pin/:badgeId', badgeController.unpinBadge)
router.patch('/visibility/:badgeId', badgeController.toggleBadgeVisibility)
router.post('/check', badgeController.checkMyBadges)

// Admin endpoints - only super_admin
router.use('/admin', authorize('super_admin'))

router.get('/admin/all', badgeController.getAllBadges)
router.get('/admin/stats', badgeController.getBadgeStatistics)
router.get('/admin/:badgeId', badgeController.getBadge)
router.post('/admin/create', badgeController.createBadge)
router.put('/admin/:badgeId', badgeController.updateBadge)
router.delete('/admin/:badgeId', badgeController.deleteBadge)
router.post('/admin/award', badgeController.manualAwardBadge)
router.delete('/admin/remove', badgeController.removeBadgeFromUser)

export default router
