import mongoose, { Schema, Document } from 'mongoose'

/**
 * Tweet - Twitter'dan çekilen kullanıcı tweet'leri
 *
 * Cron job ile periyodik olarak çekilen tweetler burada saklanır.
 * Sadece Twitter bağlantısı yapmış kullanıcıların tweetleri çekilir.
 */

export interface ITweet extends Document {
  // Tweet bilgileri
  tweetId: string // Twitter'dan gelen ID
  authorId: mongoose.Types.ObjectId // Jobless kullanıcısı
  twitterUserId: string // Twitter kullanıcı ID'si
  twitterUsername: string

  // İçerik
  text: string
  media: Array<{
    type: 'photo' | 'video' | 'gif'
    url: string
    thumbnailUrl?: string
  }>
  urls: Array<{
    url: string
    expandedUrl: string
    displayUrl: string
  }>

  // Metriks
  metrics: {
    retweetCount: number
    replyCount: number
    likeCount: number
    quoteCount: number
    bookmarkCount: number
    impressionCount: number
  }

  // Tweet metadata
  isRetweet: boolean
  isQuote: boolean
  isReply: boolean
  retweetedTweetId?: string
  quotedTweetId?: string
  repliedToTweetId?: string

  // Sync tracking
  createdAtTwitter: Date // Twitter'da oluşturulma zamanı
  lastSyncedAt: Date // Son senkronizasyon zamanı
  lastMetricsUpdate: Date // Metrikler son güncelleme
  isEdited: boolean // Tweet düzenlendi mi?
  editHistory: Array<{
    text: string
    editedAt: Date
  }>

  // Engagement tracking (J Info için)
  totalEngagementsGiven: number // Bu tweete kaç kişi etkileşim verdi
  totalPointsDistributed: number // Bu tweet üzerinden dağıtılan toplam puan

  // Status
  isDeleted: boolean // Twitter'da silindi mi?
  isVisible: boolean // J Info feed'de göster mi?
  deletedAt?: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

const TweetSchema = new Schema<ITweet>({
  tweetId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  twitterUserId: {
    type: String,
    required: true,
    index: true,
  },
  twitterUsername: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  media: [{
    type: {
      type: String,
      enum: ['photo', 'video', 'gif'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: String,
  }],
  urls: [{
    url: String,
    expandedUrl: String,
    displayUrl: String,
  }],
  metrics: {
    retweetCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    quoteCount: {
      type: Number,
      default: 0,
    },
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    impressionCount: {
      type: Number,
      default: 0,
    },
  },
  isRetweet: {
    type: Boolean,
    default: false,
  },
  isQuote: {
    type: Boolean,
    default: false,
  },
  isReply: {
    type: Boolean,
    default: false,
  },
  retweetedTweetId: String,
  quotedTweetId: String,
  repliedToTweetId: String,
  createdAtTwitter: {
    type: Date,
    required: true,
    index: true,
  },
  lastSyncedAt: {
    type: Date,
    required: true,
  },
  lastMetricsUpdate: {
    type: Date,
    required: true,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editHistory: [{
    text: String,
    editedAt: Date,
  }],
  totalEngagementsGiven: {
    type: Number,
    default: 0,
  },
  totalPointsDistributed: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  deletedAt: Date,
}, {
  timestamps: true,
})

// Compound indexes
TweetSchema.index({ authorId: 1, createdAtTwitter: -1 })
TweetSchema.index({ isVisible: 1, isDeleted: 1, createdAtTwitter: -1 })
TweetSchema.index({ twitterUserId: 1, createdAtTwitter: -1 })

// Methods
TweetSchema.methods.updateMetrics = function(newMetrics: any) {
  this.metrics = {
    ...this.metrics,
    ...newMetrics,
  }
  this.lastMetricsUpdate = new Date()
  return this.save()
}

TweetSchema.methods.markAsEdited = function(newText: string) {
  this.editHistory.push({
    text: this.text,
    editedAt: new Date(),
  })
  this.text = newText
  this.isEdited = true
  return this.save()
}

export const Tweet = mongoose.model<ITweet>('Tweet', TweetSchema)
