import mongoose, { Document, Schema } from 'mongoose'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId

  type: 'info' | 'success' | 'warning' | 'engagement' | 'system'
  category: 'content' | 'course' | 'production_request' | 'alpha' | 'engagement' | 'admin' | 'blockchain' | 'other'

  title: string
  message: string

  relatedModule?: 'j_hub' | 'j_studio' | 'j_academy' | 'j_info' | 'j_alpha'
  relatedEntityId?: mongoose.Types.ObjectId
  relatedEntityType?: string

  actionUrl?: string

  isRead: boolean
  readAt?: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['info', 'success', 'warning', 'engagement', 'system'],
      default: 'info',
    },
    category: {
      type: String,
      required: true,
      enum: ['content', 'course', 'production_request', 'alpha', 'engagement', 'admin', 'blockchain', 'other'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    relatedModule: {
      type: String,
      enum: ['j_hub', 'j_studio', 'j_academy', 'j_info', 'j_alpha'],
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
    },
    relatedEntityType: {
      type: String,
      enum: ['content', 'course', 'production_request', 'engagement_post', 'alpha_post', 'transaction'],
    },
    actionUrl: String,
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })
NotificationSchema.index({ type: 1, createdAt: -1 })

// Update readAt when isRead is set to true
NotificationSchema.pre('save', function (next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date()
  }
  next()
})

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
