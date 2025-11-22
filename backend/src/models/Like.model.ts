import mongoose, { Document, Schema } from 'mongoose'

export interface ILike extends Document {
  userId: mongoose.Types.ObjectId
  targetId: mongoose.Types.ObjectId
  targetType: 'hub_content' | 'course' | 'alpha_post' | 'comment'
  createdAt: Date
}

const LikeSchema = new Schema<ILike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['hub_content', 'course', 'alpha_post', 'comment'],
    },
  },
  {
    timestamps: true,
  }
)

// Composite unique index: A user can only like a target once
LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true })

// Index for getting all likes of a target (sorted by date)
LikeSchema.index({ targetId: 1, targetType: 1, createdAt: -1 })

// Index for getting all likes by a user (user activity feed)
LikeSchema.index({ userId: 1, createdAt: -1 })

export const Like = mongoose.model<ILike>('Like', LikeSchema)
