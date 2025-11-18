import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { logger } from './logger'

export class FileProcessor {
  /**
   * Process and optimize image
   */
  static async processImage(
    filePath: string,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'jpeg' | 'png' | 'webp'
    }
  ): Promise<string> {
    try {
      const outputPath = filePath.replace(
        path.extname(filePath),
        `-processed${path.extname(filePath)}`
      )

      let processor = sharp(filePath)

      // Resize if dimensions provided
      if (options?.width || options?.height) {
        processor = processor.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
      }

      // Convert format if specified
      if (options?.format) {
        processor = processor.toFormat(options.format, {
          quality: options.quality || 80,
        })
      }

      // Optimize
      await processor.toFile(outputPath)

      // Delete original
      fs.unlinkSync(filePath)

      logger.info(`Image processed: ${outputPath}`)
      return outputPath
    } catch (error) {
      logger.error('Image processing error:', error)
      throw error
    }
  }

  /**
   * Generate thumbnail for image
   */
  static async generateThumbnail(
    filePath: string,
    width = 200,
    height = 200
  ): Promise<string> {
    try {
      const thumbnailPath = filePath.replace(
        path.extname(filePath),
        `-thumb${path.extname(filePath)}`
      )

      await sharp(filePath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .toFormat('jpeg', { quality: 70 })
        .toFile(thumbnailPath)

      logger.info(`Thumbnail generated: ${thumbnailPath}`)
      return thumbnailPath
    } catch (error) {
      logger.error('Thumbnail generation error:', error)
      throw error
    }
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(filePath: string): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(filePath).metadata()
      return metadata
    } catch (error) {
      logger.error('Error getting image metadata:', error)
      throw error
    }
  }

  /**
   * Validate image
   */
  static async validateImage(
    filePath: string,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<boolean> {
    try {
      const metadata = await this.getImageMetadata(filePath)

      if (maxWidth && metadata.width && metadata.width > maxWidth) {
        return false
      }

      if (maxHeight && metadata.height && metadata.height > maxHeight) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Delete file
   */
  static deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        logger.info(`File deleted: ${filePath}`)
      }
    } catch (error) {
      logger.error('Error deleting file:', error)
    }
  }

  /**
   * Get file size
   */
  static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath)
      return stats.size
    } catch (error) {
      logger.error('Error getting file size:', error)
      return 0
    }
  }

  /**
   * Get file URL
   */
  static getFileUrl(filePath: string, baseUrl?: string): string {
    const relativePath = filePath.replace(
      path.join(__dirname, '../../uploads'),
      ''
    )
    const url = baseUrl || process.env.BACKEND_URL || 'http://localhost:5000'
    return `${url}/uploads${relativePath.replace(/\\/g, '/')}`
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    const ext = path.extname(filename)
    const name = path.basename(filename, ext)
    const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
    return `${sanitized}${ext}`
  }
}
