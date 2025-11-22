const axios = require('axios')

async function testAPI() {
  try {
    console.log('Testing API endpoint...\n')

    // You need to get your actual token from browser localStorage
    const token = 'YOUR_TOKEN_HERE' // Replace this with actual token from browser

    // Test GET config
    console.log('1. Testing GET /api/admin/hub/config')
    const getResponse = await axios.get('http://localhost:5000/api/admin/hub/config', {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ GET Success:', getResponse.data)
    console.log('Current categories:', getResponse.data.data.categories)

    // Test POST category
    console.log('\n2. Testing POST /api/admin/hub/categories')
    const postResponse = await axios.post('http://localhost:5000/api/admin/hub/categories',
      { category: 'api_test_category' },
      { headers: { Authorization: `Bearer ${token}` }}
    )
    console.log('✅ POST Success:', postResponse.data)

    // Test GET again to verify
    console.log('\n3. Testing GET again to verify')
    const verifyResponse = await axios.get('http://localhost:5000/api/admin/hub/config', {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ Verified categories:', verifyResponse.data.data.categories)

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

console.log('⚠️  IMPORTANT: You need to replace YOUR_TOKEN_HERE with your actual JWT token from browser localStorage!\n')
console.log('To get token:')
console.log('1. Open browser console (F12)')
console.log('2. Type: localStorage.getItem("token")')
console.log('3. Copy the token and paste it in this file\n')

testAPI()
