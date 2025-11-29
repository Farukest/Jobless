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
import configsRoutes from './configs.routes'
import uploadRoutes from './upload.routes'
import profileActivityRoutes from './profileActivity.routes'
import studioMemberRoutes from './studioMember.routes'
import tokenTransactionRoutes from './tokenTransaction.routes'
import smartContractRoutes from './smartContract.routes'
import notificationRoutes from './notification.routes'
import socialLinksRoutes from './socialLinks.routes'
import commentRoutes from './comment.routes'
import reportRoutes from './report.routes'
import badgeRoutes from './badge.routes'
import hashtagRoutes from './hashtag.routes'

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
router.use('/configs', configsRoutes) // Unified: system configs + dynamic content types (public GET, protected POST/PUT/DELETE)
router.use('/upload', uploadRoutes)
router.use('/profile-activity', profileActivityRoutes)
router.use('/studio-members', studioMemberRoutes)
router.use('/token-transactions', tokenTransactionRoutes)
router.use('/smart-contracts', smartContractRoutes)
router.use('/notifications', notificationRoutes)
router.use('/comments', commentRoutes)
router.use('/reports', reportRoutes)
router.use('/badges', badgeRoutes)
router.use('/hashtags', hashtagRoutes)

export default router
