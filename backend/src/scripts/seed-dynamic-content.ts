import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { HubContentType } from '../models/HubContentType.model'
import { StudioRequestType } from '../models/StudioRequestType.model'
import { AcademyCategory } from '../models/AcademyCategory.model'
import { InfoPlatform } from '../models/InfoPlatform.model'
import { InfoEngagementType } from '../models/InfoEngagementType.model'
import { AlphaCategory } from '../models/AlphaCategory.model'

dotenv.config()

const seedDynamicContent = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '')
    console.log('MongoDB connected for seeding...')

    // Clear existing data
    await Promise.all([
      HubContentType.deleteMany({}),
      StudioRequestType.deleteMany({}),
      AcademyCategory.deleteMany({}),
      InfoPlatform.deleteMany({}),
      InfoEngagementType.deleteMany({}),
      AlphaCategory.deleteMany({}),
    ])
    console.log('Cleared existing dynamic content data')

    // Seed Hub Content Types
    const hubContentTypes = [
      { name: 'Video', slug: 'video', description: 'Video content', isActive: true, order: 1 },
      { name: 'Thread', slug: 'thread', description: 'Thread content', isActive: true, order: 2 },
      { name: 'Podcast', slug: 'podcast', description: 'Podcast content', isActive: true, order: 3 },
      { name: 'Guide', slug: 'guide', description: 'Guide content', isActive: true, order: 4 },
      { name: 'Tutorial', slug: 'tutorial', description: 'Tutorial content', isActive: true, order: 5 },
    ]
    await HubContentType.insertMany(hubContentTypes)
    console.log('✓ Seeded Hub Content Types')

    // Seed Studio Request Types
    const studioRequestTypes = [
      { name: 'Design', slug: 'design', description: 'Design requests', isActive: true, order: 1 },
      { name: 'Video Editing', slug: 'video-editing', description: 'Video editing requests', isActive: true, order: 2 },
      { name: 'Thumbnail', slug: 'thumbnail', description: 'Thumbnail design requests', isActive: true, order: 3 },
      { name: 'Banner', slug: 'banner', description: 'Banner design requests', isActive: true, order: 4 },
    ]
    await StudioRequestType.insertMany(studioRequestTypes)
    console.log('✓ Seeded Studio Request Types')

    // Seed Academy Categories
    const academyCategories = [
      { name: 'Airdrop', slug: 'airdrop', description: 'Airdrop courses', isActive: true, order: 1 },
      { name: 'DeFi', slug: 'defi', description: 'DeFi courses', isActive: true, order: 2 },
      { name: 'NFT', slug: 'nft', description: 'NFT courses', isActive: true, order: 3 },
      { name: 'Trading', slug: 'trading', description: 'Trading courses', isActive: true, order: 4 },
      { name: 'Development', slug: 'development', description: 'Development courses', isActive: true, order: 5 },
    ]
    await AcademyCategory.insertMany(academyCategories)
    console.log('✓ Seeded Academy Categories')

    // Seed Info Platforms
    const infoPlatforms = [
      { name: 'Twitter', slug: 'twitter', description: 'Twitter platform', isActive: true, order: 1 },
      { name: 'Farcaster', slug: 'farcaster', description: 'Farcaster platform', isActive: true, order: 2 },
    ]
    await InfoPlatform.insertMany(infoPlatforms)
    console.log('✓ Seeded Info Platforms')

    // Seed Info Engagement Types
    const infoEngagementTypes = [
      { name: 'Like', slug: 'like', description: 'Like engagement', isActive: true, order: 1 },
      { name: 'Retweet', slug: 'retweet', description: 'Retweet engagement', isActive: true, order: 2 },
      { name: 'Comment', slug: 'comment', description: 'Comment engagement', isActive: true, order: 3 },
      { name: 'Follow', slug: 'follow', description: 'Follow engagement', isActive: true, order: 4 },
    ]
    await InfoEngagementType.insertMany(infoEngagementTypes)
    console.log('✓ Seeded Info Engagement Types')

    // Seed Alpha Categories
    const alphaCategories = [
      { name: 'Airdrop Radar', slug: 'airdrop-radar', description: 'Airdrop opportunities', isActive: true, order: 1 },
      { name: 'Testnet Tracker', slug: 'testnet-tracker', description: 'Testnet opportunities', isActive: true, order: 2 },
      { name: 'Memecoin Calls', slug: 'memecoin-calls', description: 'Memecoin opportunities', isActive: true, order: 3 },
      { name: 'DeFi Signals', slug: 'defi-signals', description: 'DeFi opportunities', isActive: true, order: 4 },
    ]
    await AlphaCategory.insertMany(alphaCategories)
    console.log('✓ Seeded Alpha Categories')

    console.log('\n✅ All dynamic content seeded successfully!')

    // Display counts
    const counts = await Promise.all([
      HubContentType.countDocuments(),
      StudioRequestType.countDocuments(),
      AcademyCategory.countDocuments(),
      InfoPlatform.countDocuments(),
      InfoEngagementType.countDocuments(),
      AlphaCategory.countDocuments(),
    ])

    console.log('\nFinal counts:')
    console.log(`  Hub Content Types: ${counts[0]}`)
    console.log(`  Studio Request Types: ${counts[1]}`)
    console.log(`  Academy Categories: ${counts[2]}`)
    console.log(`  Info Platforms: ${counts[3]}`)
    console.log(`  Info Engagement Types: ${counts[4]}`)
    console.log(`  Alpha Categories: ${counts[5]}`)

    await mongoose.connection.close()
    console.log('\nMongoDB connection closed')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding dynamic content:', error)
    process.exit(1)
  }
}

seedDynamicContent()
