import { Request, Response, NextFunction } from 'express'
import { User } from '../models/User.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { logger } from '../utils/logger'
import { ethers } from 'ethers'

/**
 * @desc    Twitter OAuth callback
 * @route   GET /api/auth/twitter/callback
 * @access  Public
 */
export const twitterCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as any

  if (!user) {
    throw new AppError('Authentication failed', 401)
  }

  const accessToken = generateAccessToken(user._id.toString())
  const refreshToken = generateRefreshToken(user._id.toString())

  // Redirect to frontend with tokens
  const frontendURL = process.env.APP_URL || 'http://localhost:3000'
  res.redirect(
    `${frontendURL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
  )
})

/**
 * @desc    Verify wallet signature and connect wallet
 * @route   POST /api/auth/wallet/connect
 * @access  Public
 */
export const connectWallet = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { walletAddress, signature, message } = req.body

    if (!walletAddress || !signature || !message) {
      throw new AppError('Missing required fields', 400)
    }

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new AppError('Invalid signature', 401)
      }
    } catch (error) {
      throw new AppError('Signature verification failed', 401)
    }

    // Check if wallet is already connected to another user
    const existingUser = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    })

    if (existingUser) {
      // User exists, log them in
      const accessToken = generateAccessToken((existingUser._id as any).toString())
      const refreshToken = generateRefreshToken((existingUser._id as any).toString())

      return res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        user: existingUser,
      })
    }

    // Create new user with wallet
    const user = await User.create({
      walletAddress: walletAddress.toLowerCase(),
      walletConnectedAt: new Date(),
      isWalletVerified: true,
      status: 'active',
      roles: ['member'],
      permissions: {
        canAccessJHub: true,
        canAccessJStudio: true,
        canAccessJAcademy: true,
        canAccessJInfo: true,
        canAccessJAlpha: true,
        canCreateContent: false,
        canModerateContent: false,
        canManageUsers: false,
        canManageRoles: false,
        canManageSiteSettings: false,
        customPermissions: [],
      },
    })

    const accessToken = generateAccessToken((user._id as any).toString())
    const refreshToken = generateRefreshToken((user._id as any).toString())

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user,
    })
  }
)

/**
 * @desc    Link wallet to existing authenticated user
 * @route   POST /api/auth/wallet/verify
 * @access  Private
 */
export const verifyWallet = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { walletAddress, signature, message } = req.body
    const userId = (req as any).user._id

    if (!walletAddress || !signature || !message) {
      throw new AppError('Missing required fields', 400)
    }

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new AppError('Invalid signature', 401)
      }
    } catch (error) {
      throw new AppError('Signature verification failed', 401)
    }

    // Check if wallet is already connected to another user
    const existingUser = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
      _id: { $ne: userId },
    })

    if (existingUser) {
      throw new AppError('Wallet is already connected to another account', 400)
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        walletAddress: walletAddress.toLowerCase(),
        walletConnectedAt: new Date(),
        isWalletVerified: true,
      },
      { new: true }
    )

    res.status(200).json({
      success: true,
      user,
    })
  }
)

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400)
    }

    try {
      const decoded = verifyRefreshToken(refreshToken)

      const user = await User.findById(decoded.id)

      if (!user || user.status !== 'active') {
        throw new AppError('Invalid refresh token', 401)
      }

      const newAccessToken = generateAccessToken((user._id as any).toString())
      const newRefreshToken = generateRefreshToken((user._id as any).toString())

      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      })
    } catch (error) {
      throw new AppError('Invalid refresh token', 401)
    }
  }
)

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user

  res.status(200).json({
    success: true,
    user,
  })
})

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})
