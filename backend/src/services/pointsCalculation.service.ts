import { EngagementCriteria, IEngagementCriteria } from '../models/EngagementCriteria.model'
import { User } from '../models/User.model'
import { Tweet } from '../models/Tweet.model'
import { UserTweetEngagement } from '../models/UserTweetEngagement.model'
import mongoose from 'mongoose'
import { logger } from '../utils/logger'

/**
 * PointsCalculationService - Dinamik puan hesaplama servisi
 *
 * Admin tarafından tanımlanan kriterlere göre kullanıcı etkileşimlerini puanlar.
 * Tüm puan hesaplama mantığı dinamik ve db-driven olarak çalışır.
 */

interface EngagementInput {
  userId: string
  tweetId: string
  engagementTypes: Array<'like' | 'retweet' | 'quote' | 'reply' | 'bookmark' | 'view'>
  proofUrls?: Array<{ type: string; url: string }>
}

interface PointsBreakdownItem {
  criteriaId: mongoose.Types.ObjectId
  criteriaName: string
  engagementType: string
  basePoints: number
  bonusPoints: number
  multiplier: number
  totalPoints: number
  reason: string
}

class PointsCalculationService {
  /**
   * Etkileşim için puan hesapla
   */
  async calculatePoints(input: EngagementInput): Promise<{
    totalPoints: number
    breakdown: PointsBreakdownItem[]
  }> {
    const { userId, tweetId, engagementTypes } = input

    // Kullanıcı ve tweet bilgilerini al
    const [user, tweet] = await Promise.all([
      User.findById(userId),
      Tweet.findById(tweetId),
    ])

    if (!user || !tweet) {
      throw new Error('User or tweet not found')
    }

    // Kendi tweetine etkileşim veremez
    if (tweet.authorId.toString() === userId) {
      throw new Error('Cannot engage with own tweet')
    }

    // Aktif kriterleri al
    const criteria = await EngagementCriteria.find({ isActive: true }).sort({ priority: -1 })

    const breakdown: PointsBreakdownItem[] = []
    let totalPoints = 0

    // Her etkileşim türü için puan hesapla
    for (const engagementType of engagementTypes) {
      const relevantCriteria = criteria.filter(c => c.criteriaType === engagementType)

      for (const criterion of relevantCriteria) {
        // Gereksinimleri kontrol et
        if (!this.meetsRequirements(user, criterion)) {
          logger.debug(`User ${userId} does not meet requirements for ${criterion.name}`)
          continue
        }

        // Zaman kısıtlamalarını kontrol et
        if (!this.meetsTimeConstraints(criterion)) {
          logger.debug(`Time constraints not met for ${criterion.name}`)
          continue
        }

        // Temel puanı al
        let basePoints = criterion.pointsConfig.basePoints

        // Bonus puanları hesapla
        const bonusPoints = await this.calculateBonusPoints(user, criterion)

        // Multiplier hesapla
        const multiplier = this.calculateMultiplier(criterion)

        // Toplam puanı hesapla
        const points = (basePoints + bonusPoints) * multiplier

        breakdown.push({
          criteriaId: criterion._id,
          criteriaName: criterion.name,
          engagementType,
          basePoints,
          bonusPoints,
          multiplier,
          totalPoints: points,
          reason: this.generateReason(criterion, bonusPoints, multiplier),
        })

        totalPoints += points
      }
    }

    return {
      totalPoints,
      breakdown,
    }
  }

  /**
   * Kullanıcının kriterlerin gereksinimlerini karşılayıp karşılamadığını kontrol et
   */
  private meetsRequirements(user: any, criterion: IEngagementCriteria): boolean {
    const { requirements } = criterion

    if (!requirements) return true

    // Min followers check (Twitter metadata'sından alınacak - şimdilik skip)
    if (requirements.minFollowers !== undefined) {
      // TODO: Twitter metadata eklendiğinde implement et
    }

    // Min account age check
    if (requirements.minAccountAge !== undefined) {
      const accountAgeDays = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (accountAgeDays < requirements.minAccountAge) {
        return false
      }
    }

    // Verified check
    if (requirements.mustBeVerified && !user.isTwitterVerified) {
      return false
    }

    return true
  }

  /**
   * Zaman kısıtlamalarını kontrol et
   */
  private meetsTimeConstraints(criterion: IEngagementCriteria): boolean {
    const { timeConstraints } = criterion

    if (!timeConstraints) return true

    const now = new Date()

    // Valid date range check
    if (timeConstraints.validFrom && now < timeConstraints.validFrom) {
      return false
    }

    if (timeConstraints.validUntil && now > timeConstraints.validUntil) {
      return false
    }

    // Active hours check
    if (timeConstraints.activeHoursOnly && timeConstraints.activeHours) {
      const currentHour = now.getHours()
      const { start, end } = timeConstraints.activeHours

      if (start <= end) {
        if (currentHour < start || currentHour >= end) {
          return false
        }
      } else {
        // Crosses midnight
        if (currentHour < start && currentHour >= end) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Bonus puanları hesapla
   */
  private async calculateBonusPoints(user: any, criterion: IEngagementCriteria): Promise<number> {
    let bonusPoints = 0

    const bonusConditions = criterion.pointsConfig.bonusConditions || []

    for (const condition of bonusConditions) {
      let meetsCondition = false

      switch (condition.condition) {
        case 'follower_count':
          // TODO: Twitter metadata eklendiğinde implement et
          // const followerCount = user.twitterMetadata?.followersCount || 0
          // meetsCondition = followerCount >= condition.threshold
          break

        case 'engagement_rate':
          // Kullanıcının engagement rate'i
          const engagementCount = await UserTweetEngagement.countDocuments({
            userId: user._id,
            status: 'verified',
          })
          meetsCondition = engagementCount >= condition.threshold
          break

        case 'quality_score':
          // Quality score hesaplama (verified engagements / total engagements)
          const total = await UserTweetEngagement.countDocuments({ userId: user._id })
          const verified = await UserTweetEngagement.countDocuments({
            userId: user._id,
            status: 'verified',
          })
          const qualityScore = total > 0 ? (verified / total) * 100 : 0
          meetsCondition = qualityScore >= condition.threshold
          break

        case 'time_based':
          // Zaman bazlı bonus (örn: ilk 24 saat içinde)
          // TODO: Tweet creation time ile compare et
          break

        case 'streak':
          // Ardışık gün streak kontrolü
          // TODO: Implement streak tracking
          break
      }

      if (meetsCondition) {
        bonusPoints += condition.bonusPoints
      }
    }

    return bonusPoints
  }

  /**
   * Multiplier hesapla
   */
  private calculateMultiplier(criterion: IEngagementCriteria): number {
    if (!criterion.multipliers || criterion.multipliers.length === 0) {
      return 1
    }

    const now = new Date()
    let multiplier = 1

    for (const mult of criterion.multipliers) {
      // Zaman kontrolü
      if (mult.validFrom && now < mult.validFrom) continue
      if (mult.validUntil && now > mult.validUntil) continue

      // Condition kontrolü
      let applies = false

      switch (mult.condition) {
        case 'weekend':
          const day = now.getDay()
          applies = day === 0 || day === 6 // Pazar veya Cumartesi
          break

        case 'campaign':
        case 'special_event':
          // Zaman aralığı kontrolü yeterli
          applies = true
          break
      }

      if (applies) {
        multiplier *= mult.multiplier
      }
    }

    return multiplier
  }

  /**
   * Puan hesaplama sebebini açıkla
   */
  private generateReason(
    criterion: IEngagementCriteria,
    bonusPoints: number,
    multiplier: number
  ): string {
    let reason = `${criterion.name} criteria applied`

    if (bonusPoints > 0) {
      reason += ` (+${bonusPoints} bonus)`
    }

    if (multiplier > 1) {
      reason += ` (x${multiplier} multiplier)`
    }

    return reason
  }

  /**
   * Günlük limit kontrolü
   */
  async checkDailyLimit(userId: string, criterionId: string): Promise<boolean> {
    const criterion = await EngagementCriteria.findById(criterionId)
    if (!criterion || !criterion.requirements?.maxDailyActions) {
      return true // Limit yok
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const count = await UserTweetEngagement.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      'pointsBreakdown.criteriaId': new mongoose.Types.ObjectId(criterionId),
      createdAt: { $gte: today },
    })

    return count < criterion.requirements.maxDailyActions
  }

  /**
   * Cooldown kontrolü
   */
  async checkCooldown(userId: string, criterionId: string): Promise<boolean> {
    const criterion = await EngagementCriteria.findById(criterionId)
    if (!criterion || !criterion.requirements?.cooldownMinutes) {
      return true // Cooldown yok
    }

    const cooldownMs = criterion.requirements.cooldownMinutes * 60 * 1000
    const cooldownStart = new Date(Date.now() - cooldownMs)

    const recentEngagement = await UserTweetEngagement.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      'pointsBreakdown.criteriaId': new mongoose.Types.ObjectId(criterionId),
      createdAt: { $gte: cooldownStart },
    })

    return !recentEngagement
  }
}

export const pointsCalculationService = new PointsCalculationService()
