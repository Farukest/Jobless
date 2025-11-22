const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'

async function checkContent() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const Content = mongoose.model(
      'Content',
      new mongoose.Schema({}, { strict: false })
    )

    const content = await Content.findById('691e591ddd25d746ee2d8fdd')

    if (!content) {
      console.log('Content not found')
    } else {
      console.log('\nContent found:')
      console.log('ID:', content._id)
      console.log('Title:', content.title)
      console.log('AuthorId:', content.authorId)
      console.log('AuthorId type:', typeof content.authorId)
      console.log('Status:', content.status)
      console.log('\nFull document:')
      console.log(JSON.stringify(content, null, 2))
    }

    mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkContent()
