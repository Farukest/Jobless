import jwt from 'jsonwebtoken'

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }

  return (jwt as any).sign(
    { id: userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRY || '1h' }
  )
}

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables')
  }

  return (jwt as any).sign(
    { id: userId },
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  )
}

export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables')
  }

  return (jwt as any).verify(token, secret)
}
