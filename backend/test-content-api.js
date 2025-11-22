const axios = require('axios');

async function testContentAPI() {
  const baseURL = 'http://localhost:5000/api';

  console.log('🧪 Testing Content API...\n');

  try {
    // Test 1: Get all content (should show only published without auth)
    console.log('Test 1: GET /hub/content (no status param)');
    const res1 = await axios.get(`${baseURL}/hub/content`);
    console.log(`  ✅ Total: ${res1.data.total}, Count: ${res1.data.count}`);
    console.log(`  Statuses:`, res1.data.data.map(c => c.status));
    console.log('');

    // Test 2: Get content with status=all
    console.log('Test 2: GET /hub/content?status=all');
    const res2 = await axios.get(`${baseURL}/hub/content?status=all`);
    console.log(`  ✅ Total: ${res2.data.total}, Count: ${res2.data.count}`);
    console.log(`  Statuses:`, res2.data.data.map(c => c.status));
    console.log('');

    // Test 3: Get content with status=published
    console.log('Test 3: GET /hub/content?status=published');
    const res3 = await axios.get(`${baseURL}/hub/content?status=published`);
    console.log(`  ✅ Total: ${res3.data.total}, Count: ${res3.data.count}`);
    console.log(`  Statuses:`, res3.data.data.map(c => c.status));
    console.log('');

    // Test 4: Get content with status=draft
    console.log('Test 4: GET /hub/content?status=draft');
    const res4 = await axios.get(`${baseURL}/hub/content?status=draft`);
    console.log(`  ✅ Total: ${res4.data.total}, Count: ${res4.data.count}`);
    console.log(`  Statuses:`, res4.data.data.map(c => c.status));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testContentAPI();
