import { Router } from 'express'
import passport from '../config/passport'
import { protect } from '../middleware/auth.middleware'
import {
  twitterCallback,
  connectWallet,
  verifyWallet,
  refreshAccessToken,
  getCurrentUser,
  logout,
} from '../controllers/auth.controller'

const router = Router()

// Twitter OAuth routes
router.get('/twitter', passport.authenticate('twitter'))

router.get(
  '/twitter/callback',
  passport.authenticate('twitter', {
    session: false,
    failureRedirect: `${process.env.APP_URL}/login?error=twitter_auth_failed`,
  }),
  twitterCallback
)

// GitHub OAuth routes (for social linking)
router.get('/github', (req, res, next) => {
  // Store JWT token in state parameter for retrieval after OAuth
  const token = req.query.token as string
  if (!token) {
    return res.redirect(`${process.env.APP_URL}/center/profile?error=missing_token`)
  }

  // Pass state to OAuth provider
  passport.authenticate('github', {
    scope: ['user:email'],
    state: token
  })(req, res, next)
})

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${process.env.APP_URL}/center/profile?error=github_link_failed`,
  }),
  (req, res) => {
    // Redirect back to profile with success
    res.redirect(`${process.env.APP_URL}/center/profile?success=github_linked`)
  }
)

// LinkedIn OAuth routes (for social linking)
router.get('/linkedin', (req, res, next) => {
  // Store JWT token in state parameter for retrieval after OAuth
  const token = req.query.token as string
  if (!token) {
    return res.redirect(`${process.env.APP_URL}/center/profile?error=missing_token`)
  }

  // Pass state to OAuth provider
  passport.authenticate('linkedin', {
    scope: ['openid', 'profile', 'email'],
    state: token
  })(req, res, next)
})

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', {
    session: false,
    failureRedirect: `${process.env.APP_URL}/center/profile?error=linkedin_link_failed`,
  }),
  (req, res) => {
    // Redirect back to profile with success
    res.redirect(`${process.env.APP_URL}/center/profile?success=linkedin_linked`)
  }
)

// Wallet connection routes
router.post('/wallet/connect', connectWallet)
router.post('/wallet/verify', protect, verifyWallet)

// Token refresh
router.post('/refresh', refreshAccessToken)

// Get current user
router.get('/me', protect, getCurrentUser)

// Logout
router.post('/logout', protect, logout)

export default router
