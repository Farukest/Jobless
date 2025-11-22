const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless');
    const db = mongoose.connection.db;

    console.log('📊 Checking database collections...\n');

    const collections = {
      'Contents (J Hub)': 'contents',
      'Courses (J Academy)': 'courses',
      'Alpha Posts': 'alphaposts',
      'Production Requests (J Studio)': 'productionrequests',
      'Engagement Posts (J Info)': 'engagementposts'
    };

    for (const [label, collectionName] of Object.entries(collections)) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`${label}: ${count} documents`);

      if (count > 0) {
        const sample = await collection.findOne();
        console.log(`  Sample:`, {
          _id: sample._id,
          title: sample.title || sample.projectName || sample.campaignName || 'N/A',
          status: sample.status,
          createdAt: sample.createdAt
        });
      }
      console.log('');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
