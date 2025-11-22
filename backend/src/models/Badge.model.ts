import mongoose, { Document, Schema } from 'mongoose'

export interface IBadge extends Document {
  // Badge Info
  name: string // "first_post", "super_admin", "viral_creator"
  displayName: string // "First Content Creator"
  description: string

  // Visual
  iconName: string // SVG component name: "RookieBadge", "SuperAdminBadge"
  color: string // Hex color
  gradientStart?: string // Optional gradient start color
  gradientEnd?: string // Optional gradient end color
  animationType: 'pulse' | 'glow' | 'shimmer' | 'sparkle' | 'wave' | 'bounce' | 'rotate' | 'flash' | 'flip' | 'scan' | 'divine' | 'float'

  // Badge Type
  type: 'role' | 'activity' | 'achievement' | 'special'
  category: 'hub' | 'studio' | 'academy' | 'alpha' | 'info' | 'general' | 'admin'

  // Criteria (for activity badges)
  criteria?: {
    type: 'content_count' | 'like_count' | 'engagement_count' | 'course_count' | 'enrollment_count' | 'completion_count' | 'alpha_count' | 'comment_count' | 'jrank_points' | 'contribution_score' | 'time_based' | 'request_count' | 'rating_avg' | 'rating_count' | 'vote_count' | 'bullish_count' | 'days_active' | 'streak_days' | 'user_id_threshold'
    target: number // e.g., 10 for "10+ contents"
    operator?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt' // Greater than or equal, etc.
    contentType?: string // For specific content types
    module?: 'hub' | 'studio' | 'academy' | 'alpha' | 'info'
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'
    additionalCriteria?: any // For complex criteria like "AND 5000 likes"
  }

  // Role-based (if type === 'role')
  requiredRoles?: string[] // ['super_admin'], ['mentor', 'admin']

  // Rarity
  rarity: 'common' | 'rare' | 'epic' | 'legendary'

  // Display Settings
  isActive: boolean
  order: number // Display order within category

  // Metadata
  tier?: 'entry' | 'progress' | 'mastery' | 'elite' | 'legendary' | 'special'

  createdAt: Date
  updatedAt: Date
  createdBy?: mongoose.Types.ObjectId // Admin who created
}

const BadgeSchema = new Schema<IBadge>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
    lowercase: true // Store as lowercase for consistency
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },

  iconName: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i
  },
  gradientStart: {
    type: String,
    match: /^#[0-9A-F]{6}$/i
  },
  gradientEnd: {
    type: String,
    match: /^#[0-9A-F]{6}$/i
  },
  animationType: {
    type: String,
    enum: ['pulse', 'glow', 'shimmer', 'sparkle', 'wave', 'bounce', 'rotate', 'flash', 'flip', 'scan', 'divine', 'float'],
    default: 'pulse'
  },

  type: {
    type: String,
    enum: ['role', 'activity', 'achievement', 'special'],
    required: true
  },
  category: {
    type: String,
    enum: ['hub', 'studio', 'academy', 'alpha', 'info', 'general', 'admin'],
    required: true
  },

  criteria: {
    type: {
      type: String,
      enum: [
        'content_count', 'like_count', 'engagement_count', 'course_count',
        'enrollment_count', 'completion_count', 'alpha_count', 'comment_count',
        'jrank_points', 'contribution_score', 'time_based', 'request_count',
        'rating_avg', 'rating_count', 'vote_count', 'bullish_count',
        'days_active', 'streak_days', 'user_id_threshold'
      ]
    },
    target: Number,
    operator: {
      type: String,
      enum: ['gte', 'lte', 'eq', 'gt', 'lt'],
      default: 'gte'
    },
    contentType: String,
    module: {
      type: String,
      enum: ['hub', 'studio', 'academy', 'alpha', 'info']
    },
    timeframe: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'],
      default: 'all_time'
    },
    additionalCriteria: Schema.Types.Mixed
  },

  requiredRoles: [String],

  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },

  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },

  tier: {
    type: String,
    enum: ['entry', 'progress', 'mastery', 'elite', 'legendary', 'special']
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Indexes
BadgeSchema.index({ name: 1 })
BadgeSchema.index({ type: 1, category: 1 })
BadgeSchema.index({ isActive: 1 })
BadgeSchema.index({ rarity: 1 })
BadgeSchema.index({ tier: 1 })

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema)
