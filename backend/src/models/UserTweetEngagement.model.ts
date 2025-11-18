import mongoose, { Schema, Document } from 'mongoose'

/**
 * UserTweetEngagement - Kullanıcıların tweetlere verdiği etkileşimler
 *
 * Bir kullanıcı başka bir Jobless üyesinin tweetine etkileşim verdiğinde
 * bu kayıt oluşturulur ve puan hesaplaması yapılır.
 */

export interface IUserTweetEngagement extends Document {
  userId: mongoose.Types.ObjectId // Etkileşim veren kullanıcı
  tweetId: mongoose.Types.ObjectId // Etkileşim verilen tweet
  tweetAuthorId: mongoose.Types.ObjectId // Tweet sahibi

  // Etkileşim türleri
  engagements: {
    like: boolean
    retweet: boolean
    quote: boolean
    reply: boolean
    bookmark: boolean
    view: boolean
  }

  // Puan hesaplaması
  pointsBreakdown: Array<{
    criteriaId: mongoose.Types.ObjectId // Hangi kritere göre puan verildi
    criteriaName: string
    engagementType: string
    basePoints: number
    bonusPoints: number
    multiplier: number
    totalPoints: number
    reason: string
  }>

  totalPointsEarned: number

  // Doğrulama ve proof
  proofUrls: Array<{
    type: 'screenshot' | 'tweet_url' | 'other'
    url: string
  }>
  isVerified: boolean
  verifiedBy?: mongoose.Types.ObjectId
  verifiedAt?: Date
  rejectionReason?: string

  // Metadata
  userFollowerCount?: number // Etkileşim anında kullanıcının takipçi sayısı
  userAccountAge?: number // Etkileşim anında hesap yaşı (gün)
  engagedAt: Date

  // Status
  status: 'pending' | 'verified' | 'rejected' | 'auto_verified'

  createdAt: Date
  updatedAt: Date

  // Methods
  verify(verifierId: mongoose.Types.ObjectId): Promise<this>
  reject(reason: string, verifierId: mongoose.Types.ObjectId): Promise<this>
}

const UserTweetEngagementSchema = new Schema<IUserTweetEngagement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tweetId: {
    type: Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true,
    index: true,
  },
  tweetAuthorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  engagements: {
    like: {
      type: Boolean,
      default: false,
    },
    retweet: {
      type: Boolean,
      default: false,
    },
    quote: {
      type: Boolean,
      default: false,
    },
    reply: {
      type: Boolean,
      default: false,
    },
    bookmark: {
      type: Boolean,
      default: false,
    },
    view: {
      type: Boolean,
      default: false,
    },
  },
  pointsBreakdown: [{
    criteriaId: {
      type: Schema.Types.ObjectId,
      ref: 'EngagementCriteria',
      required: true,
    },
    criteriaName: {
      type: String,
      required: true,
    },
    engagementType: {
      type: String,
      required: true,
    },
    basePoints: {
      type: Number,
      required: true,
    },
    bonusPoints: {
      type: Number,
      default: 0,
    },
    multiplier: {
      type: Number,
      default: 1,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
  }],
  totalPointsEarned: {
    type: Number,
    required: true,
    default: 0,
  },
  proofUrls: [{
    type: {
      type: String,
      enum: ['screenshot', 'tweet_url', 'other'],
    },
    url: String,
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
  rejectionReason: String,
  userFollowerCount: Number,
  userAccountAge: Number,
  engagedAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'auto_verified'],
    default: 'pending',
  },
}, {
  timestamps: true,
})

// Compound indexes
UserTweetEngagementSchema.index({ userId: 1, tweetId: 1 }, { unique: true })
UserTweetEngagementSchema.index({ userId: 1, createdAt: -1 })
UserTweetEngagementSchema.index({ tweetAuthorId: 1, createdAt: -1 })
UserTweetEngagementSchema.index({ status: 1, createdAt: -1 })

// Methods
UserTweetEngagementSchema.methods.verify = function(verifierId: mongoose.Types.ObjectId) {
  this.isVerified = true
  this.verifiedBy = verifierId
  this.verifiedAt = new Date()
  this.status = 'verified'
  return this.save()
}

UserTweetEngagementSchema.methods.reject = function(reason: string, verifierId: mongoose.Types.ObjectId) {
  this.status = 'rejected'
  this.rejectionReason = reason
  this.verifiedBy = verifierId
  this.verifiedAt = new Date()
  return this.save()
}

export const UserTweetEngagement = mongoose.model<IUserTweetEngagement>('UserTweetEngagement', UserTweetEngagementSchema)
