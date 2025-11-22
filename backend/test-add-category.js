const mongoose = require('mongoose')

const SystemConfigSchema = new mongoose.Schema({
  configKey: { type: String, required: true, unique: true },
  configType: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema)

async function testAddCategory() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobless')
    console.log('Connected to MongoDB')

    // Get current config
    const config = await SystemConfig.findOne({ configKey: 'content_categories' })
    console.log('\n=== BEFORE ===')
    console.log('Categories:', config.value)

    // Simulate adding "test_category"
    const newCategory = 'test_category'
    const categories = config.value

    if (categories.includes(newCategory)) {
      console.log('\nCategory already exists!')
    } else {
      categories.push(newCategory)
      config.value = categories
      await config.save()
      console.log('\n=== AFTER ===')
      console.log('Categories:', config.value)
      console.log('\n✅ Successfully added:', newCategory)
    }

    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testAddCategory()
