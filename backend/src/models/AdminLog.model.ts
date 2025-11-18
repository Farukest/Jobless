import mongoose, { Document, Schema } from 'mongoose'

export interface IAdminLog extends Document {
  adminId: mongoose.Types.ObjectId
  action: string

  targetType: string
  targetId: mongoose.Types.ObjectId

  changes: any

  ipAddress?: string
  userAgent?: string

  timestamp: Date
}

const AdminLogSchema = new Schema<IAdminLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user_created',
        'user_updated',
        'user_deleted',
        'user_banned',
        'user_unbanned',
        'role_changed',
        'permissions_updated',
        'content_deleted',
        'content_moderated',
        'content_featured',
        'content_pinned',
        'course_approved',
        'course_rejected',
        'alpha_validated',
        'alpha_rejected',
        'settings_updated',
        'module_enabled',
        'module_disabled',
        'other',
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ['user', 'content', 'course', 'production_request', 'engagement_post', 'alpha_post', 'settings', 'other'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
AdminLogSchema.index({ adminId: 1, timestamp: -1 })
AdminLogSchema.index({ action: 1, timestamp: -1 })
AdminLogSchema.index({ targetType: 1, targetId: 1 })
AdminLogSchema.index({ timestamp: -1 })

export const AdminLog = mongoose.model<IAdminLog>('AdminLog', AdminLogSchema)
