import mongoose, { Document, Schema } from 'mongoose'

export interface IUserEngagement extends Document {
  userId: mongoose.Types.ObjectId
  engagementPostId: mongoose.Types.ObjectId

  proofUrl: string
  screenshot?: string

  engagedAt: Date
  verifiedAt?: Date

  pointsEarned: number

  status: 'pending' | 'verified' | 'rejected'
}

const UserEngagementSchema = new Schema<IUserEngagement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    engagementPostId: {
      type: Schema.Types.ObjectId,
      ref: 'EngagementPost',
      required: true,
      index: true,
    },
    proofUrl: {
      type: String,
      required: true,
    },
    screenshot: {
      type: String,
    },
    engagedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: Date,
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
UserEngagementSchema.index({ userId: 1, engagementPostId: 1 }, { unique: true })
UserEngagementSchema.index({ userId: 1, status: 1 })
UserEngagementSchema.index({ engagementPostId: 1, status: 1 })
UserEngagementSchema.index({ status: 1, createdAt: -1 })

export const UserEngagement = mongoose.model<IUserEngagement>('UserEngagement', UserEngagementSchema)
