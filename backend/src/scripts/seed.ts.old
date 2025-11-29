import dotenv from 'dotenv'
import { connectDB } from '../config/database'
import { SystemConfig, DEFAULT_SYSTEM_CONFIGS } from '../models/SystemConfig.model'
import { SiteSettings } from '../models/SiteSettings.model'
import { User } from '../models/User.model'
import { Content } from '../models/Content.model'
import { logger } from '../utils/logger'

dotenv.config({ path: '../../.env' })

async function seedDatabase() {
  try {
    await connectDB()

    logger.info('Starting database seeding...')

    // 1. Seed System Configurations
    logger.info('Seeding system configurations...')
    for (const config of DEFAULT_SYSTEM_CONFIGS) {
      const exists = await SystemConfig.findOne({ configKey: config.configKey })

      if (!exists) {
        await SystemConfig.create(config)
        logger.info(`Created config: ${config.configKey}`)
      } else {
        logger.info(`Config already exists: ${config.configKey}`)
      }
    }

    // 2. Seed Site Settings
    logger.info('Seeding site settings...')
    const siteSettings = await SiteSettings.findOne()

    if (!siteSettings) {
      await SiteSettings.create({
        header: {
          logoUrl: '',
          logoText: 'Jobless',
          navigationItems: [
            {
              label: 'Hub',
              url: '/hub',
              order: 1,
              isExternal: false,
              showForRoles: ['member'],
            },
            {
              label: 'Studio',
              url: '/studio',
              order: 2,
              isExternal: false,
              showForRoles: ['member'],
            },
            {
              label: 'Academy',
              url: '/academy',
              order: 3,
              isExternal: false,
              showForRoles: ['member'],
            },
            {
              label: 'Info',
              url: '/info',
              order: 4,
              isExternal: false,
              showForRoles: ['member'],
            },
            {
              label: 'Alpha',
              url: '/alpha',
              order: 5,
              isExternal: false,
              showForRoles: ['member'],
            },
          ],
        },
        footer: {
          logoUrl: '',
          description: 'Comprehensive Web3 Ecosystem Platform',
          socialLinks: [
            {
              platform: 'twitter',
              url: 'https://twitter.com/jobless',
              icon: 'twitter',
            },
            {
              platform: 'github',
              url: 'https://github.com/jobless',
              icon: 'github',
            },
          ],
          footerLinks: [
            {
              title: 'Product',
              links: [
                { label: 'Hub', url: '/hub' },
                { label: 'Studio', url: '/studio' },
                { label: 'Academy', url: '/academy' },
                { label: 'Info', url: '/info' },
                { label: 'Alpha', url: '/alpha' },
              ],
            },
            {
              title: 'Resources',
              links: [
                { label: 'Documentation', url: '/docs' },
                { label: 'Help Center', url: '/help' },
                { label: 'Terms', url: '/terms' },
                { label: 'Privacy', url: '/privacy' },
              ],
            },
          ],
        },
        theme: {
          primaryColor: '#000000',
          secondaryColor: '#ffffff',
          accentColor: '#0066ff',
        },
        modules: {
          jHub: {
            enabled: true,
            requiredRoles: ['member'],
            settings: {},
          },
          jStudio: {
            enabled: true,
            requiredRoles: ['member'],
            settings: {},
          },
          jCenter: {
            enabled: true,
            settings: {},
          },
          jAcademy: {
            enabled: true,
            requiredRoles: ['member'],
            settings: {},
          },
          jInfo: {
            enabled: true,
            requiredRoles: ['member'],
            settings: {},
          },
          jAlpha: {
            enabled: true,
            requiredRoles: ['member'],
            settings: {},
          },
        },
        siteName: 'Jobless Ecosystem',
        siteDescription: 'Comprehensive Web3 Ecosystem Platform',
        maintenanceMode: false,
      })
      logger.info('Site settings created')
    } else {
      logger.info('Site settings already exist')
    }

    // 3. Create Super Admin (wallet or Twitter)
    // Hardcoded super admin wallet address
    const SUPER_ADMIN_WALLET = '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9'

    logger.info('Checking for super admin by wallet...')
    let superAdmin = await User.findOne({
      walletAddress: SUPER_ADMIN_WALLET.toLowerCase(),
    })

    if (!superAdmin) {
      // Create new super admin with wallet
      await User.create({
        walletAddress: SUPER_ADMIN_WALLET.toLowerCase(),
        displayName: 'Super Admin',
        roles: ['super_admin', 'admin', 'content_creator', 'scout', 'mentor', 'learner', 'requester', 'member'],
        permissions: {
          canAccessJHub: true,
          canAccessJStudio: true,
          canAccessJAcademy: true,
          canAccessJInfo: true,
          canAccessJAlpha: true,
          canCreateContent: true,
          canModerateContent: true,
          canManageUsers: true,
          canManageRoles: true,
          canManageSiteSettings: true,
          customPermissions: ['full_access'],
        },
        status: 'active',
      })
      logger.info(`Super admin created with wallet: ${SUPER_ADMIN_WALLET}`)
    } else {
      // Update existing user to super admin with all permissions
      superAdmin.roles = ['super_admin', 'admin', 'content_creator', 'scout', 'mentor', 'learner', 'requester', 'member']
      superAdmin.permissions = {
        canAccessJHub: true,
        canAccessJStudio: true,
        canAccessJAcademy: true,
        canAccessJInfo: true,
        canAccessJAlpha: true,
        canCreateContent: true,
        canModerateContent: true,
        canManageUsers: true,
        canManageRoles: true,
        canManageSiteSettings: true,
        customPermissions: ['full_access'],
      }
      await superAdmin.save()
      logger.info(`Super admin updated with wallet: ${SUPER_ADMIN_WALLET}`)
    }

    // Also handle Twitter-based super admin (if env variable is set)
    if (process.env.SUPER_ADMIN_TWITTER_ID) {
      logger.info('Checking for super admin by Twitter ID...')
      const twitterSuperAdmin = await User.findOne({
        twitterId: process.env.SUPER_ADMIN_TWITTER_ID,
      })

      if (!twitterSuperAdmin) {
        await User.create({
          twitterId: process.env.SUPER_ADMIN_TWITTER_ID,
          twitterUsername: 'superadmin',
          displayName: 'Super Admin (Twitter)',
          roles: ['super_admin', 'admin', 'content_creator', 'scout', 'mentor', 'learner', 'requester', 'member'],
          permissions: {
            canAccessJHub: true,
            canAccessJStudio: true,
            canAccessJAcademy: true,
            canAccessJInfo: true,
            canAccessJAlpha: true,
            canCreateContent: true,
            canModerateContent: true,
            canManageUsers: true,
            canManageRoles: true,
            canManageSiteSettings: true,
            customPermissions: ['full_access'],
          },
          isTwitterVerified: true,
          status: 'active',
        })
        logger.info('Twitter super admin created')
      } else {
        twitterSuperAdmin.roles = ['super_admin', 'admin', 'content_creator', 'scout', 'mentor', 'learner', 'requester', 'member']
        twitterSuperAdmin.permissions = {
          canAccessJHub: true,
          canAccessJStudio: true,
          canAccessJAcademy: true,
          canAccessJInfo: true,
          canAccessJAlpha: true,
          canCreateContent: true,
          canModerateContent: true,
          canManageUsers: true,
          canManageRoles: true,
          canManageSiteSettings: true,
          customPermissions: ['full_access'],
        }
        await twitterSuperAdmin.save()
        logger.info('Twitter super admin updated')
      }
    }

    // 4. Create Sample Content for J Hub
    logger.info('Creating sample content for J Hub...')
    const contentCount = await Content.countDocuments()

    if (contentCount === 0 && superAdmin) {
      const sampleContents = [
        {
          title: 'Web3 Airdrop Hunting Guide 2024',
          description: 'Complete guide to finding and participating in the best airdrops. Learn how to identify legitimate projects and maximize your rewards.',
          contentType: 'guide',
          category: 'airdrop',
          difficulty: 'beginner',
          tags: ['airdrop', 'web3', 'crypto', 'tutorial'],
          contentUrl: 'https://example.com/airdrop-guide',
          authorId: superAdmin._id,
          status: 'published',
          isFeatured: true,
          views: 245,
          likes: 42,
          bookmarks: 18,
        },
        {
          title: 'DeFi Yield Farming Strategies',
          description: 'Advanced strategies for maximizing your DeFi yields. Covering liquidity pools, impermanent loss, and risk management.',
          contentType: 'tutorial',
          category: 'defi',
          difficulty: 'advanced',
          tags: ['defi', 'yield', 'farming', 'strategy'],
          contentUrl: 'https://example.com/defi-yield',
          authorId: superAdmin._id,
          status: 'published',
          isFeatured: true,
          views: 189,
          likes: 34,
          bookmarks: 29,
        },
        {
          title: 'Running Your First Validator Node',
          description: 'Step-by-step tutorial on setting up and running a blockchain validator node. Covering hardware requirements, setup, and maintenance.',
          contentType: 'video',
          category: 'node',
          difficulty: 'intermediate',
          tags: ['node', 'validator', 'blockchain', 'infrastructure'],
          contentUrl: 'https://example.com/validator-node',
          authorId: superAdmin._id,
          status: 'published',
          isFeatured: true,
          views: 312,
          likes: 67,
          bookmarks: 45,
        },
        {
          title: 'NFT Trading Psychology & Market Analysis',
          description: 'Understanding market psychology in NFT trading. Learn to identify trends, avoid FOMO, and make data-driven decisions.',
          contentType: 'thread',
          category: 'nft',
          difficulty: 'intermediate',
          tags: ['nft', 'trading', 'psychology', 'market'],
          contentUrl: 'https://twitter.com/jobless/status/123',
          authorId: superAdmin._id,
          status: 'published',
          views: 156,
          likes: 28,
          bookmarks: 12,
        },
        {
          title: 'Web3 Security Best Practices',
          description: 'Essential security practices for Web3 users. Covering wallet security, smart contract risks, and phishing prevention.',
          contentType: 'guide',
          category: 'tutorial',
          difficulty: 'beginner',
          tags: ['security', 'web3', 'safety', 'wallets'],
          contentUrl: 'https://example.com/security-guide',
          authorId: superAdmin._id,
          status: 'published',
          views: 423,
          likes: 89,
          bookmarks: 67,
        },
        {
          title: 'Latest Crypto Market News - Weekly Roundup',
          description: 'Weekly summary of the most important crypto market events, regulatory updates, and project launches.',
          contentType: 'podcast',
          category: 'news',
          difficulty: 'beginner',
          tags: ['news', 'market', 'crypto', 'weekly'],
          contentUrl: 'https://example.com/podcast-ep1',
          authorId: superAdmin._id,
          status: 'published',
          views: 98,
          likes: 15,
          bookmarks: 8,
        },
      ]

      for (const content of sampleContents) {
        await Content.create(content)
        logger.info(`Created sample content: ${content.title}`)
      }

      logger.info(`Created ${sampleContents.length} sample contents`)
    } else {
      logger.info(`Content already exists (${contentCount} items)`)
    }

    logger.info('Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    logger.error('Database seeding failed:', error)
    process.exit(1)
  }
}

seedDatabase()
