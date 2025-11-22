// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import express, { Application } from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import passport from './config/passport'
import { connectDB } from './config/database'
import { errorHandler } from './middleware/error-handler'
import { logger } from './utils/logger'
import routes from './routes'
import { setupSocketIO } from './socket'

const app: Application = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
app.use(cors({
  origin: [
    process.env.APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
}))

// Rate limiting - Disabled in development, strict in production
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 15) * 60 * 1000,
  max: process.env.NODE_ENV === 'production'
    ? (process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100)
    : 10000, // Very high limit in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression
app.use(compression())

// MongoDB sanitization
app.use(mongoSanitize())

// Passport initialization
app.use(passport.initialize())

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Static file serving for uploads
app.use('/uploads', express.static('uploads'))

// API routes
app.use('/api', routes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB()

    // Setup Socket.IO
    setupSocketIO(httpServer)
    logger.info('WebSocket server initialized')

    httpServer.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

export default app

 
// Force restart
