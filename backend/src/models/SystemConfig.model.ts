import mongoose, { Document, Schema } from 'mongoose'

/**
 * SystemConfig Model - Stores all dynamic configuration values
 * This replaces hardcoded enums with admin-manageable options
 */

export interface ISystemConfig extends Document {
  configKey: string
  configType: 'enum' | 'list' | 'object' | 'boolean' | 'number' | 'string'
  value: any
  description?: string
  isActive: boolean
  updatedBy?: mongoose.Types.ObjectId
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    configType: {
      type: String,
      required: true,
      enum: ['enum', 'list', 'object', 'boolean', 'number', 'string'],
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// Index for fast lookups
SystemConfigSchema.index({ configKey: 1, isActive: 1 })

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema)

/**
 * Default System Configurations
 * These will be seeded into the database on first run
 */
export const DEFAULT_SYSTEM_CONFIGS = [
  // Content Categories
  {
    configKey: 'content_categories',
    configType: 'list',
    value: ['airdrop', 'defi', 'nft', 'node', 'trading', 'tutorial', 'guide', 'news', 'other'],
    description: 'Available content categories for J Hub',
  },
  // Content Types
  {
    configKey: 'content_types',
    configType: 'list',
    value: ['video', 'thread', 'podcast', 'guide', 'tutorial'],
    description: 'Available content types for J Hub',
  },
  // Difficulty Levels
  {
    configKey: 'difficulty_levels',
    configType: 'list',
    value: ['beginner', 'intermediate', 'advanced'],
    description: 'Difficulty levels for content and courses',
  },
  // Production Request Types (J Studio)
  {
    configKey: 'production_request_types',
    configType: 'list',
    value: ['cover_design', 'video_edit', 'logo_design', 'animation', 'banner_design', 'thumbnail', 'infographic', 'other'],
    description: 'Available production request types for J Studio',
  },
  // Platforms
  {
    configKey: 'platforms',
    configType: 'list',
    value: ['twitter', 'farcaster', 'youtube', 'instagram', 'tiktok', 'linkedin', 'other'],
    description: 'Supported social media platforms',
  },
  // Course Categories (J Academy)
  {
    configKey: 'course_categories',
    configType: 'list',
    value: ['design', 'video_editing', 'crypto_twitter', 'defi', 'node_setup', 'ai_tools', 'trading', 'development', 'research', 'other'],
    description: 'Available course categories for J Academy',
  },
  // Course Content Types
  {
    configKey: 'course_content_types',
    configType: 'list',
    value: ['video', 'text', 'quiz', 'assignment', 'live_session'],
    description: 'Types of course content',
  },
  // Engagement Types (J Info)
  {
    configKey: 'engagement_types',
    configType: 'list',
    value: ['like', 'retweet', 'comment', 'mention', 'follow', 'quote_tweet', 'share'],
    description: 'Types of social media engagement',
  },
  // Required Actions (J Info) - Dynamic field for campaigns
  {
    configKey: 'engagement_required_actions',
    configType: 'list',
    value: ['like', 'retweet', 'comment', 'mention', 'follow', 'tag_friends', 'quote_tweet', 'join_discord', 'verify_wallet'],
    description: 'Available required actions for engagement campaigns',
  },
  // Alpha Categories (J Alpha)
  {
    configKey: 'alpha_categories',
    configType: 'list',
    value: ['airdrop_radar', 'testnet_tracker', 'memecoin_calls', 'defi_signals', 'nft_mint', 'node_opportunity'],
    description: 'Categories for alpha posts',
  },
  // Alpha Potential Ratings
  {
    configKey: 'alpha_potential_ratings',
    configType: 'list',
    value: ['low', 'medium', 'high', 'very_high'],
    description: 'Potential rating levels for alpha posts',
  },
  // Alpha Risk Ratings
  {
    configKey: 'alpha_risk_ratings',
    configType: 'list',
    value: ['low', 'medium', 'high', 'very_high'],
    description: 'Risk rating levels for alpha posts',
  },
  // Blockchains
  {
    configKey: 'supported_blockchains',
    configType: 'list',
    value: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche', 'solana', 'sui', 'aptos', 'other'],
    description: 'Supported blockchain networks',
  },
  // User Roles
  {
    configKey: 'user_roles',
    configType: 'list',
    value: ['member', 'content_creator', 'admin', 'super_admin', 'scout', 'mentor', 'learner', 'requester', 'designer', 'editor'],
    description: 'Available user roles in the system',
  },
  // Link Types
  {
    configKey: 'link_types',
    configType: 'list',
    value: ['website', 'twitter', 'discord', 'docs', 'telegram', 'github', 'medium', 'youtube'],
    description: 'Types of links that can be added',
  },
  // File Types - Images
  {
    configKey: 'allowed_image_types',
    configType: 'list',
    value: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    description: 'Allowed image MIME types',
  },
  // File Types - Videos
  {
    configKey: 'allowed_video_types',
    configType: 'list',
    value: ['video/mp4', 'video/webm', 'video/quicktime'],
    description: 'Allowed video MIME types',
  },
  // File Types - Documents
  {
    configKey: 'allowed_document_types',
    configType: 'list',
    value: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    description: 'Allowed document MIME types',
  },
  // Max File Sizes (in bytes)
  {
    configKey: 'max_file_sizes',
    configType: 'object',
    value: {
      image: 5242880, // 5MB
      video: 104857600, // 100MB
      document: 10485760, // 10MB
      audio: 52428800, // 50MB
    },
    description: 'Maximum file sizes for different file types',
  },
  // Points System
  {
    configKey: 'points_config',
    configType: 'object',
    value: {
      content_created: 10,
      content_featured: 50,
      engagement_given: 2,
      engagement_received: 1,
      alpha_validated: 25,
      course_completed: 30,
      production_completed: 20,
      daily_login: 1,
    },
    description: 'Points awarded for different actions',
  },
  // Feature Flags
  {
    configKey: 'feature_flags',
    configType: 'object',
    value: {
      enable_j_hub: true,
      enable_j_studio: true,
      enable_j_academy: true,
      enable_j_info: true,
      enable_j_alpha: true,
      enable_notifications: true,
      enable_rewards: true,
      enable_live_sessions: true,
    },
    description: 'Feature toggles for modules',
  },
]
