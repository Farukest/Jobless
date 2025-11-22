const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'

const UserSchema = new mongoose.Schema({
  walletAddress: String,
  twitterUsername: String,
  displayName: String,
  roles: [String],
  permissions: Object,
})

const User = mongoose.model('User', UserSchema)

async function checkAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find all users with admin or super_admin role
    const adminUsers = await User.find({
      roles: { $in: ['admin', 'super_admin'] },
    })

    console.log(`\nFound ${adminUsers.length} admin user(s):\n`)

    adminUsers.forEach((user) => {
      console.log('---')
      console.log('ID:', user._id)
      console.log('Display Name:', user.displayName)
      console.log('Twitter:', user.twitterUsername)
      console.log('Wallet:', user.walletAddress)
      console.log('Roles:', user.roles)
      console.log('Permissions:', user.permissions)
    })

    if (adminUsers.length === 0) {
      console.log('\nNo admin users found. Creating one...\n')

      const newAdmin = await User.create({
        walletAddress: '0xAdminWallet123',
        twitterUsername: 'admin',
        displayName: 'Admin User',
        roles: ['member', 'admin'],
        permissions: {
          canCreateContent: true,
          canModerateContent: true,
          canManageCourses: true,
          canManageUsers: true,
        },
      })

      console.log('✓ Admin user created:')
      console.log('  Wallet:', newAdmin.walletAddress)
      console.log('  Twitter:', newAdmin.twitterUsername)
      console.log('  Roles:', newAdmin.roles)
    }

    mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkAdminUser()
