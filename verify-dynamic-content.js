const BASE_URL = 'http://localhost:5000/api'

const testEndpoints = [
  {
    name: 'Hub Content Types',
    url: `${BASE_URL}/admin/dynamic-content/hub-content-types`,
    expectedCount: 5
  },
  {
    name: 'Studio Request Types',
    url: `${BASE_URL}/admin/dynamic-content/studio-request-types`,
    expectedCount: 4
  },
  {
    name: 'Academy Categories',
    url: `${BASE_URL}/admin/dynamic-content/academy-categories`,
    expectedCount: 5
  },
  {
    name: 'Info Platforms',
    url: `${BASE_URL}/admin/dynamic-content/info-platforms`,
    expectedCount: 2
  },
  {
    name: 'Info Engagement Types',
    url: `${BASE_URL}/admin/dynamic-content/info-engagement-types`,
    expectedCount: 4
  },
  {
    name: 'Alpha Categories',
    url: `${BASE_URL}/admin/dynamic-content/alpha-categories`,
    expectedCount: 4
  }
]

async function runTests() {
  console.log('🧪 Testing seeded dynamic content endpoints...\n')

  let passed = 0
  let failed = 0

  for (const test of testEndpoints) {
    try {
      const response = await fetch(test.url)

      if (!response.ok) {
        console.log(`❌ ${test.name}: ${response.status} ${response.statusText}`)
        failed++
        continue
      }

      const data = await response.json()

      if (data.success && data.count === test.expectedCount) {
        console.log(`✅ ${test.name}: ${data.count} items (Expected: ${test.expectedCount})`)
        passed++
      } else {
        console.log(`❌ ${test.name}: Got ${data.count} items, expected ${test.expectedCount}`)
        failed++
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${passed}/${testEndpoints.length} tests passed`)

  if (failed === 0) {
    console.log('✅ All dynamic content endpoints are working correctly!')
  } else {
    console.log(`⚠️  ${failed} test(s) failed`)
  }
}

runTests()
