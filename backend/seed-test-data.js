const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function seedTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const contentsCollection = db.collection('contents');
    const coursesCollection = db.collection('courses');
    const alphaPostsCollection = db.collection('alphaposts');
    const productionRequestsCollection = db.collection('productionrequests');
    const engagementPostsCollection = db.collection('engagementposts');

    console.log('🌱 Starting test data seeding...\n');

    // Get test users
    const contentCreator = await usersCollection.findOne({ walletAddress: '0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625' });
    const learner = await usersCollection.findOne({ walletAddress: '0xa58168607931de106c4d8330b8fd99489667b210' });
    const scout = await usersCollection.findOne({ walletAddress: '0xa59a01b0ddc8fc239c01ccaba94d431004c169b8' });

    if (!contentCreator || !learner || !scout) {
      console.log('❌ Test users not found! Please ensure test users exist.');
      process.exit(1);
    }

    // 1. Seed J Hub Content
    console.log('📝 Creating J Hub content...');
    const hubContent = [
      {
        title: 'Getting Started with Web3 Development',
        description: 'Complete guide to building decentralized applications',
        contentType: 'video',
        category: 'development',
        difficulty: 'beginner',
        videoUrl: 'https://youtube.com/watch?v=example1',
        thumbnailUrl: 'https://via.placeholder.com/640x360',
        author: contentCreator._id,
        status: 'published',
        isFeatured: true,
        views: 150,
        likes: 45,
        bookmarks: 12,
        createdAt: new Date(),
        publishedAt: new Date(),
      },
      {
        title: 'Understanding Smart Contracts',
        description: 'Deep dive into Solidity and smart contract development',
        contentType: 'thread',
        category: 'blockchain',
        difficulty: 'intermediate',
        threadContent: 'Smart contracts are self-executing contracts...',
        author: contentCreator._id,
        status: 'published',
        views: 89,
        likes: 23,
        createdAt: new Date(),
        publishedAt: new Date(),
      },
      {
        title: 'Crypto Trading Strategies 2025',
        description: 'Latest crypto trading techniques and market analysis',
        contentType: 'podcast',
        category: 'trading',
        difficulty: 'advanced',
        audioUrl: 'https://example.com/podcast1.mp3',
        author: contentCreator._id,
        status: 'draft',
        views: 0,
        likes: 0,
        createdAt: new Date(),
      },
    ];

    await contentsCollection.insertMany(hubContent);
    console.log(`✅ Created ${hubContent.length} J Hub content items\n`);

    // 2. Seed J Academy Courses
    console.log('📚 Creating J Academy courses...');
    const courses = [
      {
        mentorId: contentCreator._id,
        title: 'Photoshop for Beginners',
        description: 'Learn professional photo editing from scratch',
        shortDescription: 'Master Photoshop basics in 4 weeks',
        category: 'design',
        difficulty: 'beginner',
        thumbnailUrl: 'https://via.placeholder.com/400x300',
        duration: 240,
        language: 'en',
        prerequisites: 'Basic computer skills',
        learningObjectives: ['Master layers', 'Use selection tools', 'Apply filters'],
        enrolledCount: 15,
        completedCount: 5,
        status: 'published',
        averageRating: 4.5,
        reviewsCount: 8,
        createdAt: new Date(),
        publishedAt: new Date(),
      },
      {
        mentorId: contentCreator._id,
        title: 'Advanced Video Editing with Premiere Pro',
        description: 'Professional video editing techniques',
        shortDescription: 'Become a pro video editor',
        category: 'video_editing',
        difficulty: 'advanced',
        thumbnailUrl: 'https://via.placeholder.com/400x300',
        duration: 360,
        language: 'en',
        prerequisites: 'Basic video editing knowledge',
        learningObjectives: ['Color grading', 'Motion graphics', 'Audio mixing'],
        enrolledCount: 8,
        completedCount: 2,
        status: 'published',
        averageRating: 4.8,
        reviewsCount: 5,
        createdAt: new Date(),
        publishedAt: new Date(),
      },
    ];

    await coursesCollection.insertMany(courses);
    console.log(`✅ Created ${courses.length} J Academy courses\n`);

    // 3. Seed J Alpha Posts
    console.log('🚀 Creating J Alpha posts...');
    const alphaPosts = [
      {
        scoutId: scout._id,
        projectName: 'DefiSwap Protocol',
        projectDescription: 'Next-gen decentralized exchange with zero gas fees',
        category: 'DeFi',
        blockchain: 'Ethereum',
        potentialRating: 4,
        riskRating: 'medium',
        details: 'Revolutionary AMM protocol with novel liquidity mechanisms',
        websiteUrl: 'https://defiswap.example.com',
        twitterUrl: 'https://twitter.com/defiswap',
        status: 'published',
        votes: { bullish: 45, bearish: 12 },
        views: 234,
        createdAt: new Date(),
      },
      {
        scoutId: scout._id,
        projectName: 'NFT Marketplace X',
        projectDescription: 'AI-powered NFT discovery platform',
        category: 'NFT',
        blockchain: 'Polygon',
        potentialRating: 3,
        riskRating: 'high',
        details: 'Uses machine learning to recommend NFTs',
        websiteUrl: 'https://nftmarketx.example.com',
        status: 'pending',
        votes: { bullish: 0, bearish: 0 },
        views: 0,
        createdAt: new Date(),
      },
    ];

    await alphaPostsCollection.insertMany(alphaPosts);
    console.log(`✅ Created ${alphaPosts.length} J Alpha posts\n`);

    // 4. Seed J Studio Production Requests
    console.log('🎨 Creating J Studio production requests...');
    const productionRequests = [
      {
        requesterId: learner._id,
        requestType: 'logo_design',
        title: 'Logo Design for Crypto Project',
        description: 'Need a modern, minimalist logo for our DeFi protocol',
        category: 'design',
        budget: 500,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        requirements: 'Vector format, multiple variations, modern style',
        status: 'open',
        proposalsCount: 0,
        createdAt: new Date(),
      },
      {
        requesterId: learner._id,
        requestType: 'video_editing',
        title: 'Edit Promotional Video',
        description: 'Edit a 2-minute promotional video for our platform launch',
        category: 'video',
        budget: 300,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        requirements: 'Add transitions, color grading, background music',
        status: 'open',
        proposalsCount: 0,
        createdAt: new Date(),
      },
    ];

    await productionRequestsCollection.insertMany(productionRequests);
    console.log(`✅ Created ${productionRequests.length} J Studio production requests\n`);

    // 5. Seed J Info Engagement Posts
    console.log('📢 Creating J Info engagement posts...');
    const engagementPosts = [
      {
        submitterId: contentCreator._id,
        platform: 'twitter',
        postUrl: 'https://twitter.com/jobless/status/123456',
        postType: 'tweet',
        campaignName: 'Jobless Platform Launch',
        engagementType: 'like',
        requiredActions: ['Like', 'Retweet'],
        description: 'Help us spread the word about our platform launch!',
        engagementCount: 25,
        participants: [],
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isVerified: true,
        submittedAt: new Date(),
        createdAt: new Date(),
      },
    ];

    await engagementPostsCollection.insertMany(engagementPosts);
    console.log(`✅ Created ${engagementPosts.length} J Info engagement posts\n`);

    console.log('🎉 Test data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${hubContent.length} Hub content items`);
    console.log(`   - ${courses.length} Academy courses`);
    console.log(`   - ${alphaPosts.length} Alpha posts`);
    console.log(`   - ${productionRequests.length} Studio production requests`);
    console.log(`   - ${engagementPosts.length} Info engagement posts`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();
