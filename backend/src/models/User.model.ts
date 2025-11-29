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

  // Permissions (merged from roles)
  permissions: {
    hub: {
      canAccess: boolean
      canCreate: boolean
      canModerate: boolean
      allowedContentTypes: string[]
    }
    studio: {
      canAccess: boolean
      canCreateRequest: boolean
      canClaimRequest: boolean
      allowedRequestTypes: string[]
    }
    academy: {
      canAccess: boolean
      canEnroll: boolean
      canTeach: boolean
      canCreateCourseRequest: boolean
      allowedCourseCategories: string[]
    }
    info: {
      canAccess: boolean
      canSubmitEngagement: boolean
      allowedPlatforms: string[]
      allowedEngagementTypes: string[]
    }
    alpha: {
      canAccess: boolean
      canSubmitAlpha: boolean
      canModerate: boolean
      allowedAlphaCategories: string[]
    }
    admin: {
      canManageUsers: boolean
      canManageRoles: boolean
      canManageSiteSettings: boolean
      canModerateAllContent: boolean
    }
  }

  // Permission Overrides (user-specific overrides)
  permissionOverrides?: {
    hub?: {
      canCreate?: boolean
      canModerate?: boolean
      allowedContentTypes?: string[]
    }
    studio?: {
      canCreateRequest?: boolean
      canClaimRequest?: boolean
      allowedRequestTypes?: string[]
    }
    academy?: {
      canEnroll?: boolean
      canTeach?: boolean
      canCreateCourseRequest?: boolean
      allowedCourseCategories?: string[]
    }
    info?: {
      canSubmitEngagement?: boolean
      allowedPlatforms?: string[]
      allowedEngagementTypes?: string[]
    }
    alpha?: {
      canSubmitAlpha?: boolean
      canModerate?: boolean
      allowedAlphaCategories?: string[]
    }
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
      default: [],
    },

    // Permissions (merged from roles)
    permissions: {
      hub: {
        canAccess: { type: Boolean, default: true },
        canCreate: { type: Boolean, default: false },
        canModerate: { type: Boolean, default: false },
        allowedContentTypes: { type: [String], default: [] },
      },
      studio: {
        canAccess: { type: Boolean, default: true },
        canCreateRequest: { type: Boolean, default: false },
        canClaimRequest: { type: Boolean, default: false },
        allowedRequestTypes: { type: [String], default: [] },
      },
      academy: {
        canAccess: { type: Boolean, default: true },
        canEnroll: { type: Boolean, default: false },
        canTeach: { type: Boolean, default: false },
        canCreateCourseRequest: { type: Boolean, default: false },
        allowedCourseCategories: { type: [String], default: [] },
      },
      info: {
        canAccess: { type: Boolean, default: true },
        canSubmitEngagement: { type: Boolean, default: false },
        allowedPlatforms: { type: [String], default: [] },
        allowedEngagementTypes: { type: [String], default: [] },
      },
      alpha: {
        canAccess: { type: Boolean, default: true },
        canSubmitAlpha: { type: Boolean, default: false },
        canModerate: { type: Boolean, default: false },
        allowedAlphaCategories: { type: [String], default: [] },
      },
      admin: {
        canManageUsers: { type: Boolean, default: false },
        canManageRoles: { type: Boolean, default: false },
        canManageSiteSettings: { type: Boolean, default: false },
        canModerateAllContent: { type: Boolean, default: false },
      },
    },

    // Permission Overrides (user-specific)
    permissionOverrides: {
      hub: {
        canCreate: { type: Boolean, required: false },
        canModerate: { type: Boolean, required: false },
        allowedContentTypes: { type: [String], required: false },
      },
      studio: {
        canCreateRequest: { type: Boolean, required: false },
        canClaimRequest: { type: Boolean, required: false },
        allowedRequestTypes: { type: [String], required: false },
      },
      academy: {
        canEnroll: { type: Boolean, required: false },
        canTeach: { type: Boolean, required: false },
        canCreateCourseRequest: { type: Boolean, required: false },
        allowedCourseCategories: { type: [String], required: false },
      },
      info: {
        canSubmitEngagement: { type: Boolean, required: false },
        allowedPlatforms: { type: [String], required: false },
        allowedEngagementTypes: { type: [String], required: false },
      },
      alpha: {
        canSubmitAlpha: { type: Boolean, required: false },
        canModerate: { type: Boolean, required: false },
        allowedAlphaCategories: { type: [String], required: false },
      },
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
