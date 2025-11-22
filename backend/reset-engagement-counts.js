const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'

async function resetEngagementCounts() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const contentCollection = db.collection('contents')

    // Reset all engagement counts to 0
    const result = await contentCollection.updateMany(
      {},
      {
        $set: {
          viewsCount: 0,
          likesCount: 0,
          bookmarksCount: 0,
          commentsCount: 0
        }
      }
    )

    console.log(`✓ Reset engagement counts for ${result.modifiedCount} content items`)
    console.log('  - viewsCount: 0')
    console.log('  - likesCount: 0')
    console.log('  - bookmarksCount: 0')
    console.log('  - commentsCount: 0')

    mongoose.disconnect()
    console.log('\n✓ Engagement counts reset successfully!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

resetEngagementCounts()
