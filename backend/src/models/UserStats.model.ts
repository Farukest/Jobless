import mongoose, { Document, Schema } from 'mongoose'

export interface IUserStats extends Document {
  userId: mongoose.Types.ObjectId

  // J Hub Stats
  hubContentsCreated: number
  hubContentsViewed: number

  // J Studio Stats
  studioRequestsSubmitted: number
  studioRequestsCompleted: number
  studioTasksCompleted: number

  // J Academy Stats
  coursesCreated: number
  coursesCompleted: number
  coursesRequested: number

  // J Info Stats
  tweetsSubmitted: number
  interactionsGiven: number
  interactionsReceived: number

  // J Alpha Stats
  alphasSubmitted: number
  alphasValidated: number
  votesGiven: number

  lastUpdated: Date
}

const UserStatsSchema = new Schema<IUserStats>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // J Hub Stats
    hubContentsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    hubContentsViewed: {
      type: Number,
      default: 0,
      min: 0,
    },

    // J Studio Stats
    studioRequestsSubmitted: {
      type: Number,
      default: 0,
      min: 0,
    },
    studioRequestsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    studioTasksCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    // J Academy Stats
    coursesCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    coursesCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    coursesRequested: {
      type: Number,
      default: 0,
      min: 0,
    },

    // J Info Stats
    tweetsSubmitted: {
      type: Number,
      default: 0,
      min: 0,
    },
    interactionsGiven: {
      type: Number,
      default: 0,
      min: 0,
    },
    interactionsReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    // J Alpha Stats
    alphasSubmitted: {
      type: Number,
      default: 0,
      min: 0,
    },
    alphasValidated: {
      type: Number,
      default: 0,
      min: 0,
    },
    votesGiven: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
UserStatsSchema.index({ userId: 1 })
UserStatsSchema.index({ lastUpdated: -1 })

// Update lastUpdated on save
UserStatsSchema.pre('save', function (next) {
  this.lastUpdated = new Date()
  next()
})

export const UserStats = mongoose.model<IUserStats>('UserStats', UserStatsSchema)
