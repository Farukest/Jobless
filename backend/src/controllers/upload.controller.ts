import { Request, Response, NextFunction } from 'express'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { FileProcessor } from '../utils/file-processor'
import { configHelper } from '../utils/config-helper'

/**
 * @desc    Upload single file
 * @route   POST /api/upload/single
 * @access  Private
 */
export const uploadSingle = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400))
    }

    const fileUrl = FileProcessor.getFileUrl(req.file.path)

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path,
      },
    })
  }
)

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple
 * @access  Private
 */
export const uploadMultiple = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return next(new AppError('No files uploaded', 400))
    }

    const files = req.files as Express.Multer.File[]

    const fileData = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: FileProcessor.getFileUrl(file.path),
      path: file.path,
    }))

    res.status(200).json({
      success: true,
      count: fileData.length,
      data: fileData,
    })
  }
)

/**
 * @desc    Upload and process image
 * @route   POST /api/upload/image
 * @access  Private
 */
export const uploadImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('No image uploaded', 400))
    }

    // Validate image type
    const allowedTypes = await configHelper.get('allowed_image_types')
    if (!allowedTypes.includes(req.file.mimetype)) {
      FileProcessor.deleteFile(req.file.path)
      return next(new AppError('Invalid image type', 400))
    }

    // Process image
    const processedPath = await FileProcessor.processImage(req.file.path, {
      width: 1920,
      quality: 85,
      format: 'webp',
    })

    // Generate thumbnail
    const thumbnailPath = await FileProcessor.generateThumbnail(processedPath)

    const imageUrl = FileProcessor.getFileUrl(processedPath)
    const thumbnailUrl = FileProcessor.getFileUrl(thumbnailPath)

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        thumbnailUrl,
        path: processedPath,
        thumbnailPath,
      },
    })
  }
)

/**
 * @desc    Upload profile picture
 * @route   POST /api/upload/profile-picture
 * @access  Private
 */
export const uploadProfilePicture = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('No image uploaded', 400))
    }

    // Validate image type
    const allowedTypes = await configHelper.get('allowed_image_types')
    if (!allowedTypes.includes(req.file.mimetype)) {
      FileProcessor.deleteFile(req.file.path)
      return next(new AppError('Invalid image type', 400))
    }

    // Process image - resize to profile picture size
    const processedPath = await FileProcessor.processImage(req.file.path, {
      width: 400,
      height: 400,
      quality: 90,
      format: 'webp',
    })

    const imageUrl = FileProcessor.getFileUrl(processedPath)

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        path: processedPath,
      },
    })
  }
)

/**
 * @desc    Delete file
 * @route   DELETE /api/upload/:filename
 * @access  Private
 */
export const deleteFile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { filename } = req.params
    const uploadType = req.query.type as string || 'general'

    const filePath = `uploads/${uploadType}/${filename}`

    FileProcessor.deleteFile(filePath)

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    })
  }
)
