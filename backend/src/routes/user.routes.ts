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
  searchUsers,
  getUserBadges,
  getUserBadgeStats,
} from '../controllers/user.controller'

const router = Router()

// Public routes
router.get('/leaderboard', getLeaderboard)

// Search routes (protected)
router.get('/search', protect, searchUsers)

// Profile routes
router.get('/profile/:userId', protect, getUserProfile)
router.put('/profile', protect, updateProfile)
router.put('/profile-picture', protect, updateProfilePicture)
router.get('/stats', protect, getUserStats)
router.get('/activity', protect, getUserActivity)

// Wallet management
router.post('/wallet', protect, addWhitelistWallet)
router.delete('/wallet/:walletAddress', protect, removeWhitelistWallet)

// Badge routes
router.get('/:userId/badges', protect, getUserBadges)
router.get('/:userId/badges/stats', protect, getUserBadgeStats)

export default router
