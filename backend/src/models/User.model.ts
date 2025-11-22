import mongoose, { Document, Schema } from 'mongoose'
import { encrypt, decrypt } from '../utils/encryption'

export interface IUser extends Document {
  // Authentication (for login - at least one required)
  twitterId?: string
  twitterUsername?: string
  twitterAccessToken?: string
  twitterRefreshToken?: string
  twitterTokenExpiry?: Date

  walletAddress?: string
  walletChainId?: number
  walletConnectedAt?: Date
  whitelistWallets: string[]

  // Profile
  profileImage?: string
  displayName?: string
  bio?: string
  joinedAt: Date
  lastLogin?: Date

  // Social Links (for profile display - optional, unique)
  socialLinks: {
    twitter?: string  // If auth via Twitter, auto-filled
    linkedin?: string
    github?: string
  }

  // Roles (references to Role model)
  roles: mongoose.Types.ObjectId[]

  // Content Type Overrides (optional - overrides role's allowedContentTypes)
  contentTypeOverrides?: string[]

  // Permissions
  permissions: {
    canAccessJHub: boolean
    canAccessJStudio: boolean
    canAccessJAcademy: boolean
    canAccessJInfo: boolean
    canAccessJAlpha: boolean
    canCreateContent: boolean
    canModerateContent: boolean
    canManageUsers: boolean
    canManageRoles: boolean
    canManageSiteSettings: boolean
    customPermissions: string[]
  }

  // Stats
  jRankPoints: number
  contributionScore: number
  contentCreated: number
  interactionsGiven: number
  totalPoints: number // J Info engagement points

  // Twitter metadata (for J Info)
  twitterMetadata?: {
    followersCount: number
    followingCount: number
    tweetCount: number
    lastSyncedAt: Date
  }

  // Settings
  theme: 'light' | 'dark'
  emailNotifications: boolean

  status: 'active' | 'suspended' | 'banned'
  isEmailVerified: boolean
  isTwitterVerified: boolean
  isWalletVerified: boolean
}

const UserSchema = new Schema<IUser>(
  {
    // Authentication
    twitterId: {
      type: String,
      sparse: true,
    },
    twitterUsername: {
      type: String,
      sparse: true,
    },
    twitterAccessToken: {
      type: String,
      select: false, // Don't include in queries by default
      set: (value: string) => (value ? encrypt(value) : value),
      get: (value: string) => (value ? decrypt(value) : value),
    },
    twitterRefreshToken: {
      type: String,
      select: false,
      set: (value: string) => (value ? encrypt(value) : value),
      get: (value: string) => (value ? decrypt(value) : value),
    },
    twitterTokenExpiry: Date,

    walletAddress: {
      type: String,
      sparse: true,
      lowercase: true,
    },
    walletChainId: Number,
    walletConnectedAt: Date,
    whitelistWallets: {
      type: [String],
      default: [],
    },

    // Profile
    profileImage: String,
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: Date,

    // Social Links (for profile display)
    socialLinks: {
      twitter: { type: String, sparse: true },
      linkedin: { type: String, sparse: true },
      github: { type: String, sparse: true },
    },

    // Roles
    roles: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
      default: [], // Will be populated via migration or on first login
    },

    // Content Type Overrides (optional)
    contentTypeOverrides: {
      type: [String],
      default: undefined, // undefined means use role's allowedContentTypes
    },

    // Permissions
    permissions: {
      canAccessJHub: { type: Boolean, default: true },
      canAccessJStudio: { type: Boolean, default: true },
      canAccessJAcademy: { type: Boolean, default: true },
      canAccessJInfo: { type: Boolean, default: true },
      canAccessJAlpha: { type: Boolean, default: true },
      canCreateContent: { type: Boolean, default: false },
      canModerateContent: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canManageRoles: { type: Boolean, default: false },
      canManageSiteSettings: { type: Boolean, default: false },
      customPermissions: { type: [String], default: [] },
    },

    // Stats
    jRankPoints: { type: Number, default: 0 },
    contributionScore: { type: Number, default: 0 },
    contentCreated: { type: Number, default: 0 },
    interactionsGiven: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },

    // Twitter metadata
    twitterMetadata: {
      followersCount: Number,
      followingCount: Number,
      tweetCount: Number,
      lastSyncedAt: Date,
    },

    // Settings
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
    emailNotifications: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    isEmailVerified: { type: Boolean, default: false },
    isTwitterVerified: { type: Boolean, default: false },
    isWalletVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
)

// Indexes
UserSchema.index({ twitterId: 1 }, { unique: true, sparse: true })
UserSchema.index({ walletAddress: 1 }, { unique: true, sparse: true })
UserSchema.index({ 'socialLinks.twitter': 1 }, { unique: true, sparse: true })
UserSchema.index({ 'socialLinks.linkedin': 1 }, { unique: true, sparse: true })
UserSchema.index({ 'socialLinks.github': 1 }, { unique: true, sparse: true })
UserSchema.index({ roles: 1 })
UserSchema.index({ status: 1 })

// Middleware to validate at least one auth method
UserSchema.pre('save', function (next) {
  if (this.isNew) {
    this.lastLogin = new Date()
  }

  // User must have at least one authentication method
  const hasWallet = !!this.walletAddress
  const hasTwitter = !!this.twitterId

  if (!hasWallet && !hasTwitter) {
    return next(new Error('User must have at least one authentication method (wallet or Twitter)'))
  }

  // Auto-fill social link if authenticated via Twitter
  if (this.twitterId && this.twitterUsername && !this.socialLinks) {
    this.socialLinks = { twitter: this.twitterUsername }
  } else if (this.twitterId && this.twitterUsername && this.socialLinks && !this.socialLinks.twitter) {
    this.socialLinks.twitter = this.twitterUsername
  }

  next()
})

// Middleware to sync Twitter social link
UserSchema.pre('save', function (next) {
  // If Twitter auth is connected, ensure social link is set
  if (this.twitterId && this.twitterUsername) {
    if (!this.socialLinks) {
      this.socialLinks = {}
    }
    this.socialLinks.twitter = this.twitterUsername
  }
  next()
})

// Note: Role sorting will be handled by populating roles and sorting on the frontend
// since roles are now ObjectIds that need to be populated to access their hierarchy

export const User = mongoose.model<IUser>('User', UserSchema)
