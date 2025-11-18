import { body, param, query, ValidationChain } from 'express-validator'

// Common validators
export const validateMongoId = (field: string): ValidationChain => {
  return param(field).isMongoId().withMessage(`Invalid ${field}`)
}

export const validateEmail = (): ValidationChain => {
  return body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
}

export const validateRequired = (field: string): ValidationChain => {
  return body(field).notEmpty().withMessage(`${field} is required`)
}

export const sanitizeInput = (field: string): ValidationChain => {
  return body(field).trim().escape()
}

// Pagination validators
export const validatePagination = (): ValidationChain[] => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]
}

// File upload validators
export const validateFileUpload = (
  field: string,
  allowedTypes: string[]
): ValidationChain => {
  return body(field).custom((value, { req }) => {
    if (!req.file) {
      throw new Error('No file uploaded')
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
    }

    return true
  })
}

// Wallet address validator
export const validateWalletAddress = (): ValidationChain => {
  return body('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum wallet address')
}

// URL validator
export const validateURL = (field: string): ValidationChain => {
  return body(field).isURL().withMessage(`${field} must be a valid URL`)
}
