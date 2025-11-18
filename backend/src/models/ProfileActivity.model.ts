import mongoose, { Document, Schema } from 'mongoose'

export interface IProfileActivity extends Document {
  userId: mongoose.Types.ObjectId

  activityType: string
  moduleSource: 'j_hub' | 'j_studio' | 'j_academy' | 'j_info' | 'j_alpha'

  description: string
  relatedEntityId?: mongoose.Types.ObjectId
  relatedEntityType?: string

  points: number
  timestamp: Date
}

const ProfileActivitySchema = new Schema<IProfileActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      required: true,
      enum: [
        'content_created',
        'content_published',
        'interaction_given',
        'course_completed',
        'course_enrolled',
        'production_request_submitted',
        'production_request_completed',
        'alpha_submitted',
        'alpha_validated',
        'engagement_participated',
        'comment_posted',
        'vote_casted',
        'other',
      ],
    },
    moduleSource: {
      type: String,
      required: true,
      enum: ['j_hub', 'j_studio', 'j_academy', 'j_info', 'j_alpha'],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
    },
    relatedEntityType: {
      type: String,
      enum: ['content', 'course', 'production_request', 'engagement_post', 'alpha_post'],
    },
    points: {
      type: Number,
      default: 0,
    },
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
ProfileActivitySchema.index({ userId: 1, timestamp: -1 })
ProfileActivitySchema.index({ moduleSource: 1, timestamp: -1 })
ProfileActivitySchema.index({ activityType: 1, timestamp: -1 })

export const ProfileActivity = mongoose.model<IProfileActivity>('ProfileActivity', ProfileActivitySchema)
