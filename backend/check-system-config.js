const mongoose = require('mongoose')

const SystemConfigSchema = new mongoose.Schema({
  configKey: { type: String, required: true, unique: true },
  configType: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema)

async function checkConfigs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobless')
    console.log('Connected to MongoDB')

    const allConfigs = await SystemConfig.find()
    console.log('\n=== ALL SYSTEM CONFIGS ===')
    console.log(JSON.stringify(allConfigs, null, 2))

    const categoriesConfig = await SystemConfig.findOne({ configKey: 'content_categories' })
    console.log('\n=== CATEGORIES CONFIG ===')
    console.log(JSON.stringify(categoriesConfig, null, 2))

    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkConfigs()
