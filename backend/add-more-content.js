const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'

async function addMoreContent() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    const db = mongoose.connection.db
    const contentCollection = db.collection('contents')

    // Get author from existing content
    const existingContent = await contentCollection.findOne({ status: 'published' })
    if (!existingContent) {
      console.error('No existing content found.')
      mongoose.disconnect()
      return
    }

    const authorId = existingContent.authorId
    console.log(`Using author ID: ${authorId}`)

    // Check existing content count
    const existingCount = await contentCollection.countDocuments({ status: 'published' })
    console.log(`Current published content: ${existingCount}\n`)

    // New content items
    const newContents = [
      {
        authorId: authorId,
        title: 'Complete Guide to Crypto Wallets',
        description: 'Everything you need to know about hot wallets, cold wallets, and securing your crypto assets.',
        contentType: 'Guide',
        body: 'This comprehensive guide covers different types of crypto wallets, security best practices, and how to choose the right wallet for your needs.',
        mediaUrls: [],
        tags: ['wallet', 'security', 'crypto', 'beginner'],
        category: 'Education',
        difficulty: 'Beginner',
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        status: 'published',
        publishedAt: new Date('2025-11-16T10:30:00.000Z'),
        isFeatured: false,
        isPinned: false,
        isAdminPinned: false,
        createdAt: new Date('2025-11-16T10:30:00.000Z'),
        updatedAt: new Date('2025-11-16T10:30:00.000Z')
      },
      {
        authorId: authorId,
        title: 'Layer 2 Scaling Solutions Explained',
        description: 'Deep dive into Optimism, Arbitrum, zkSync, and other L2 solutions improving Ethereum scalability.',
        contentType: 'Tutorial',
        body: 'Learn about different Layer 2 scaling solutions, how they work, and which one to use for different use cases.',
        mediaUrls: [],
        tags: ['layer2', 'ethereum', 'scaling', 'defi'],
        category: 'Technology',
        difficulty: 'Advanced',
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        status: 'published',
        publishedAt: new Date('2025-11-15T14:20:00.000Z'),
        isFeatured: false,
        isPinned: false,
        isAdminPinned: false,
        createdAt: new Date('2025-11-15T14:20:00.000Z'),
        updatedAt: new Date('2025-11-15T14:20:00.000Z')
      },
      {
        authorId: authorId,
        title: 'Solana vs Ethereum: Technical Comparison',
        description: 'Detailed technical comparison between Solana and Ethereum blockchains, covering consensus, speed, and costs.',
        contentType: 'Thread',
        body: 'A thread comparing the technical architecture, transaction speeds, fees, and developer ecosystems of Solana and Ethereum.',
        mediaUrls: [],
        tags: ['solana', 'ethereum', 'blockchain', 'comparison'],
        category: 'Research',
        difficulty: 'Intermediate',
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        status: 'published',
        publishedAt: new Date('2025-11-14T09:15:00.000Z'),
        isFeatured: false,
        isPinned: false,
        isAdminPinned: false,
        createdAt: new Date('2025-11-14T09:15:00.000Z'),
        updatedAt: new Date('2025-11-14T09:15:00.000Z')
      },
      {
        authorId: authorId,
        title: 'Introduction to DeFi Lending Protocols',
        description: 'Learn how Aave, Compound, and other lending protocols work in decentralized finance.',
        contentType: 'Video',
        body: 'Video tutorial explaining the mechanics of DeFi lending, how to earn yield, and managing risks.',
        mediaUrls: [],
        tags: ['defi', 'lending', 'aave', 'compound', 'yield'],
        category: 'DeFi',
        difficulty: 'Beginner',
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        status: 'published',
        publishedAt: new Date('2025-11-13T16:45:00.000Z'),
        isFeatured: false,
        isPinned: false,
        isAdminPinned: false,
        createdAt: new Date('2025-11-13T16:45:00.000Z'),
        updatedAt: new Date('2025-11-13T16:45:00.000Z')
      },
      {
        authorId: authorId,
        title: 'MEV Explained: Maximum Extractable Value',
        description: 'Understanding MEV, how searchers and validators extract value, and its impact on DeFi users.',
        contentType: 'Guide',
        body: 'Comprehensive explanation of MEV in Ethereum, including frontrunning, sandwich attacks, and protection strategies.',
        mediaUrls: [],
        tags: ['mev', 'ethereum', 'defi', 'security', 'advanced'],
        category: 'Security',
        difficulty: 'Advanced',
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        status: 'published',
        publishedAt: new Date('2025-11-12T11:00:00.000Z'),
        isFeatured: false,
        isPinned: false,
        isAdminPinned: false,
        createdAt: new Date('2025-11-12T11:00:00.000Z'),
        updatedAt: new Date('2025-11-12T11:00:00.000Z')
      }
    ]

    // Insert new contents
    const result = await contentCollection.insertMany(newContents)
    console.log(`✓ Added ${result.insertedCount} new content items:\n`)

    newContents.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title}`)
      console.log(`   Type: ${c.contentType}, Category: ${c.category}, Difficulty: ${c.difficulty}`)
      console.log(`   Created: ${c.createdAt.toISOString()}`)
    })

    const newTotal = await contentCollection.countDocuments({ status: 'published' })
    console.log(`\n✓ Total published content: ${newTotal}`)
    console.log(`✓ Should now have 2 pages (assuming 5 per page)`)

    mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

addMoreContent()
