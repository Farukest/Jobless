const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const rolesCollection = db.collection('roles');

    // Get all roles
    const allRoles = await rolesCollection.find({}).toArray();
    console.log('Available roles:');
    allRoles.forEach(role => {
      console.log(`  - ${role.name} (${role.displayName}) - ID: ${role._id}`);
    });

    // Get member role
    const memberRole = allRoles.find(r => r.name === 'member');
    if (!memberRole) {
      console.log('\n❌ Member role not found!');
      process.exit(1);
    }

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`\n📊 Total users: ${users.length}\n`);

    let usersWithoutMember = 0;

    for (const user of users) {
      const roleIds = user.roles || [];
      const hasMember = roleIds.some(id => id.toString() === memberRole._id.toString());

      const userRoles = await rolesCollection.find({
        _id: { $in: roleIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).toArray();

      const roleNames = userRoles.map(r => r.name).join(', ');
      const displayName = user.displayName || user.walletAddress;

      if (!hasMember) {
        console.log(`❌ ${displayName} - Roles: [${roleNames}] - Missing MEMBER`);
        usersWithoutMember++;
      } else {
        console.log(`✅ ${displayName} - Roles: [${roleNames}]`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Users without member role: ${usersWithoutMember}`);
    console.log(`   Users with member role: ${users.length - usersWithoutMember}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
