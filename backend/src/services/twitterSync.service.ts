import { User } from '../models/User.model'
import { Tweet } from '../models/Tweet.model'
import { decrypt } from '../utils/encryption'
import { logger } from '../utils/logger'
import axios from 'axios'

/**
 * TwitterSyncService - Twitter tweetlerini periyodik olarak çeker
 *
 * Cron job ile çalışır. Twitter OAuth token'ı olan kullanıcıların tweetlerini çeker.
 * API key olmadan çalışmaya hazır, key geldiğinde aktif hale gelir.
 */

class TwitterSyncService {
  private isEnabled: boolean = false

  constructor() {
    // Twitter API credentials kontrolü
    this.checkApiCredentials()
  }

  /**
   * Twitter API credentials'ı kontrol et
   */
  private checkApiCredentials(): void {
    const hasCredentials = !!(
      process.env.TWITTER_API_KEY &&
      process.env.TWITTER_API_SECRET &&
      process.env.TWITTER_BEARER_TOKEN
    )

    this.isEnabled = hasCredentials

    if (!this.isEnabled) {
      logger.warn('Twitter API credentials not configured - Tweet sync disabled')
      logger.warn('Add TWITTER_API_KEY, TWITTER_API_SECRET, and TWITTER_BEARER_TOKEN to .env to enable')
    } else {
      logger.info('Twitter API credentials found - Tweet sync enabled')
    }
  }

  /**
   * Tüm Twitter bağlantılı kullanıcıların tweetlerini senkronize et
   */
  async syncAllUsers(): Promise<void> {
    if (!this.isEnabled) {
      logger.debug('Twitter sync skipped - API credentials not configured')
      return
    }

    logger.info('Starting Twitter sync for all users...')

    try {
      // Twitter bağlantısı olan aktif kullanıcıları al
      const users = await User.find({
        twitterId: { $exists: true, $ne: null },
        twitterAccessToken: { $exists: true, $ne: null },
        isTwitterVerified: true,
        status: 'active',
      })

      logger.info(`Found ${users.length} users with Twitter connections`)

      // Her kullanıcı için senkronizasyon
      for (const user of users) {
        try {
          await this.syncUserTweets(user)
        } catch (error: any) {
          logger.error(`Failed to sync tweets for user ${user._id}:`, error.message)
        }
      }

      logger.info('Twitter sync completed')
    } catch (error: any) {
      logger.error('Twitter sync failed:', error)
    }
  }

  /**
   * Belirli bir kullanıcının tweetlerini senkronize et
   */
  async syncUserTweets(user: any): Promise<void> {
    if (!this.isEnabled) {
      throw new Error('Twitter API not configured')
    }

    logger.debug(`Syncing tweets for user ${user.twitterUsername}`)

    try {
      // Decrypt access token
      const accessToken = decrypt(user.twitterAccessToken)

      // Token expiry kontrolü
      if (user.twitterTokenExpiry && new Date(user.twitterTokenExpiry) < new Date()) {
        logger.warn(`Twitter token expired for user ${user._id}`)
        // TODO: Refresh token logic
        return
      }

      // Son senkronizasyon tarihini bul
      const lastTweet = await Tweet.findOne({ authorId: user._id })
        .sort({ createdAtTwitter: -1 })
        .limit(1)

      const sinceId = lastTweet?.tweetId

      // Twitter API'den tweetleri çek
      const tweets = await this.fetchTweetsFromTwitter(user.twitterId, accessToken, sinceId)

      // Tweetleri veritabanına kaydet
      for (const tweetData of tweets) {
        await this.saveTweet(user, tweetData)
      }

      logger.info(`Synced ${tweets.length} tweets for user ${user.twitterUsername}`)
    } catch (error: any) {
      logger.error(`Error syncing tweets for user ${user._id}:`, error.message)
      throw error
    }
  }

  /**
   * Twitter API'den tweetleri çek
   */
  private async fetchTweetsFromTwitter(
    twitterUserId: string,
    accessToken: string,
    sinceId?: string
  ): Promise<any[]> {
    try {
      const params: any = {
        max_results: 100,
        'tweet.fields': 'created_at,public_metrics,referenced_tweets,entities,edit_history_tweet_ids',
        'media.fields': 'url,preview_image_url,type',
        expansions: 'attachments.media_keys',
      }

      if (sinceId) {
        params.since_id = sinceId
      }

      const response = await axios.get(
        `https://api.twitter.com/2/users/${twitterUserId}/tweets`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params,
        }
      )

      return response.data.data || []
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Twitter token invalid or expired')
      }
      throw error
    }
  }

  /**
   * Tweet'i veritabanına kaydet veya güncelle
   */
  private async saveTweet(user: any, tweetData: any): Promise<void> {
    try {
      const existingTweet = await Tweet.findOne({ tweetId: tweetData.id })

      if (existingTweet) {
        // Tweet var - güncelle (metrikleri)
        await this.updateTweet(existingTweet, tweetData)
      } else {
        // Yeni tweet - oluştur
        await this.createTweet(user, tweetData)
      }
    } catch (error: any) {
      logger.error(`Failed to save tweet ${tweetData.id}:`, error.message)
    }
  }

  /**
   * Yeni tweet oluştur
   */
  private async createTweet(user: any, tweetData: any): Promise<void> {
    const tweet = new Tweet({
      tweetId: tweetData.id,
      authorId: user._id,
      twitterUserId: user.twitterId,
      twitterUsername: user.twitterUsername,
      text: tweetData.text,
      media: this.extractMedia(tweetData),
      urls: this.extractUrls(tweetData),
      metrics: {
        retweetCount: tweetData.public_metrics?.retweet_count || 0,
        replyCount: tweetData.public_metrics?.reply_count || 0,
        likeCount: tweetData.public_metrics?.like_count || 0,
        quoteCount: tweetData.public_metrics?.quote_count || 0,
        bookmarkCount: tweetData.public_metrics?.bookmark_count || 0,
        impressionCount: tweetData.public_metrics?.impression_count || 0,
      },
      isRetweet: this.isRetweet(tweetData),
      isQuote: this.isQuote(tweetData),
      isReply: this.isReply(tweetData),
      retweetedTweetId: this.getRetweetedId(tweetData),
      quotedTweetId: this.getQuotedId(tweetData),
      repliedToTweetId: this.getRepliedToId(tweetData),
      createdAtTwitter: new Date(tweetData.created_at),
      lastSyncedAt: new Date(),
      lastMetricsUpdate: new Date(),
      isEdited: this.isEdited(tweetData),
      isVisible: true,
    })

    await tweet.save()
    logger.debug(`Created new tweet ${tweet.tweetId}`)
  }

  /**
   * Mevcut tweet'i güncelle
   */
  private async updateTweet(existingTweet: any, tweetData: any): Promise<void> {
    // Metrikleri güncelle
    existingTweet.metrics = {
      retweetCount: tweetData.public_metrics?.retweet_count || 0,
      replyCount: tweetData.public_metrics?.reply_count || 0,
      likeCount: tweetData.public_metrics?.like_count || 0,
      quoteCount: tweetData.public_metrics?.quote_count || 0,
      bookmarkCount: tweetData.public_metrics?.bookmark_count || 0,
      impressionCount: tweetData.public_metrics?.impression_count || 0,
    }

    existingTweet.lastSyncedAt = new Date()
    existingTweet.lastMetricsUpdate = new Date()

    // Edit kontrolü
    if (this.isEdited(tweetData) && tweetData.text !== existingTweet.text) {
      await existingTweet.markAsEdited(tweetData.text)
    } else {
      await existingTweet.save()
    }

    logger.debug(`Updated tweet ${existingTweet.tweetId}`)
  }

  // Helper methods
  private extractMedia(tweetData: any): any[] {
    // TODO: Implement media extraction from Twitter API response
    return []
  }

  private extractUrls(tweetData: any): any[] {
    const urls = tweetData.entities?.urls || []
    return urls.map((url: any) => ({
      url: url.url,
      expandedUrl: url.expanded_url,
      displayUrl: url.display_url,
    }))
  }

  private isRetweet(tweetData: any): boolean {
    return tweetData.referenced_tweets?.some((ref: any) => ref.type === 'retweeted') || false
  }

  private isQuote(tweetData: any): boolean {
    return tweetData.referenced_tweets?.some((ref: any) => ref.type === 'quoted') || false
  }

  private isReply(tweetData: any): boolean {
    return tweetData.referenced_tweets?.some((ref: any) => ref.type === 'replied_to') || false
  }

  private getRetweetedId(tweetData: any): string | undefined {
    return tweetData.referenced_tweets?.find((ref: any) => ref.type === 'retweeted')?.id
  }

  private getQuotedId(tweetData: any): string | undefined {
    return tweetData.referenced_tweets?.find((ref: any) => ref.type === 'quoted')?.id
  }

  private getRepliedToId(tweetData: any): string | undefined {
    return tweetData.referenced_tweets?.find((ref: any) => ref.type === 'replied_to')?.id
  }

  private isEdited(tweetData: any): boolean {
    return tweetData.edit_history_tweet_ids && tweetData.edit_history_tweet_ids.length > 1
  }
}

export const twitterSyncService = new TwitterSyncService()
