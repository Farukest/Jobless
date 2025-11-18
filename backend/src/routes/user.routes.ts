import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import {
  getUserProfile,
  updateProfile,
  updateProfilePicture,
  getUserStats,
  getUserActivity,
  addWhitelistWallet,
  removeWhitelistWallet,
  getLeaderboard,
} from '../controllers/user.controller'

const router = Router()

// Public routes
router.get('/leaderboard', getLeaderboard)

// Profile routes
router.get('/profile/:userId', protect, getUserProfile)
router.put('/profile', protect, updateProfile)
router.put('/profile-picture', protect, updateProfilePicture)
router.get('/stats', protect, getUserStats)
router.get('/activity', protect, getUserActivity)

// Wallet management
router.post('/wallet', protect, addWhitelistWallet)
router.delete('/wallet/:walletAddress', protect, removeWhitelistWallet)

export default router
