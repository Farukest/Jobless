const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function addSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const rolesCollection = db.collection('roles');

    const walletAddress = '0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9';

    // Find user
    const user = await usersCollection.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', user.displayName || user.walletAddress);

    // Find super_admin role
    const superAdminRole = await rolesCollection.findOne({ name: 'super_admin' });

    if (!superAdminRole) {
      console.log('❌ super_admin role not found');
      process.exit(1);
    }

    console.log('✅ super_admin role found:', superAdminRole.displayName);

    // Check if user already has super_admin
    const hasSuperAdmin = user.roles.some(roleId => 
      roleId.toString() === superAdminRole._id.toString()
    );

    if (hasSuperAdmin) {
      console.log('ℹ️  User already has super_admin role');
    } else {
      // Add super_admin role to user
      await usersCollection.updateOne(
        { _id: user._id },
        { $addToSet: { roles: superAdminRole._id } }
      );
      console.log('✅ super_admin role added!');
    }

    // Verify
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    const roleIds = updatedUser.roles.map(id => new mongoose.Types.ObjectId(id));
    const roles = await rolesCollection.find({ _id: { $in: roleIds } }).toArray();

    console.log('\n📋 Updated user roles:');
    roles.forEach(role => {
      console.log(`   - ${role.displayName} (${role.name})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSuperAdmin();
