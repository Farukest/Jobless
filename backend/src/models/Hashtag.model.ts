import mongoose, { Schema, Document } from 'mongoose'

export interface IHashtag extends Document {
  tag: string // Without # prefix (e.g., "crypto", "web3")
  usageCount: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const HashtagSchema = new Schema<IHashtag>(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 30,
      match: /^[a-zA-Z0-9_-]+$/, // Alphanumeric, underscore, hyphen only
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for fast search
HashtagSchema.index({ tag: 1 })
HashtagSchema.index({ usageCount: -1 })

export const Hashtag = mongoose.model<IHashtag>('Hashtag', HashtagSchema)
