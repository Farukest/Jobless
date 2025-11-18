import mongoose, { Document, Schema } from 'mongoose'

export interface IContentComment extends Document {
  contentId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId

  comment: string
  parentCommentId?: mongoose.Types.ObjectId

  likes: number

  status: 'active' | 'deleted' | 'moderated'
}

const ContentCommentSchema = new Schema<IContentComment>(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
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
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentComment',
      default: null,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'deleted', 'moderated'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
ContentCommentSchema.index({ contentId: 1, createdAt: -1 })
ContentCommentSchema.index({ userId: 1, createdAt: -1 })
ContentCommentSchema.index({ parentCommentId: 1 })
ContentCommentSchema.index({ status: 1 })

export const ContentComment = mongoose.model<IContentComment>('ContentComment', ContentCommentSchema)
