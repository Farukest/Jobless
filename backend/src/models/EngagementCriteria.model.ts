import mongoose, { Schema, Document } from 'mongoose'

/**
 * EngagementCriteria - Admin tarafından tanımlanan dinamik etkileşim kriterleri
 *
 * Admin hangi etkileşim türlerinin puan getireceğini, kaç puan getireceğini
 * ve hangi koşullarda geçerli olacağını bu model üzerinden yönetir.
 */

export interface IEngagementCriteria extends Document {
  name: string
  description: string
  criteriaType: 'like' | 'retweet' | 'quote' | 'reply' | 'bookmark' | 'view' | 'custom'

  // Puan sistemi
  pointsConfig: {
    basePoints: number // Temel puan
    bonusConditions: Array<{
      condition: 'follower_count' | 'engagement_rate' | 'quality_score' | 'time_based' | 'streak'
      threshold: number
      bonusPoints: number
      description: string
    }>
  }

  // Gereksinimler ve kurallar
  requirements: {
    minFollowers?: number
    minAccountAge?: number // gün cinsinden
    mustBeVerified?: boolean
    maxDailyActions?: number // Günlük maksimum eylem sayısı (spam önleme)
    cooldownMinutes?: number // İki eylem arası bekleme süresi
  }

  // Zaman kısıtlamaları
  timeConstraints?: {
    validFrom?: Date
    validUntil?: Date
    activeHoursOnly?: boolean // Sadece aktif saatlerde mi?
    activeHours?: {
      start: number // 0-23
      end: number // 0-23
    }
  }

  // Multiplier sistemi (özel kampanyalar için)
  multipliers?: Array<{
    condition: 'weekend' | 'campaign' | 'special_event'
    multiplier: number
    validFrom?: Date
    validUntil?: Date
  }>

  // Status
  isActive: boolean
  priority: number // Birden fazla kriter uygulanabiliyorsa öncelik sırası

  // Metadata
  createdBy: mongoose.Types.ObjectId
  updatedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const EngagementCriteriaSchema = new Schema<IEngagementCriteria>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  criteriaType: {
    type: String,
    enum: ['like', 'retweet', 'quote', 'reply', 'bookmark', 'view', 'custom'],
    required: true,
  },
  pointsConfig: {
    basePoints: {
      type: Number,
      required: true,
      min: 0,
    },
    bonusConditions: [{
      condition: {
        type: String,
        enum: ['follower_count', 'engagement_rate', 'quality_score', 'time_based', 'streak'],
        required: true,
      },
      threshold: {
        type: Number,
        required: true,
      },
      bonusPoints: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    }],
  },
  requirements: {
    minFollowers: Number,
    minAccountAge: Number,
    mustBeVerified: Boolean,
    maxDailyActions: Number,
    cooldownMinutes: Number,
  },
  timeConstraints: {
    validFrom: Date,
    validUntil: Date,
    activeHoursOnly: Boolean,
    activeHours: {
      start: Number,
      end: Number,
    },
  },
  multipliers: [{
    condition: {
      type: String,
      enum: ['weekend', 'campaign', 'special_event'],
    },
    multiplier: {
      type: Number,
      min: 0,
    },
    validFrom: Date,
    validUntil: Date,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Index
EngagementCriteriaSchema.index({ isActive: 1, priority: -1 })
EngagementCriteriaSchema.index({ criteriaType: 1 })

export const EngagementCriteria = mongoose.model<IEngagementCriteria>('EngagementCriteria', EngagementCriteriaSchema)
