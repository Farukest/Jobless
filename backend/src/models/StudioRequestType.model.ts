import mongoose, { Document, Schema } from 'mongoose'

export interface IStudioRequestType extends Document {
  name: string
  slug: string
  description?: string
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

const StudioRequestTypeSchema = new Schema<IStudioRequestType>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
StudioRequestTypeSchema.index({ slug: 1 })
StudioRequestTypeSchema.index({ isActive: 1, order: 1 })

export const StudioRequestType = mongoose.model<IStudioRequestType>('StudioRequestType', StudioRequestTypeSchema)
