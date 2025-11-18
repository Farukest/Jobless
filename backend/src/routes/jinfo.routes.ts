import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'
import { jinfoController } from '../controllers/jinfo.controller'

const router = Router()

/**
 * J Info Routes
 *
 * Public routes (no auth):
 * - GET /feed - View tweet feed
 * - GET /tweets/:id - View single tweet
 *
 * Protected routes (requires auth):
 * - POST /engage - Create engagement
 * - GET /my-engagements - View user's engagements
 * - GET /my-stats - View user's stats
 *
 * Admin routes:
 * - GET /admin/engagements - List all engagements
 * - PUT /admin/engagements/:id/verify - Verify engagement
 * - PUT /admin/engagements/:id/reject - Reject engagement
 */

// Public routes
router.get('/feed', jinfoController.getFeed.bind(jinfoController))
router.get('/tweets/:id', jinfoController.getTweetById.bind(jinfoController))

// Protected routes (requires authentication)
router.post('/engage', protect, jinfoController.createEngagement.bind(jinfoController))
router.get('/my-engagements', protect, jinfoController.getUserEngagements.bind(jinfoController))
router.get('/my-stats', protect, jinfoController.getUserStats.bind(jinfoController))

// Admin routes
router.get(
  '/admin/engagements',
  protect,
  authorize('admin', 'super_admin'),
  jinfoController.getAllEngagements.bind(jinfoController)
)
router.put(
  '/admin/engagements/:id/verify',
  protect,
  authorize('admin', 'super_admin'),
  jinfoController.verifyEngagement.bind(jinfoController)
)
router.put(
  '/admin/engagements/:id/reject',
  protect,
  authorize('admin', 'super_admin'),
  jinfoController.rejectEngagement.bind(jinfoController)
)

export default router
