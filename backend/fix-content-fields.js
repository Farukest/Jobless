const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'

async function fixContentFields() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('contents')

    // Rename 'author' field to 'authorId'
    const result = await collection.updateMany(
      { author: { $exists: true } },
      { $rename: { author: 'authorId' } }
    )

    console.log(`✓ Updated ${result.modifiedCount} documents`)
    console.log('  - Renamed "author" field to "authorId"')

    // Also fix other potential field mismatches
    const result2 = await collection.updateMany(
      { videoUrl: { $exists: true } },
      {
        $set: { mediaUrls: [] },
        $unset: { videoUrl: '', thumbnailUrl: '' },
      }
    )

    console.log(`✓ Fixed mediaUrls for ${result2.modifiedCount} documents`)

    // Fix views/likes/bookmarks field names
    const result3 = await collection.updateMany(
      {},
      [
        {
          $set: {
            viewsCount: { $ifNull: ['$viewsCount', '$views', 0] },
            likesCount: { $ifNull: ['$likesCount', '$likes', 0] },
            bookmarksCount: { $ifNull: ['$bookmarksCount', '$bookmarks', 0] },
          },
        },
        {
          $unset: ['views', 'likes', 'bookmarks'],
        },
      ]
    )

    console.log(`✓ Fixed stats fields for ${result3.modifiedCount} documents`)

    mongoose.disconnect()
    console.log('\n✓ All content fields fixed!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fixContentFields()
