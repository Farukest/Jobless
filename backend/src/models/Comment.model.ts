import mongoose, { Document, Schema } from 'mongoose'

export interface IComment extends Document {
  userId: mongoose.Types.ObjectId
  contentType: 'hub_content' | 'alpha_post' | 'course' | 'engagement_post'
  contentId: mongoose.Types.ObjectId
  content: string
  parentCommentId?: mongoose.Types.ObjectId
  likes: number
  likedBy: mongoose.Types.ObjectId[]
  repliesCount: number
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['hub_content', 'alpha_post', 'course', 'engagement_post'],
      index: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      index: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes
CommentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 })
CommentSchema.index({ userId: 1, createdAt: -1 })
CommentSchema.index({ parentCommentId: 1 })

export const Comment = mongoose.model<IComment>('Comment', CommentSchema)
