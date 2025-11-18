import mongoose, { Document, Schema } from 'mongoose'

export interface IEngagementPost extends Document {
  submitterId: mongoose.Types.ObjectId

  platform: 'twitter' | 'farcaster'
  postUrl: string
  postType: string

  campaignName: string
  engagementType: string
  requiredActions: string[]

  description?: string

  submittedAt: Date
  engagementCount: number
  participants: Array<{
    userId: mongoose.Types.ObjectId
    proofUrl: string
    engagedAt: Date
    pointsEarned: number
  }>

  status: 'active' | 'completed' | 'expired'
  expiresAt?: Date

  isVerified: boolean
  verifiedBy?: mongoose.Types.ObjectId
}

const EngagementPostSchema = new Schema<IEngagementPost>(
  {
    submitterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['twitter', 'farcaster'],
    },
    postUrl: {
      type: String,
      required: true,
    },
    postType: {
      type: String,
      default: 'tweet',
    },
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    engagementType: {
      type: String,
      required: true,
    },
    requiredActions: {
      type: [String],
      required: true,
    },
    description: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    engagementCount: {
      type: Number,
      default: 0,
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        proofUrl: String,
        engagedAt: {
          type: Date,
          default: Date.now,
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
    },
    expiresAt: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
EngagementPostSchema.index({ submitterId: 1, status: 1 })
EngagementPostSchema.index({ status: 1, createdAt: -1 })
EngagementPostSchema.index({ expiresAt: 1 })

export const EngagementPost = mongoose.model<IEngagementPost>('EngagementPost', EngagementPostSchema)
