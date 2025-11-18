import mongoose, { Document, Schema } from 'mongoose'

export interface IStudioMember extends Document {
  userId: mongoose.Types.ObjectId

  specialty: 'graphic_designer' | 'video_editor' | 'animator' | '3d_artist' | 'other'
  skills: string[]

  portfolio: Array<{
    title: string
    description?: string
    mediaUrl: string
    projectDate?: Date
  }>

  // Stats
  requestsCompleted: number
  averageRating: number
  totalPointsEarned: number

  availability: 'available' | 'busy' | 'unavailable'

  joinedAt: Date
  isActive: boolean
}

const StudioMemberSchema = new Schema<IStudioMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    specialty: {
      type: String,
      required: true,
      enum: ['graphic_designer', 'video_editor', 'animator', '3d_artist', 'other'],
    },
    skills: {
      type: [String],
      default: [],
    },
    portfolio: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        mediaUrl: {
          type: String,
          required: true,
        },
        projectDate: Date,
      },
    ],

    // Stats
    requestsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    availability: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'available',
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
StudioMemberSchema.index({ userId: 1 })
StudioMemberSchema.index({ specialty: 1, availability: 1 })
StudioMemberSchema.index({ isActive: 1, availability: 1 })
StudioMemberSchema.index({ averageRating: -1 })

export const StudioMember = mongoose.model<IStudioMember>('StudioMember', StudioMemberSchema)
