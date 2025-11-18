import { Request, Response } from 'express'
import { EngagementCriteria } from '../models/EngagementCriteria.model'
import { logger } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * EngagementCriteriaController - Admin yönetimi için engagement criteria CRUD
 */

export class EngagementCriteriaController {
  /**
   * Tüm kriterleri listele
   */
  async getAllCriteria(req: Request, res: Response): Promise<void> {
    try {
      const { isActive, criteriaType } = req.query

      const filter: any = {}
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true'
      }
      if (criteriaType) {
        filter.criteriaType = criteriaType
      }

      const criteria = await EngagementCriteria.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')

      res.json({
        success: true,
        data: criteria,
      })
    } catch (error: any) {
      logger.error('Error fetching engagement criteria:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement criteria',
        error: error.message,
      })
    }
  }

  /**
   * Tek bir kriterin detayını getir
   */
  async getCriteriaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid criteria ID',
        })
        return
      }

      const criteria = await EngagementCriteria.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')

      if (!criteria) {
        res.status(404).json({
          success: false,
          message: 'Engagement criteria not found',
        })
        return
      }

      res.json({
        success: true,
        data: criteria,
      })
    } catch (error: any) {
      logger.error('Error fetching engagement criteria:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement criteria',
        error: error.message,
      })
    }
  }

  /**
   * Yeni kriter oluştur
   */
  async createCriteria(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id

      const {
        name,
        description,
        criteriaType,
        pointsConfig,
        requirements,
        timeConstraints,
        multipliers,
        isActive,
        priority,
      } = req.body

      // Validation
      if (!name || !description || !criteriaType || !pointsConfig) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, description, criteriaType, pointsConfig',
        })
        return
      }

      if (!pointsConfig.basePoints || pointsConfig.basePoints < 0) {
        res.status(400).json({
          success: false,
          message: 'basePoints must be a positive number',
        })
        return
      }

      // Validate criteriaType
      const validTypes = ['like', 'retweet', 'quote', 'reply', 'bookmark', 'view', 'custom']
      if (!validTypes.includes(criteriaType)) {
        res.status(400).json({
          success: false,
          message: `Invalid criteriaType. Must be one of: ${validTypes.join(', ')}`,
        })
        return
      }

      const criteria = new EngagementCriteria({
        name,
        description,
        criteriaType,
        pointsConfig,
        requirements: requirements || {},
        timeConstraints: timeConstraints || undefined,
        multipliers: multipliers || [],
        isActive: isActive !== undefined ? isActive : true,
        priority: priority !== undefined ? priority : 0,
        createdBy: userId,
        updatedBy: userId,
      })

      await criteria.save()

      logger.info(`Engagement criteria created: ${criteria._id} by user ${userId}`)

      res.status(201).json({
        success: true,
        message: 'Engagement criteria created successfully',
        data: criteria,
      })
    } catch (error: any) {
      logger.error('Error creating engagement criteria:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create engagement criteria',
        error: error.message,
      })
    }
  }

  /**
   * Kriterleri güncelle
   */
  async updateCriteria(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid criteria ID',
        })
        return
      }

      const criteria = await EngagementCriteria.findById(id)

      if (!criteria) {
        res.status(404).json({
          success: false,
          message: 'Engagement criteria not found',
        })
        return
      }

      const {
        name,
        description,
        criteriaType,
        pointsConfig,
        requirements,
        timeConstraints,
        multipliers,
        isActive,
        priority,
      } = req.body

      // Update fields
      if (name !== undefined) criteria.name = name
      if (description !== undefined) criteria.description = description
      if (criteriaType !== undefined) {
        const validTypes = ['like', 'retweet', 'quote', 'reply', 'bookmark', 'view', 'custom']
        if (!validTypes.includes(criteriaType)) {
          res.status(400).json({
            success: false,
            message: `Invalid criteriaType. Must be one of: ${validTypes.join(', ')}`,
          })
          return
        }
        criteria.criteriaType = criteriaType
      }
      if (pointsConfig !== undefined) {
        if (pointsConfig.basePoints < 0) {
          res.status(400).json({
            success: false,
            message: 'basePoints must be a positive number',
          })
          return
        }
        criteria.pointsConfig = pointsConfig
      }
      if (requirements !== undefined) criteria.requirements = requirements
      if (timeConstraints !== undefined) criteria.timeConstraints = timeConstraints
      if (multipliers !== undefined) criteria.multipliers = multipliers
      if (isActive !== undefined) criteria.isActive = isActive
      if (priority !== undefined) criteria.priority = priority

      criteria.updatedBy = new mongoose.Types.ObjectId(userId)

      await criteria.save()

      logger.info(`Engagement criteria updated: ${criteria._id} by user ${userId}`)

      res.json({
        success: true,
        message: 'Engagement criteria updated successfully',
        data: criteria,
      })
    } catch (error: any) {
      logger.error('Error updating engagement criteria:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update engagement criteria',
        error: error.message,
      })
    }
  }

  /**
   * Kriterleri sil
   */
  async deleteCriteria(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid criteria ID',
        })
        return
      }

      const criteria = await EngagementCriteria.findById(id)

      if (!criteria) {
        res.status(404).json({
          success: false,
          message: 'Engagement criteria not found',
        })
        return
      }

      await criteria.deleteOne()

      logger.info(`Engagement criteria deleted: ${id} by user ${userId}`)

      res.json({
        success: true,
        message: 'Engagement criteria deleted successfully',
      })
    } catch (error: any) {
      logger.error('Error deleting engagement criteria:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete engagement criteria',
        error: error.message,
      })
    }
  }

  /**
   * Kriterleri aktif/pasif yap (toggle)
   */
  async toggleCriteria(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid criteria ID',
        })
        return
      }

      const criteria = await EngagementCriteria.findById(id)

      if (!criteria) {
        res.status(404).json({
          success: false,
          message: 'Engagement criteria not found',
        })
        return
      }

      criteria.isActive = !criteria.isActive
      criteria.updatedBy = new mongoose.Types.ObjectId(userId)
      await criteria.save()

      logger.info(`Engagement criteria toggled: ${id} (${criteria.isActive ? 'active' : 'inactive'}) by user ${userId}`)

      res.json({
        success: true,
        message: `Engagement criteria ${criteria.isActive ? 'activated' : 'deactivated'} successfully`,
        data: criteria,
      })
    } catch (error: any) {
      logger.error('Error toggling engagement criteria:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to toggle engagement criteria',
        error: error.message,
      })
    }
  }
}

export const engagementCriteriaController = new EngagementCriteriaController()
