import mongoose, { Document, Schema } from 'mongoose'

export interface IUserBadge extends Document {
  userId: mongoose.Types.ObjectId
  badgeId: mongoose.Types.ObjectId

  // Earn Info
  earnedAt: Date
  earnedFrom?: string // 'role_assignment', 'content_milestone', 'manual', 'system'

  // Display Settings
  isPinned: boolean // User can pin max 3 badges to show on profile
  pinnedAt?: Date
  pinnedOrder?: number // Order of pinned badges (1, 2, 3)

  // Metadata
  metadata?: {
    relatedContentId?: mongoose.Types.ObjectId
    relatedAction?: string
    progressAtEarn?: number
    manualNote?: string // If awarded manually by admin
  }

  // Visibility
  isVisible: boolean // User can hide badges they don't want to show

  createdAt: Date
  updatedAt: Date
}

const UserBadgeSchema = new Schema<IUserBadge>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeId: {
    type: Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },

  earnedAt: {
    type: Date,
    default: Date.now
  },
  earnedFrom: {
    type: String,
    enum: ['role_assignment', 'content_milestone', 'manual', 'system'],
    default: 'system'
  },

  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: Date,
  pinnedOrder: {
    type: Number,
    min: 1,
    max: 3
  },

  metadata: {
    relatedContentId: Schema.Types.ObjectId,
    relatedAction: String,
    progressAtEarn: Number,
    manualNote: String
  },

  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Compound index: user can only have one instance of each badge
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true })
UserBadgeSchema.index({ userId: 1, isPinned: 1 })
UserBadgeSchema.index({ userId: 1, isVisible: 1 })
UserBadgeSchema.index({ userId: 1, earnedAt: -1 })
UserBadgeSchema.index({ badgeId: 1 })

// Middleware to manage pinned order
UserBadgeSchema.pre('save', async function (next) {
  if (this.isPinned && !this.pinnedOrder) {
    // Find the next available pin order
    const pinnedBadges = await mongoose.model('UserBadge').find({
      userId: this.userId,
      isPinned: true,
      _id: { $ne: this._id }
    }).sort({ pinnedOrder: 1 })

    // Find first available slot (1, 2, or 3)
    const usedOrders = pinnedBadges.map(b => b.pinnedOrder).filter(Boolean)
    for (let i = 1; i <= 3; i++) {
      if (!usedOrders.includes(i)) {
        this.pinnedOrder = i
        break
      }
    }

    if (!this.pinnedOrder) {
      return next(new Error('Maximum 3 badges can be pinned'))
    }

    this.pinnedAt = new Date()
  }

  if (!this.isPinned) {
    this.pinnedOrder = undefined
    this.pinnedAt = undefined
  }

  next()
})

export const UserBadge = mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema)
