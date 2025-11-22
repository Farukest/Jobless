const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkUserRoles() {
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
    console.log('📋 User role ObjectIds:', user.roles);

    // Get role details
    const roleIds = user.roles.map(id => new mongoose.Types.ObjectId(id));
    const roles = await rolesCollection.find({ _id: { $in: roleIds } }).toArray();

    console.log('\n📋 User roles:');
    roles.forEach(role => {
      console.log(`   - ${role.displayName} (${role.name})`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserRoles();
