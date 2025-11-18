import mongoose, { Document, Schema } from 'mongoose'

export interface IContent extends Document {
  authorId: mongoose.Types.ObjectId
  title: string
  description?: string
  contentType: 'video' | 'thread' | 'podcast' | 'guide' | 'tutorial'

  body?: string
  mediaUrls: Array<{
    type: 'image' | 'video' | 'audio' | 'document'
    url: string
    thumbnail?: string
    duration?: number
    size?: number
  }>

  tags: string[]
  category: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'

  views: number
  likes: number
  bookmarks: number

  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date

  moderatedBy?: mongoose.Types.ObjectId
  moderatedAt?: Date
  moderationNotes?: string

  isFeatured: boolean
  isPinned: boolean
}

const ContentSchema = new Schema<IContent>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['video', 'thread', 'podcast', 'guide', 'tutorial'],
    },
    body: {
      type: String,
      trim: true,
    },
    mediaUrls: [
      {
        type: {
          type: String,
          enum: ['image', 'video', 'audio', 'document'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: String,
        duration: Number,
        size: Number,
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
      enum: ['airdrop', 'defi', 'nft', 'node', 'trading', 'tutorial', 'guide', 'news', 'other'],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    bookmarks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: Date,
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: Date,
    moderationNotes: String,
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
ContentSchema.index({ authorId: 1, status: 1 })
ContentSchema.index({ status: 1, publishedAt: -1 })
ContentSchema.index({ category: 1, status: 1 })
ContentSchema.index({ tags: 1 })
ContentSchema.index({ isFeatured: 1, isPinned: 1 })

// Middleware to set publishedAt when status changes to published
ContentSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  next()
})

export const Content = mongoose.model<IContent>('Content', ContentSchema)
