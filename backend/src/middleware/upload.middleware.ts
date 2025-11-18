import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import { AppError } from './error-handler'

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = (req as any).uploadType || 'general'
    const dest = path.join(uploadDir, uploadType)

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    cb(null, dest)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const nameWithoutExt = path.basename(file.originalname, ext)
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-')
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`)
  },
})

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Basic validation - detailed validation happens in middleware
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Audio
    'audio/mpeg',
    'audio/wav',
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Invalid file type', 400))
  }
}

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (will be refined by middleware)
  },
})

// Upload configurations for different scenarios
export const uploadConfig = {
  // Single file upload
  single: (fieldName: string) => upload.single(fieldName),

  // Multiple files with same field name
  array: (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount),

  // Multiple files with different field names
  fields: (fields: { name: string; maxCount: number }[]) => upload.fields(fields),

  // Any files
  any: () => upload.any(),
}

// Middleware to set upload type
export const setUploadType = (type: string) => {
  return (req: Request, res: any, next: any) => {
    ;(req as any).uploadType = type
    next()
  }
}
