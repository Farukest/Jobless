import mongoose from 'mongoose'
import { User } from '../models/User.model'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const SUPERADMIN_WALLET = '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9'

async function setSuperAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobless'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    // Find or create user with this wallet
    let user = await User.findOne({
      walletAddress: SUPERADMIN_WALLET.toLowerCase()
    })

    if (!user) {
      console.log('User not found, creating new user...')
      user = new User({
        walletAddress: SUPERADMIN_WALLET.toLowerCase(),
        displayName: 'Super Admin',
        roles: ['super_admin', 'admin'],
        permissions: {
          canAccessJHub: true,
          canAccessJStudio: true,
          canAccessJAcademy: true,
          canAccessJInfo: true,
          canAccessJAlpha: true,
          canCreateContent: true,
          canModerateContent: true,
          canManageUsers: true,
          canManageRoles: true,
          canManageSiteSettings: true,
          customPermissions: ['*'],
        },
        isWalletVerified: true,
        status: 'active',
      })
    } else {
      console.log('User found, updating roles and permissions...')
      user.roles = ['super_admin', 'admin']
      user.permissions = {
        canAccessJHub: true,
        canAccessJStudio: true,
        canAccessJAcademy: true,
        canAccessJInfo: true,
        canAccessJAlpha: true,
        canCreateContent: true,
        canModerateContent: true,
        canManageUsers: true,
        canManageRoles: true,
        canManageSiteSettings: true,
        customPermissions: ['*'],
      }
      user.isWalletVerified = true
      user.status = 'active'
    }

    await user.save()

    console.log('\n✅ Super Admin set successfully!')
    console.log('Wallet Address:', SUPERADMIN_WALLET)
    console.log('Roles:', user.roles)
    console.log('Display Name:', user.displayName)
    console.log('Permissions:', user.permissions)

    // Disconnect
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error setting super admin:', error)
    process.exit(1)
  }
}

setSuperAdmin()
