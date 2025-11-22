const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

const UserSchema = new mongoose.Schema({
  walletAddress: String,
  twitterUsername: String,
  displayName: String,
  roles: [String],
  permissions: Object,
})

const User = mongoose.model('User', UserSchema)

async function generateAdminToken() {
  try {
    await mongoose.connect(MONGODB_URI)

    // Find admin user
    const admin = await User.findOne({
      walletAddress: '0xAdminWallet123',
    })

    if (!admin) {
      console.error('Admin user not found!')
      process.exit(1)
    }

    // Generate JWT token (must use 'id' not 'userId' to match auth middleware)
    const token = jwt.sign(
      {
        id: admin._id,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log('\n✓ Admin Token Generated:\n')
    console.log(token)
    console.log('\n')

    mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

generateAdminToken()
