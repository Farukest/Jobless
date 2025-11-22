const mongoose = require('mongoose')
require('dotenv').config()

const SystemConfigSchema = new mongoose.Schema({
  configKey: String,
  value: mongoose.Schema.Types.Mixed,
  isActive: Boolean
}, { strict: false })

async function fixHubLimits() {
  await mongoose.connect(process.env.MONGODB_URI)
  const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema)

  await SystemConfig.updateOne(
    { configKey: 'hub_limits' },
    { $set: { isActive: true } }
  )

  console.log('✅ Set isActive=true for hub_limits')

  const config = await SystemConfig.findOne({ configKey: 'hub_limits' })
  console.log('Updated config:', JSON.stringify(config, null, 2))

  await mongoose.disconnect()
}

fixHubLimits().catch(console.error)
