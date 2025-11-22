const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function testAuth() {
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

    console.log('User data from DB:');
    console.log('- _id:', user._id);
    console.log('- walletAddress:', user.walletAddress);
    console.log('- displayName:', user.displayName);
    console.log('- roles (ObjectIds):', user.roles);

    // Get populated roles
    const roleIds = user.roles.map(id => new mongoose.Types.ObjectId(id));
    const roles = await rolesCollection.find({ _id: { $in: roleIds } }).toArray();

    console.log('\nPopulated roles:');
    roles.forEach(role => {
      console.log(`- ${role.name} (${role.displayName})`);
    });

    // Simulate what /api/auth/me returns
    const userResponse = {
      ...user,
      roles: roles.map(r => ({
        _id: r._id,
        name: r.name,
        displayName: r.displayName
      }))
    };

    console.log('\nWhat /api/auth/me should return:');
    console.log(JSON.stringify(userResponse.roles, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();
