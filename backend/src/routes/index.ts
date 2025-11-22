import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import hubRoutes from './hub.routes'
import studioRoutes from './studio.routes'
import academyRoutes from './academy.routes'
import infoRoutes from './info.routes'
import alphaRoutes from './alpha.routes'
import adminRoutes from './admin.routes'
import roleRoutes from './role.routes'
import configRoutes from './config.routes'
import uploadRoutes from './upload.routes'
import profileActivityRoutes from './profileActivity.routes'
import userStatsRoutes from './userStats.routes'
import contentCommentRoutes from './contentComment.routes'
import studioMemberRoutes from './studioMember.routes'
import userEngagementRoutes from './userEngagement.routes'
import alphaCommentRoutes from './alphaComment.routes'
import adminLogRoutes from './adminLog.routes'
import tokenTransactionRoutes from './tokenTransaction.routes'
import smartContractRoutes from './smartContract.routes'
import notificationRoutes from './notification.routes'
import socialLinksRoutes from './socialLinks.routes'
import dynamicContentRoutes from './dynamicContent.routes'
import commentRoutes from './comment.routes'
import reportRoutes from './report.routes'
import badgeRoutes from './badge.routes'
// import jinfoRoutes from './jinfo.routes' // Temporarily disabled due to TypeScript compilation issues

const router = Router()

// Mount routes
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/social-links', socialLinksRoutes)
router.use('/hub', hubRoutes)
router.use('/studio', studioRoutes)
router.use('/academy', academyRoutes)
router.use('/info', infoRoutes)
router.use('/alpha', alphaRoutes)
router.use('/admin', adminRoutes)
router.use('/roles', roleRoutes)
router.use('/configs', configRoutes)
router.use('/upload', uploadRoutes)
router.use('/profile-activity', profileActivityRoutes)
router.use('/user-stats', userStatsRoutes)
router.use('/content-comments', contentCommentRoutes)
router.use('/studio-members', studioMemberRoutes)
router.use('/user-engagements', userEngagementRoutes)
router.use('/alpha-comments', alphaCommentRoutes)
router.use('/admin-logs', adminLogRoutes)
router.use('/token-transactions', tokenTransactionRoutes)
router.use('/smart-contracts', smartContractRoutes)
router.use('/notifications', notificationRoutes)
router.use('/admin/dynamic-content', dynamicContentRoutes)
router.use('/comments', commentRoutes)
router.use('/reports', reportRoutes)
router.use('/badges', badgeRoutes)
// router.use('/jinfo', jinfoRoutes) // Temporarily disabled

export default router
