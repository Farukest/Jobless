import mongoose, { Document, Schema } from 'mongoose'

export interface IView extends Document {
  userId?: mongoose.Types.ObjectId // Optional - for anonymous views
  targetId: mongoose.Types.ObjectId
  targetType: 'hub_content' | 'course' | 'alpha_post'
  ipAddress: string
  userAgent?: string
  createdAt: Date
}

const ViewSchema = new Schema<IView>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true, // Allows null values in index
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
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Index for getting all views of a target (analytics)
ViewSchema.index({ targetId: 1, targetType: 1, createdAt: -1 })

// Index for getting views by user (if logged in)
ViewSchema.index({ userId: 1, createdAt: -1 }, { sparse: true })

// Index for unique view tracking by logged-in user (one view per user per target)
ViewSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { sparse: true })

// Index for unique view tracking by IP (for anonymous users within 24h)
ViewSchema.index({ ipAddress: 1, targetId: 1, targetType: 1, createdAt: -1 })

export const View = mongoose.model<IView>('View', ViewSchema)
