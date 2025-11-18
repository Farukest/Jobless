import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import {
  linkSocialAccount,
  unlinkSocialAccount,
  unlinkTwitterAuth,
  disconnectWallet
} from '../controllers/socialLinks.controller'

const router = Router()

// All routes require authentication
router.use(protect)

// Link/unlink social accounts (LinkedIn, GitHub)
router.post('/link', linkSocialAccount)
router.delete('/unlink/:platform', unlinkSocialAccount)

// Disconnect authentication methods
router.delete('/auth/twitter', unlinkTwitterAuth)
router.delete('/auth/wallet', disconnectWallet)

export default router
