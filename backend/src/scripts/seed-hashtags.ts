import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { Hashtag } from '../models/Hashtag.model'
import { Content } from '../models/Content.model'
import { User } from '../models/User.model'
import { Role } from '../models/Role.model'

// Load environment variables
dotenv.config()

// Default hashtags based on Jobless project theme
const DEFAULT_HASHTAGS = [
  // Crypto & Web3
  'web3',
  'crypto',
  'blockchain',
  'defi',
  'nft',
  'dao',
  'ethereum',
  'bitcoin',
  'solana',
  'polygon',

  // Airdrops & Testnets
  'airdrop',
  'testnet',
  'mainnet',
  'faucet',
  'retroactive',

  // Design & Development
  'design',
  'ui',
  'ux',
  'figma',
  'photoshop',
  'canva',
  'coding',
  'javascript',
  'typescript',
  'react',
  'nextjs',

  // Video & Content
  'video',
  'editing',
  'premiere',
  'aftereffects',
  'tutorial',
  'guide',
  'tips',

  // Community & Social
  'community',
  'discord',
  'twitter',
  'telegram',
  'alpha',
  'research',

  // Tools & Platforms
  'metamask',
  'walletconnect',
  'coinbase',
  'binance',
  'kucoin',

  // Trading & Investment
  'trading',
  'dex',
  'cex',
  'staking',
  'yield',
  'liquidity',
  'farming',

  // Memecoins & Trends
  'memecoin',
  'shitcoin',
  'moonshot',
  'pump',
  'dump',

  // Learning & Academy
  'learning',
  'course',
  'academy',
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]

async function seedHashtags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '')
    console.log('MongoDB connected')

    // Get super admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' })
    if (!superAdminRole) {
      console.error('No super_admin role found. Please create roles first.')
      process.exit(1)
    }

    // Get a user with super admin role for createdBy
    const superAdmin = await User.findOne({ roles: superAdminRole._id })
    if (!superAdmin) {
      console.error('No user with super_admin role found. Please assign super_admin role to a user first.')
      process.exit(1)
    }

    console.log(`Using super admin: ${superAdmin.displayName || superAdmin.twitterUsername || superAdmin.walletAddress}`)

    // Step 1: Extract hashtags from existing content
    console.log('\n📊 Extracting hashtags from existing content...')
    const contents = await Content.find({ tags: { $exists: true, $ne: [] } }).select('tags')

    const extractedTags = new Set<string>()
    contents.forEach((content) => {
      content.tags?.forEach((tag: string) => {
        const cleanTag = tag.toLowerCase().trim().replace(/^#/, '')
        if (cleanTag && /^[a-zA-Z0-9_-]+$/.test(cleanTag) && cleanTag.length <= 30) {
          extractedTags.add(cleanTag)
        }
      })
    })

    console.log(`Found ${extractedTags.size} unique tags in existing content`)

    // Step 2: Combine with default hashtags
    const allTags = new Set([...extractedTags, ...DEFAULT_HASHTAGS])
    console.log(`Total unique tags: ${allTags.size}`)

    // Step 3: Clear existing hashtags
    await Hashtag.deleteMany({})
    console.log('Cleared existing hashtags')

    // Step 4: Insert hashtags
    console.log('\n💾 Inserting hashtags...')
    const hashtagDocs = Array.from(allTags).map((tag) => ({
      tag,
      usageCount: 0,
      createdBy: superAdmin._id,
    }))

    await Hashtag.insertMany(hashtagDocs)
    console.log(`✅ Successfully seeded ${hashtagDocs.length} hashtags`)

    // Step 5: Update usage counts based on existing content
    console.log('\n🔄 Updating usage counts...')
    for (const tag of extractedTags) {
      const count = await Content.countDocuments({ tags: tag })
      await Hashtag.updateOne({ tag }, { usageCount: count })
    }
    console.log('✅ Usage counts updated')

    // Display some stats
    console.log('\n📈 Top 10 most used hashtags:')
    const top10 = await Hashtag.find().sort({ usageCount: -1 }).limit(10)
    top10.forEach((hashtag, index) => {
      console.log(`${index + 1}. #${hashtag.tag} (${hashtag.usageCount} uses)`)
    })

    console.log('\n✅ Hashtag seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding hashtags:', error)
    process.exit(1)
  }
}

seedHashtags()
