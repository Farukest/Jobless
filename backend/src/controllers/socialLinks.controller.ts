import { Request, Response } from 'express'
import { User } from '../models/User.model'
import { AuthRequest } from '../middleware/auth.middleware'

// Link social account (LinkedIn, GitHub)
export const linkSocialAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { platform, username } = req.body
    const userId = req.user!._id

    if (!['twitter', 'linkedin', 'github'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform. Only twitter, linkedin and github are allowed.' })
    }

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'Username is required' })
    }

    // Check if username is already used by another user
    const existingUser = await User.findOne({
      [`socialLinks.${platform}`]: username,
      _id: { $ne: userId }
    })

    if (existingUser) {
      return res.status(409).json({ message: `This ${platform} account is already linked to another user` })
    }

    // Update user's social link
    const user = await User.findByIdAndUpdate(
      userId,
      { [`socialLinks.${platform}`]: username },
      { new: true }
    ).select('-twitterAccessToken -twitterRefreshToken')

    res.json({
      message: `${platform} account linked successfully`,
      user
    })
  } catch (error) {
    console.error('Link social account error:', error)
    res.status(500).json({ message: 'Failed to link social account' })
  }
}

// Unlink social account
export const unlinkSocialAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params
    const userId = req.user!._id

    if (!['twitter', 'linkedin', 'github'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform. Only twitter, linkedin and github can be unlinked.' })
    }

    // Update user's social link
    const user = await User.findByIdAndUpdate(
      userId,
      { [`socialLinks.${platform}`]: null },
      { new: true }
    ).select('-twitterAccessToken -twitterRefreshToken')

    res.json({
      message: `${platform} account unlinked successfully`,
      user
    })
  } catch (error) {
    console.error('Unlink social account error:', error)
    res.status(500).json({ message: 'Failed to unlink social account' })
  }
}

// Unlink Twitter auth (only if wallet is connected)
export const unlinkTwitterAuth = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if wallet is connected
    if (!user.walletAddress) {
      return res.status(400).json({
        message: 'Cannot disconnect Twitter. You must have at least one authentication method (wallet or Twitter).'
      })
    }

    // Remove Twitter authentication
    user.twitterId = undefined
    user.twitterUsername = undefined
    user.twitterAccessToken = undefined
    user.twitterRefreshToken = undefined
    user.twitterTokenExpiry = undefined
    user.isTwitterVerified = false

    // Keep Twitter social link if user wants (don't auto-remove)
    // User can manually unlink via unlinkSocialAccount

    await user.save()

    res.json({
      message: 'Twitter authentication disconnected successfully',
      user: {
        ...user.toObject(),
        twitterAccessToken: undefined,
        twitterRefreshToken: undefined
      }
    })
  } catch (error: any) {
    console.error('Unlink Twitter auth error:', error)

    if (error.message?.includes('at least one authentication method')) {
      return res.status(400).json({ message: error.message })
    }

    res.status(500).json({ message: 'Failed to disconnect Twitter' })
  }
}

// Disconnect wallet (only if Twitter is connected)
export const disconnectWallet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if Twitter is connected
    if (!user.twitterId) {
      return res.status(400).json({
        message: 'Cannot disconnect wallet. You must have at least one authentication method (wallet or Twitter).'
      })
    }

    // Remove wallet
    user.walletAddress = undefined
    user.walletChainId = undefined
    user.walletConnectedAt = undefined
    user.isWalletVerified = false

    await user.save()

    res.json({
      message: 'Wallet disconnected successfully',
      user
    })
  } catch (error: any) {
    console.error('Disconnect wallet error:', error)

    if (error.message?.includes('at least one authentication method')) {
      return res.status(400).json({ message: error.message })
    }

    res.status(500).json({ message: 'Failed to disconnect wallet' })
  }
}
