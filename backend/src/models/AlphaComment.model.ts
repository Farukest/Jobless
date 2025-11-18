import mongoose, { Document, Schema } from 'mongoose'

export interface IAlphaComment extends Document {
  alphaPostId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId

  comment: string

  likes: number

  status: 'active' | 'deleted'
}

const AlphaCommentSchema = new Schema<IAlphaComment>(
  {
    alphaPostId: {
      type: Schema.Types.ObjectId,
      ref: 'AlphaPost',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
AlphaCommentSchema.index({ alphaPostId: 1, createdAt: -1 })
AlphaCommentSchema.index({ userId: 1, createdAt: -1 })
AlphaCommentSchema.index({ status: 1 })

export const AlphaComment = mongoose.model<IAlphaComment>('AlphaComment', AlphaCommentSchema)
