import passport from 'passport'
import { Strategy as TwitterStrategy } from 'passport-twitter'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2'
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt'
import { User } from '../models/User.model'
import { logger } from '../utils/logger'
import { encrypt } from '../utils/encryption'

// Twitter OAuth Strategy (optional - only if credentials are provided)
if (
  process.env.TWITTER_CLIENT_ID &&
  process.env.TWITTER_CLIENT_SECRET &&
  process.env.TWITTER_CALLBACK_URL
) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CLIENT_ID,
        consumerSecret: process.env.TWITTER_CLIENT_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL,
        includeEmail: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ twitterId: profile.id })

          if (user) {
            // Update existing user
            user.twitterUsername = profile.username
            user.twitterAccessToken = encrypt(accessToken)
            if (refreshToken) {
              user.twitterRefreshToken = encrypt(refreshToken)
            }
            user.twitterTokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            user.lastLogin = new Date()
            user.isTwitterVerified = true

            // Update profile image if available
            if (profile.photos && profile.photos.length > 0) {
              user.profileImage = profile.photos[0].value
            }

            await user.save()
            logger.info(`Existing user logged in: ${user.twitterUsername}`)
          } else {
            // Create new user
            user = await User.create({
              twitterId: profile.id,
              twitterUsername: profile.username,
              twitterAccessToken: encrypt(accessToken),
              twitterRefreshToken: refreshToken ? encrypt(refreshToken) : undefined,
              twitterTokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              displayName: profile.displayName || profile.username,
              profileImage: profile.photos?.[0]?.value,
              isTwitterVerified: true,
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

            logger.info(`New user created: ${user.twitterUsername}`)
          }

          return done(null, user)
        } catch (error) {
          logger.error('Twitter authentication error:', error)
          return done(error as Error, undefined)
        }
      }
    )
  )
  logger.info('Twitter OAuth strategy initialized')
} else {
  logger.warn('Twitter OAuth credentials not found - Twitter login disabled')
}

// GitHub OAuth Strategy (optional - only if credentials are provided)
if (
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_CALLBACK_URL
) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Get JWT token from state parameter
          const jwtToken = req.query.state
          if (!jwtToken) {
            return done(new Error('User not authenticated'), undefined)
          }

          // Verify JWT token and get user ID
          const jwt = require('jsonwebtoken')
          const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET) as { id: string }

          const user = await User.findById(decoded.id)
          if (!user) {
            return done(new Error('User not found'), undefined)
          }

          // Update GitHub social link
          user.socialLinks = user.socialLinks || {}
          user.socialLinks.github = profile.username
          await user.save()

          logger.info(`GitHub linked for user: ${user._id}`)
          return done(null, user)
        } catch (error) {
          logger.error('GitHub authentication error:', error)
          return done(error as Error, undefined)
        }
      }
    )
  )
  logger.info('GitHub OAuth strategy initialized')
} else {
  logger.warn('GitHub OAuth credentials not found - GitHub linking disabled')
}

// LinkedIn OAuth Strategy (optional - only if credentials are provided)
if (
  process.env.LINKEDIN_CLIENT_ID &&
  process.env.LINKEDIN_CLIENT_SECRET &&
  process.env.LINKEDIN_CALLBACK_URL
) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL,
        scope: ['openid', 'profile', 'email'],
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Get JWT token from state parameter
          const jwtToken = req.query.state
          if (!jwtToken) {
            return done(new Error('User not authenticated'), undefined)
          }

          // Verify JWT token and get user ID
          const jwt = require('jsonwebtoken')
          const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET) as { id: string }

          const user = await User.findById(decoded.id)
          if (!user) {
            return done(new Error('User not found'), undefined)
          }

          // Update LinkedIn social link
          user.socialLinks = user.socialLinks || {}
          user.socialLinks.linkedin = profile.id
          await user.save()

          logger.info(`LinkedIn linked for user: ${user._id}`)
          return done(null, user)
        } catch (error) {
          logger.error('LinkedIn authentication error:', error)
          return done(error as Error, undefined)
        }
      }
    )
  )
  logger.info('LinkedIn OAuth strategy initialized')
} else {
  logger.warn('LinkedIn OAuth credentials not found - LinkedIn linking disabled')
}

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
}

passport.use(
  new JWTStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id)

      if (!user) {
        return done(null, false)
      }

      if (user.status !== 'active') {
        return done(null, false)
      }

      return done(null, user)
    } catch (error) {
      return done(error, false)
    }
  })
)

export default passport
