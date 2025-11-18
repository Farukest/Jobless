import mongoose, { Document, Schema } from 'mongoose'

export interface IProductionRequest extends Document {
  requesterId: mongoose.Types.ObjectId
  requestType: string
  platform?: string

  title: string
  description: string
  requirements?: string

  referenceFiles: Array<{
    url: string
    type: string
    name: string
  }>

  assignedTo?: mongoose.Types.ObjectId
  assignedAt?: Date

  proposalDescription?: string
  proposalDeadline?: Date
  proposalSubmittedAt?: Date

  deliveryFiles: Array<{
    url: string
    type: string
    name: string
    version: number
  }>
  deliveredAt?: Date

  feedback?: string
  rating?: number

  status: 'pending' | 'proposal_sent' | 'in_progress' | 'delivered' | 'completed' | 'cancelled'

  pointsAwarded: number
}

const ProductionRequestSchema = new Schema<IProductionRequest>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      required: true,
      enum: ['cover_design', 'video_edit', 'logo_design', 'animation', 'banner_design', 'thumbnail', 'other'],
    },
    platform: {
      type: String,
      enum: ['twitter', 'farcaster', 'youtube', 'instagram', 'other'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: String,
    referenceFiles: [
      {
        url: String,
        type: String,
        name: String,
      },
    ],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: Date,
    proposalDescription: String,
    proposalDeadline: Date,
    proposalSubmittedAt: Date,
    deliveryFiles: [
      {
        url: String,
        type: String,
        name: String,
        version: { type: Number, default: 1 },
      },
    ],
    deliveredAt: Date,
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ['pending', 'proposal_sent', 'in_progress', 'delivered', 'completed', 'cancelled'],
      default: 'pending',
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
ProductionRequestSchema.index({ requesterId: 1, status: 1 })
ProductionRequestSchema.index({ assignedTo: 1, status: 1 })
ProductionRequestSchema.index({ status: 1, createdAt: -1 })

export const ProductionRequest = mongoose.model<IProductionRequest>('ProductionRequest', ProductionRequestSchema)
