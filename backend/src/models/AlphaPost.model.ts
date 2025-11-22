import mongoose, { Document, Schema } from 'mongoose'

export interface IAlphaPost extends Document {
  scoutId: mongoose.Types.ObjectId

  category: 'airdrop_radar' | 'testnet_tracker' | 'memecoin_calls' | 'defi_signals'

  projectName: string
  projectDescription: string
  blockchain: string

  potentialRating: 'low' | 'medium' | 'high' | 'very_high'
  riskRating: 'low' | 'medium' | 'high'

  details: string
  requirements?: string
  deadline?: Date

  links: Array<{
    type: 'website' | 'twitter' | 'discord' | 'docs' | 'telegram'
    url: string
  }>

  viewsCount: number
  likesCount: number

  bullishVotes: number
  bearishVotes: number
  voters: Array<{
    userId: mongoose.Types.ObjectId
    vote: 'bullish' | 'bearish'
    votedAt: Date
  }>

  commentsCount: number

  status: 'pending' | 'published' | 'validated' | 'rejected' | 'archived'
  validatedAt?: Date
  validatedBy?: mongoose.Types.ObjectId

  outcome?: 'success' | 'failure' | 'ongoing'
  outcomeNotes?: string

  tags: string[]
}

const AlphaPostSchema = new Schema<IAlphaPost>(
  {
    scoutId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['airdrop_radar', 'testnet_tracker', 'memecoin_calls', 'defi_signals'],
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    projectDescription: {
      type: String,
      required: true,
      trim: true,
    },
    blockchain: {
      type: String,
      required: true,
    },
    potentialRating: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'very_high'],
    },
    riskRating: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
    },
    details: {
      type: String,
      required: true,
    },
    requirements: String,
    deadline: Date,
    links: [
      {
        type: {
          type: String,
          enum: ['website', 'twitter', 'discord', 'docs', 'telegram'],
        },
        url: String,
      },
    ],
    viewsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    bullishVotes: {
      type: Number,
      default: 0,
    },
    bearishVotes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        vote: {
          type: String,
          enum: ['bullish', 'bearish'],
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'validated', 'rejected', 'archived'],
      default: 'pending',
    },
    validatedAt: Date,
    validatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    outcome: {
      type: String,
      enum: ['success', 'failure', 'ongoing'],
    },
    outcomeNotes: String,
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
AlphaPostSchema.index({ scoutId: 1, status: 1 })
AlphaPostSchema.index({ status: 1, createdAt: -1 })
AlphaPostSchema.index({ category: 1, status: 1 })
AlphaPostSchema.index({ blockchain: 1 })
AlphaPostSchema.index({ tags: 1 })

export const AlphaPost = mongoose.model<IAlphaPost>('AlphaPost', AlphaPostSchema)
