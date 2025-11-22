const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'

async function checkContentData() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    const db = mongoose.connection.db
    const contents = await db
      .collection('contents')
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .toArray()

    console.log('All published content sorted by createdAt DESC:\n')

    contents.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title}`)
      console.log(`   _id: ${c._id}`)
      console.log(`   createdAt: ${c.createdAt.toISOString()}`)
      console.log(`   adminPin: ${c.isAdminPinned || false}, pin: ${c.isPinned || false}`)
      console.log('')
    })

    // Check for duplicates
    const titles = contents.map(c => c.title)
    const duplicates = titles.filter((item, index) => titles.indexOf(item) !== index)

    if (duplicates.length > 0) {
      console.log('\n⚠️  Found duplicate titles:')
      duplicates.forEach(title => console.log(`   - ${title}`))
    }

    mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkContentData()
