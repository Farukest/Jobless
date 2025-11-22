const mongoose = require('mongoose')

// Define schemas
const UserSchema = new mongoose.Schema({
  walletAddress: String,
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  status: String
})

const RoleSchema = new mongoose.Schema({
  name: String,
  displayName: String
})

const SystemConfigSchema = new mongoose.Schema({
  configKey: { type: String, required: true, unique: true },
  configType: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

const User = mongoose.model('User', UserSchema)
const Role = mongoose.model('Role', RoleSchema)
const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema)

async function debugCategoryAdd() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobless')
    console.log('✅ Connected to MongoDB\n')

    // 1. Find super_admin user
    const superAdminRole = await Role.findOne({ name: 'super_admin' })
    console.log('1. Super Admin Role:', superAdminRole._id, '-', superAdminRole.name)

    const user = await User.findOne({
      walletAddress: '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9'
    }).populate('roles', 'name displayName')

    console.log('2. Your User:')
    console.log('   - Wallet:', user.walletAddress)
    console.log('   - Status:', user.status)
    console.log('   - Roles:', user.roles.map(r => r.name).join(', '))

    const isSuperAdmin = user.roles.some(r => r.name === 'super_admin')
    console.log('   - Is Super Admin?', isSuperAdmin ? '✅ YES' : '❌ NO')

    if (!isSuperAdmin) {
      console.log('\n❌ ERROR: User is not super_admin! Cannot proceed.')
      process.exit(1)
    }

    // 2. Get current categories
    const config = await SystemConfig.findOne({ configKey: 'content_categories' })
    console.log('\n3. Current Categories Config:')
    console.log('   - Config ID:', config._id)
    console.log('   - Current categories:', config.value)
    console.log('   - Total:', config.value.length)

    // 3. Simulate adding a category
    const newCategory = 'debug_test_' + Date.now()
    console.log(`\n4. Adding new category: "${newCategory}"`)

    const categorySlug = newCategory.toLowerCase().trim().replace(/\s+/g, '_')
    console.log('   - Slug:', categorySlug)

    if (config.value.includes(categorySlug)) {
      console.log('   ⚠️  Category already exists!')
    } else {
      const oldValue = [...config.value]
      config.value.push(categorySlug)
      config.updatedBy = user._id

      console.log('   - Before save:', oldValue.length, 'categories')
      console.log('   - After push:', config.value.length, 'categories')

      await config.save()
      console.log('   ✅ Saved to database!')

      // Verify
      const verifyConfig = await SystemConfig.findOne({ configKey: 'content_categories' })
      console.log('\n5. Verification:')
      console.log('   - Categories in DB:', verifyConfig.value)
      console.log('   - Total:', verifyConfig.value.length)
      console.log('   - New category exists?', verifyConfig.value.includes(categorySlug) ? '✅ YES' : '❌ NO')
      console.log('   - Updated by:', verifyConfig.updatedBy)
      console.log('   - Updated at:', verifyConfig.updatedAt)
    }

    await mongoose.disconnect()
    console.log('\n✅ Test completed successfully!')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

debugCategoryAdd()
