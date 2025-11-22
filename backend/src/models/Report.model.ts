import mongoose, { Document, Schema } from 'mongoose'

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId
  contentType: 'hub_content' | 'alpha_post' | 'course' | 'comment' | 'user'
  contentId: mongoose.Types.ObjectId
  reason: string
  description?: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  reviewNotes?: string
  action?: 'none' | 'content_removed' | 'user_warned' | 'user_suspended' | 'user_banned'
  createdAt: Date
  updatedAt: Date
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['hub_content', 'alpha_post', 'course', 'comment', 'user'],
      index: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'spam',
        'harassment',
        'misinformation',
        'inappropriate_content',
        'copyright_violation',
        'scam',
        'other',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    action: {
      type: String,
      enum: ['none', 'content_removed', 'user_warned', 'user_suspended', 'user_banned'],
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
ReportSchema.index({ status: 1, createdAt: -1 })
ReportSchema.index({ contentType: 1, contentId: 1 })
ReportSchema.index({ reporterId: 1, createdAt: -1 })

export const Report = mongoose.model<IReport>('Report', ReportSchema)
