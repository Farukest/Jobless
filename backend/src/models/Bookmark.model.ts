import mongoose, { Document, Schema } from 'mongoose'

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId
  targetId: mongoose.Types.ObjectId
  targetType: 'hub_content' | 'course' | 'alpha_post'
  createdAt: Date
}

const BookmarkSchema = new Schema<IBookmark>(
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
      enum: ['hub_content', 'course', 'alpha_post'],
    },
  },
  {
    timestamps: true,
  }
)

// Composite unique index: A user can only bookmark a target once
BookmarkSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true })

// Index for getting all bookmarks by a user (sorted by date)
BookmarkSchema.index({ userId: 1, createdAt: -1 })

export const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema)
