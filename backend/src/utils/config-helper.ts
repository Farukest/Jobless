import { SystemConfig } from '../models/SystemConfig.model'
import { logger } from './logger'

/**
 * ConfigHelper - Utility for retrieving dynamic configuration values
 */
class ConfigHelper {
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  /**
   * Get configuration value by key
   */
  async get(key: string, useCache = true): Promise<any> {
    if (useCache && this.cache.has(key)) {
      return this.cache.get(key)
    }

    try {
      const config = await SystemConfig.findOne({
        configKey: key,
        isActive: true,
      })

      if (!config) {
        logger.warn(`Configuration key not found: ${key}`)
        return null
      }

      this.cache.set(key, config.value)

      // Auto-clear cache after timeout
      setTimeout(() => {
        this.cache.delete(key)
      }, this.cacheTimeout)

      return config.value
    } catch (error) {
      logger.error(`Error fetching config ${key}:`, error)
      return null
    }
  }

  /**
   * Get multiple configurations at once
   */
  async getMultiple(keys: string[]): Promise<{ [key: string]: any }> {
    const result: { [key: string]: any } = {}

    for (const key of keys) {
      result[key] = await this.get(key)
    }

    return result
  }

  /**
   * Validate if a value exists in a list configuration
   */
  async validateEnum(configKey: string, value: string): Promise<boolean> {
    const allowedValues = await this.get(configKey)

    if (!Array.isArray(allowedValues)) {
      logger.warn(`Config ${configKey} is not a list`)
      return false
    }

    return allowedValues.includes(value)
  }

  /**
   * Validate multiple values against a list configuration
   */
  async validateEnumArray(configKey: string, values: string[]): Promise<boolean> {
    const allowedValues = await this.get(configKey)

    if (!Array.isArray(allowedValues)) {
      return false
    }

    return values.every(value => allowedValues.includes(value))
  }

  /**
   * Get all configurations (for admin panel)
   */
  async getAll(): Promise<any[]> {
    try {
      const configs = await SystemConfig.find({ isActive: true }).sort({ configKey: 1 })
      return configs
    } catch (error) {
      logger.error('Error fetching all configs:', error)
      return []
    }
  }

  /**
   * Update configuration value
   */
  async update(key: string, value: any, updatedBy?: string): Promise<boolean> {
    try {
      const config = await SystemConfig.findOneAndUpdate(
        { configKey: key },
        {
          value,
          updatedBy,
          updatedAt: new Date(),
        },
        { new: true }
      )

      if (config) {
        // Clear cache
        this.cache.delete(key)
        logger.info(`Configuration updated: ${key}`)
        return true
      }

      return false
    } catch (error) {
      logger.error(`Error updating config ${key}:`, error)
      return false
    }
  }

  /**
   * Add new value to a list configuration
   */
  async addToList(key: string, value: string, updatedBy?: string): Promise<boolean> {
    try {
      const config = await SystemConfig.findOne({ configKey: key })

      if (!config || !Array.isArray(config.value)) {
        return false
      }

      if (config.value.includes(value)) {
        logger.warn(`Value ${value} already exists in ${key}`)
        return false
      }

      config.value.push(value)
      config.updatedBy = updatedBy as any
      await config.save()

      // Clear cache
      this.cache.delete(key)
      logger.info(`Added ${value} to ${key}`)
      return true
    } catch (error) {
      logger.error(`Error adding to list ${key}:`, error)
      return false
    }
  }

  /**
   * Remove value from a list configuration
   */
  async removeFromList(key: string, value: string, updatedBy?: string): Promise<boolean> {
    try {
      const config = await SystemConfig.findOne({ configKey: key })

      if (!config || !Array.isArray(config.value)) {
        return false
      }

      config.value = config.value.filter((v: string) => v !== value)
      config.updatedBy = updatedBy as any
      await config.save()

      // Clear cache
      this.cache.delete(key)
      logger.info(`Removed ${value} from ${key}`)
      return true
    } catch (error) {
      logger.error(`Error removing from list ${key}:`, error)
      return false
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
    logger.info('Configuration cache cleared')
  }
}

export const configHelper = new ConfigHelper()
