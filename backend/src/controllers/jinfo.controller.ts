import { Request, Response } from 'express'
import { Tweet } from '../models/Tweet.model'
import { UserTweetEngagement } from '../models/UserTweetEngagement.model'
import { User } from '../models/User.model'
import { pointsCalculationService } from '../services/pointsCalculation.service'
import { logger } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * JInfoController - J Info feed ve engagement yönetimi
 */

export class JInfoController {
  /**
   * Tweet feed'i getir (sadece Twitter bağlantısı olan kullanıcıların tweetleri)
   */
  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id
      const { page = 1, limit = 20, author } = req.query

      // Sadece Twitter bağlantısı olan kullanıcıların tweetlerini getir
      const filter: any = {
        isVisible: true,
        isDeleted: false,
      }

      // Author filter (specific user's tweets)
      if (author) {
        filter.twitterUsername = author
      }

      const skip = (Number(page) - 1) * Number(limit)

      const [tweets, total] = await Promise.all([
        Tweet.find(filter)
          .sort({ createdAtTwitter: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('authorId', 'name twitterUsername twitterId profileImage')
          .lean(),
        Tweet.countDocuments(filter),
      ])

      // Eğer kullanıcı giriş yaptıysa, kendi engagement'larını da ekle
      let tweetsWithEngagement = tweets
      if (userId) {
        const tweetIds = tweets.map(t => t._id)
        const userEngagements = await UserTweetEngagement.find({
          userId: new mongoose.Types.ObjectId(userId),
          tweetId: { $in: tweetIds },
        }).lean()

        const engagementMap = new Map(
          userEngagements.map(e => [e.tweetId.toString(), e])
        )

        tweetsWithEngagement = tweets.map(tweet => ({
          ...tweet,
          userEngagement: engagementMap.get(tweet._id.toString()) || null,
        }))
      }

      res.json({
        success: true,
        data: {
          tweets: tweetsWithEngagement,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      })
    } catch (error: any) {
      logger.error('Error fetching J Info feed:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feed',
        error: error.message,
      })
    }
  }

  /**
   * Belirli bir tweet'in detayını getir
   */
  async getTweetById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user?.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid tweet ID',
        })
        return
      }

      const tweet = await Tweet.findById(id)
        .populate('authorId', 'name twitterUsername twitterId profileImage')
        .lean()

      if (!tweet) {
        res.status(404).json({
          success: false,
          message: 'Tweet not found',
        })
        return
      }

      // Kullanıcının engagement'ını ekle
      let tweetWithEngagement: any = tweet
      if (userId) {
        const userEngagement = await UserTweetEngagement.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          tweetId: tweet._id,
        }).lean()

        tweetWithEngagement = {
          ...tweet,
          userEngagement: userEngagement || null,
        }
      }

      res.json({
        success: true,
        data: tweetWithEngagement,
      })
    } catch (error: any) {
      logger.error('Error fetching tweet:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tweet',
        error: error.message,
      })
    }
  }

  /**
   * Tweet'e engagement ver
   */
  async createEngagement(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id
      const { tweetId, engagementTypes, proofUrls } = req.body

      // Validation
      if (!tweetId || !engagementTypes || !Array.isArray(engagementTypes)) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: tweetId, engagementTypes (array)',
        })
        return
      }

      if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid tweet ID',
        })
        return
      }

      // Tweet kontrolü
      const tweet = await Tweet.findById(tweetId)
      if (!tweet) {
        res.status(404).json({
          success: false,
          message: 'Tweet not found',
        })
        return
      }

      // Kendi tweetine etkileşim veremez
      if (tweet.authorId.toString() === userId) {
        res.status(400).json({
          success: false,
          message: 'Cannot engage with your own tweet',
        })
        return
      }

      // Duplicate kontrolü
      const existingEngagement = await UserTweetEngagement.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        tweetId: new mongoose.Types.ObjectId(tweetId),
      })

      if (existingEngagement) {
        res.status(400).json({
          success: false,
          message: 'You have already engaged with this tweet',
        })
        return
      }

      // Kullanıcı bilgisini al
      const user = await User.findById(userId)
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        })
        return
      }

      // Puan hesapla
      const pointsResult = await pointsCalculationService.calculatePoints({
        userId,
        tweetId,
        engagementTypes,
        proofUrls,
      })

      // Engagement oluştur
      const engagement = new UserTweetEngagement({
        userId: new mongoose.Types.ObjectId(userId),
        tweetId: new mongoose.Types.ObjectId(tweetId),
        tweetAuthorId: tweet.authorId,
        engagements: {
          like: engagementTypes.includes('like'),
          retweet: engagementTypes.includes('retweet'),
          quote: engagementTypes.includes('quote'),
          reply: engagementTypes.includes('reply'),
          bookmark: engagementTypes.includes('bookmark'),
          view: engagementTypes.includes('view'),
        },
        pointsBreakdown: pointsResult.breakdown,
        totalPointsEarned: pointsResult.totalPoints,
        proofUrls: proofUrls || [],
        engagedAt: new Date(),
        status: 'pending', // Admin onayına tabi
        userFollowerCount: user.twitterMetadata?.followersCount,
        userAccountAge: user.joinedAt ? Math.floor(
          (Date.now() - user.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
        ) : undefined,
      })

      await engagement.save()

      // Tweet engagement sayısını artır
      tweet.totalEngagementsGiven = (tweet.totalEngagementsGiven || 0) + 1
      await tweet.save()

      logger.info(`Engagement created by user ${userId} for tweet ${tweetId}`)

      res.status(201).json({
        success: true,
        message: 'Engagement created successfully. Pending verification.',
        data: engagement,
      })
    } catch (error: any) {
      logger.error('Error creating engagement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create engagement',
        error: error.message,
      })
    }
  }

  /**
   * Kullanıcının engagement geçmişini getir
   */
  async getUserEngagements(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id
      const { page = 1, limit = 20, status } = req.query

      const filter: any = {
        userId: new mongoose.Types.ObjectId(userId),
      }

      if (status) {
        filter.status = status
      }

      const skip = (Number(page) - 1) * Number(limit)

      const [engagements, total] = await Promise.all([
        UserTweetEngagement.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('tweetId')
          .populate('tweetAuthorId', 'name twitterUsername')
          .lean(),
        UserTweetEngagement.countDocuments(filter),
      ])

      res.json({
        success: true,
        data: {
          engagements,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      })
    } catch (error: any) {
      logger.error('Error fetching user engagements:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagements',
        error: error.message,
      })
    }
  }

  /**
   * Kullanıcının toplam puanını ve istatistiklerini getir
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id

      const stats = await UserTweetEngagement.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalPoints: { $sum: '$totalPointsEarned' },
          },
        },
      ])

      const totalEngagements = await UserTweetEngagement.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
      })

      const verifiedPoints = stats.find(s => s._id === 'verified')?.totalPoints || 0
      const pendingPoints = stats.find(s => s._id === 'pending')?.totalPoints || 0

      res.json({
        success: true,
        data: {
          totalEngagements,
          verifiedEngagements: stats.find(s => s._id === 'verified')?.count || 0,
          pendingEngagements: stats.find(s => s._id === 'pending')?.count || 0,
          rejectedEngagements: stats.find(s => s._id === 'rejected')?.count || 0,
          verifiedPoints,
          pendingPoints,
          totalPoints: verifiedPoints,
        },
      })
    } catch (error: any) {
      logger.error('Error fetching user stats:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user stats',
        error: error.message,
      })
    }
  }

  /**
   * Admin: Tüm engagement'ları listele (onay için)
   */
  async getAllEngagements(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status } = req.query

      const filter: any = {}
      if (status) {
        filter.status = status
      }

      const skip = (Number(page) - 1) * Number(limit)

      const [engagements, total] = await Promise.all([
        UserTweetEngagement.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('userId', 'name email twitterUsername')
          .populate('tweetId')
          .populate('tweetAuthorId', 'name twitterUsername')
          .lean(),
        UserTweetEngagement.countDocuments(filter),
      ])

      res.json({
        success: true,
        data: {
          engagements,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      })
    } catch (error: any) {
      logger.error('Error fetching all engagements:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagements',
        error: error.message,
      })
    }
  }

  /**
   * Admin: Engagement'ı onayla
   */
  async verifyEngagement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid engagement ID',
        })
        return
      }

      const engagement = await UserTweetEngagement.findById(id)

      if (!engagement) {
        res.status(404).json({
          success: false,
          message: 'Engagement not found',
        })
        return
      }

      await engagement.verify(new mongoose.Types.ObjectId(userId))

      // Tweet'e puan ekle
      const tweet = await Tweet.findById(engagement.tweetId)
      if (tweet) {
        tweet.totalPointsDistributed = (tweet.totalPointsDistributed || 0) + engagement.totalPointsEarned
        await tweet.save()
      }

      // Kullanıcının toplam puanını güncelle
      const user = await User.findById(engagement.userId)
      if (user) {
        user.totalPoints = (user.totalPoints || 0) + engagement.totalPointsEarned
        await user.save()
      }

      logger.info(`Engagement verified: ${id} by admin ${userId}`)

      res.json({
        success: true,
        message: 'Engagement verified successfully',
        data: engagement,
      })
    } catch (error: any) {
      logger.error('Error verifying engagement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to verify engagement',
        error: error.message,
      })
    }
  }

  /**
   * Admin: Engagement'ı reddet
   */
  async rejectEngagement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { reason } = req.body
      const userId = (req as any).user.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid engagement ID',
        })
        return
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        })
        return
      }

      const engagement = await UserTweetEngagement.findById(id)

      if (!engagement) {
        res.status(404).json({
          success: false,
          message: 'Engagement not found',
        })
        return
      }

      await engagement.reject(reason, new mongoose.Types.ObjectId(userId))

      logger.info(`Engagement rejected: ${id} by admin ${userId}`)

      res.json({
        success: true,
        message: 'Engagement rejected successfully',
        data: engagement,
      })
    } catch (error: any) {
      logger.error('Error rejecting engagement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to reject engagement',
        error: error.message,
      })
    }
  }
}

export const jinfoController = new JInfoController()
