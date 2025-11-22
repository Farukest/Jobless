/**
 * System Config Update Test
 * Tests updating system configuration values and verifies persistence
 */

const mongoose = require('mongoose')
require('dotenv').config()

// Define SystemConfig schema directly
const SystemConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    configType: {
      type: String,
      required: true,
      enum: ['enum', 'list', 'object', 'boolean', 'number', 'string'],
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema)

async function testSystemConfigUpdate() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Test Data - Same values from the admin settings form
    const testData = {
      hub_limits: {
        home_page_limit: 24,
        feed_page_limit: 10,
        content_title_max_length: 200,
        content_body_max_length: 20000,
      },
      points_config: {
        content_created: 10,
        content_featured: 50,
        engagement_given: 2,
        engagement_received: 1,
        alpha_validated: 25,
        course_completed: 30,
        production_completed: 20,
        daily_login: 1,
      },
      max_file_sizes: {
        image: 5242880,
        video: 104857600,
        document: 10485760,
        audio: 52428800,
      },
    }

    console.log('📋 Test Data:')
    console.log(JSON.stringify(testData, null, 2))
    console.log('\n' + '='.repeat(60) + '\n')

    // Test 1: Update hub_limits
    console.log('🧪 TEST 1: Updating hub_limits...')
    const hubLimitsResult = await SystemConfig.updateOne(
      { configKey: 'hub_limits' },
      {
        $set: {
          value: testData.hub_limits,
          updatedAt: new Date(),
        },
      }
    )
    console.log('  Update Result:', hubLimitsResult)

    // Verify hub_limits
    const hubLimitsDoc = await SystemConfig.findOne({ configKey: 'hub_limits' })
    console.log('  Retrieved Value:', JSON.stringify(hubLimitsDoc.value, null, 2))

    const hubLimitsMatch = JSON.stringify(hubLimitsDoc.value) === JSON.stringify(testData.hub_limits)
    console.log(hubLimitsMatch ? '  ✅ hub_limits UPDATE SUCCESS' : '  ❌ hub_limits UPDATE FAILED')
    console.log('')

    // Test 2: Update points_config
    console.log('🧪 TEST 2: Updating points_config...')
    const pointsConfigResult = await SystemConfig.updateOne(
      { configKey: 'points_config' },
      {
        $set: {
          value: testData.points_config,
          updatedAt: new Date(),
        },
      }
    )
    console.log('  Update Result:', pointsConfigResult)

    // Verify points_config
    const pointsConfigDoc = await SystemConfig.findOne({ configKey: 'points_config' })
    console.log('  Retrieved Value:', JSON.stringify(pointsConfigDoc.value, null, 2))

    const pointsConfigMatch = JSON.stringify(pointsConfigDoc.value) === JSON.stringify(testData.points_config)
    console.log(pointsConfigMatch ? '  ✅ points_config UPDATE SUCCESS' : '  ❌ points_config UPDATE FAILED')
    console.log('')

    // Test 3: Update max_file_sizes
    console.log('🧪 TEST 3: Updating max_file_sizes...')
    const maxFileSizesResult = await SystemConfig.updateOne(
      { configKey: 'max_file_sizes' },
      {
        $set: {
          value: testData.max_file_sizes,
          updatedAt: new Date(),
        },
      }
    )
    console.log('  Update Result:', maxFileSizesResult)

    // Verify max_file_sizes
    const maxFileSizesDoc = await SystemConfig.findOne({ configKey: 'max_file_sizes' })
    console.log('  Retrieved Value:', JSON.stringify(maxFileSizesDoc.value, null, 2))

    const maxFileSizesMatch = JSON.stringify(maxFileSizesDoc.value) === JSON.stringify(testData.max_file_sizes)
    console.log(maxFileSizesMatch ? '  ✅ max_file_sizes UPDATE SUCCESS' : '  ❌ max_file_sizes UPDATE FAILED')
    console.log('')

    console.log('='.repeat(60))
    console.log('\n📊 FINAL VERIFICATION (Simulating Page Refresh)\n')

    // Simulate page refresh - fetch all configs fresh
    const freshHubLimits = await SystemConfig.findOne({ configKey: 'hub_limits' })
    const freshPointsConfig = await SystemConfig.findOne({ configKey: 'points_config' })
    const freshMaxFileSizes = await SystemConfig.findOne({ configKey: 'max_file_sizes' })

    console.log('🔄 Fresh fetch results:')
    console.log('\nhub_limits:')
    console.log(JSON.stringify(freshHubLimits.value, null, 2))
    console.log('\npoints_config:')
    console.log(JSON.stringify(freshPointsConfig.value, null, 2))
    console.log('\nmax_file_sizes:')
    console.log(JSON.stringify(freshMaxFileSizes.value, null, 2))

    // Final comparison
    const allMatch =
      JSON.stringify(freshHubLimits.value) === JSON.stringify(testData.hub_limits) &&
      JSON.stringify(freshPointsConfig.value) === JSON.stringify(testData.points_config) &&
      JSON.stringify(freshMaxFileSizes.value) === JSON.stringify(testData.max_file_sizes)

    console.log('\n' + '='.repeat(60))
    if (allMatch) {
      console.log('\n✅ ALL TESTS PASSED - Config updates persist correctly!')
    } else {
      console.log('\n❌ SOME TESTS FAILED - Config updates not persisting!')
    }

    // Now test with modified value (like changing body_max_length to 30000)
    console.log('\n' + '='.repeat(60))
    console.log('\n🧪 BONUS TEST: Changing body_max_length to 30000...\n')

    const modifiedHubLimits = {
      ...testData.hub_limits,
      content_body_max_length: 30000
    }

    await SystemConfig.updateOne(
      { configKey: 'hub_limits' },
      {
        $set: {
          value: modifiedHubLimits,
          updatedAt: new Date(),
        },
      }
    )

    // Verify the change
    const verifyDoc = await SystemConfig.findOne({ configKey: 'hub_limits' })
    console.log('Updated hub_limits:')
    console.log(JSON.stringify(verifyDoc.value, null, 2))

    const bodyMaxLengthCorrect = verifyDoc.value.content_body_max_length === 30000
    console.log(bodyMaxLengthCorrect ? '\n✅ body_max_length successfully changed to 30000' : '\n❌ body_max_length update failed')

    // Disconnect
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')

  } catch (error) {
    console.error('❌ Test Error:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

// Run the test
testSystemConfigUpdate()
