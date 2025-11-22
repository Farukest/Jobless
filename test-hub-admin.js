/**
 * Hub Admin Content Management Test Script
 * Tests: moderate, approve, delete, feature, archive, pin
 */

const axios = require('axios')

const API_URL = 'http://localhost:5000/api'

// Admin JWT token (generated from backend/generate-admin-token.js)
let authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWU3ZTU2NTU2ODY3MjZlODg1YjFjMyIsImlhdCI6MTc2MzYwNjQwMywiZXhwIjoxNzY0MjExMjAzfQ.MyDlyP93fMVmtv0dn1_pcWAFqIxCgmY4L5dufG_NtYM'

// Test user credentials (admin user)
const ADMIN_USER = {
  twitterUsername: 'admin',
  walletAddress: '0xAdminWallet123',
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) =>
    console.log(
      `\n${colors.bright}${colors.blue}═══ ${msg} ═══${colors.reset}\n`
    ),
}

// API helper with auth
const api = axios.create({
  baseURL: API_URL,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// Test data storage
let testContentId = null

/**
 * Step 1: Verify admin authentication
 * Note: Using pre-generated JWT token for testing
 */
async function loginAsAdmin() {
  log.title('Step 1: Verify Admin Authentication')

  try {
    // Verify token works by calling /me endpoint
    const response = await api.get('/auth/me')

    log.success('Admin token verified')
    log.info(`User ID: ${response.data.user._id}`)
    log.info(`Roles: ${response.data.user.roles.join(', ')}`)
    return true
  } catch (error) {
    log.error(
      'Token verification failed: ' + (error.response?.data?.message || error.message)
    )
    if (error.response?.data) {
      console.log('Response:', error.response.data)
    }
    return false
  }
}

/**
 * Step 2: Create test content
 */
async function createTestContent() {
  log.title('Step 2: Create Test Content')

  try {
    const response = await api.post('/hub/content', {
      title: 'Test Content for Admin Actions',
      description: 'This content will be used to test all admin actions',
      contentType: 'Video',
      body: 'Test content body for moderation testing',
      category: 'Crypto',
      difficulty: 'Beginner',
      status: 'draft',
      tags: ['test', 'admin'],
    })

    testContentId = response.data.data._id
    log.success('Test content created')
    log.info(`Content ID: ${testContentId}`)
    log.info(`Status: ${response.data.data.status}`)
    return true
  } catch (error) {
    log.error(
      'Content creation failed: ' +
        (error.response?.data?.message || error.message)
    )
    if (error.response?.data) {
      console.log('Response data:', error.response.data)
    }
    return false
  }
}

/**
 * Step 3: Test Approve (publish)
 */
async function testApprove() {
  log.title('Step 3: Test Approve (Publish)')

  try {
    const response = await api.put(`/hub/content/${testContentId}/moderate`, {
      status: 'published',
      moderationNotes: 'Approved by admin - test script',
    })

    log.success('Content approved (published)')
    log.info(`New status: ${response.data.data.status}`)
    log.info(`Moderation notes: ${response.data.data.moderationNotes}`)
    return true
  } catch (error) {
    log.error(
      'Approve failed: ' + (error.response?.data?.message || error.message)
    )
    if (error.response?.data) {
      console.log('Response data:', error.response.data)
    }
    if (error.response?.status) {
      console.log('Status code:', error.response.status)
    }
    return false
  }
}

/**
 * Step 4: Test Feature
 */
async function testFeature() {
  log.title('Step 4: Test Feature')

  try {
    const response = await api.put(`/hub/content/${testContentId}/moderate`, {
      isFeatured: true,
    })

    log.success('Content featured')
    log.info(`isFeatured: ${response.data.data.isFeatured}`)
    return true
  } catch (error) {
    log.error(
      'Feature failed: ' + (error.response?.data?.message || error.message)
    )
    return false
  }
}

/**
 * Step 5: Test Pin
 */
async function testPin() {
  log.title('Step 5: Test Pin')

  try {
    const response = await api.put(`/hub/content/${testContentId}/moderate`, {
      isPinned: true,
    })

    log.success('Content pinned')
    log.info(`isPinned: ${response.data.data.isPinned}`)
    return true
  } catch (error) {
    log.error('Pin failed: ' + (error.response?.data?.message || error.message))
    return false
  }
}

/**
 * Step 6: Test Unfeature
 */
async function testUnfeature() {
  log.title('Step 6: Test Unfeature')

  try {
    const response = await api.put(`/hub/content/${testContentId}/moderate`, {
      isFeatured: false,
    })

    log.success('Content unfeatured')
    log.info(`isFeatured: ${response.data.data.isFeatured}`)
    return true
  } catch (error) {
    log.error(
      'Unfeature failed: ' + (error.response?.data?.message || error.message)
    )
    return false
  }
}

/**
 * Step 7: Test Unpin
 */
async function testUnpin() {
  log.title('Step 7: Test Unpin')

  try {
    const response = await api.put(`/hub/content/${testContentId}/moderate`, {
      isPinned: false,
    })

    log.success('Content unpinned')
    log.info(`isPinned: ${response.data.data.isPinned}`)
    return true
  } catch (error) {
    log.error(
      'Unpin failed: ' + (error.response?.data?.message || error.message)
    )
    return false
  }
}

/**
 * Step 8: Test Archive
 */
async function testArchive() {
  log.title('Step 8: Test Archive')

  try {
    const response = await api.put(`/hub/content/${testContentId}/moderate`, {
      status: 'archived',
      moderationNotes: 'Archived by admin - test script',
    })

    log.success('Content archived')
    log.info(`New status: ${response.data.data.status}`)
    return true
  } catch (error) {
    log.error(
      'Archive failed: ' + (error.response?.data?.message || error.message)
    )
    return false
  }
}

/**
 * Step 9: Test Reject
 */
async function testReject() {
  log.title('Step 9: Test Reject (from archived)')

  try {
    const response = await api.put(`/hub/content/${testContentId}/moderate`, {
      status: 'rejected',
      moderationNotes: 'Rejected by admin - test script',
    })

    log.success('Content rejected')
    log.info(`New status: ${response.data.data.status}`)
    return true
  } catch (error) {
    log.error(
      'Reject failed: ' + (error.response?.data?.message || error.message)
    )
    return false
  }
}

/**
 * Step 10: Test Delete
 */
async function testDelete() {
  log.title('Step 10: Test Delete')

  try {
    const response = await api.delete(`/hub/content/${testContentId}`)

    log.success('Content deleted')
    log.info(`Message: ${response.data.message}`)
    return true
  } catch (error) {
    log.error(
      'Delete failed: ' + (error.response?.data?.message || error.message)
    )
    return false
  }
}

/**
 * Step 11: Verify deletion
 */
async function verifyDeletion() {
  log.title('Step 11: Verify Deletion')

  try {
    await api.get(`/hub/content/${testContentId}`)
    log.error('Content still exists after deletion!')
    return false
  } catch (error) {
    if (error.response?.status === 404) {
      log.success('Content successfully deleted (404 confirmed)')
      return true
    }
    log.error(
      'Unexpected error: ' + (error.response?.data?.message || error.message)
    )
    return false
  }
}

/**
 * Test Archive Logic (draft vs published)
 */
async function testArchiveLogic() {
  log.title('Bonus: Test Archive Logic (Draft vs Published)')

  // Create draft content
  try {
    const draftResponse = await api.post('/hub/content', {
      title: 'Draft Content - Should NOT be archivable',
      description: 'Testing archive logic',
      contentType: 'Thread',
      body: 'Draft content body',
      status: 'draft',
    })

    const draftId = draftResponse.data.data._id
    log.success('Draft content created')

    // Try to archive draft (should this work?)
    try {
      await api.put(`/hub/content/${draftId}/moderate`, {
        status: 'archived',
      })
      log.warn(
        'Draft content was archived - is this intended behavior?'
      )
    } catch (error) {
      log.info('Draft content cannot be archived (as expected)')
    }

    // Clean up
    await api.delete(`/hub/content/${draftId}`)
    log.info('Cleaned up draft content')
  } catch (error) {
    log.error('Archive logic test failed: ' + error.message)
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(
    `${colors.bright}${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`
  )
  console.log(
    `${colors.bright}${colors.blue}║   Hub Admin Content Management Test Suite    ║${colors.reset}`
  )
  console.log(
    `${colors.bright}${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}\n`
  )

  const results = []

  // Run tests sequentially
  results.push({ name: 'Login', success: await loginAsAdmin() })

  if (!authToken) {
    log.error('Cannot continue without authentication')
    return
  }

  results.push({
    name: 'Create Content',
    success: await createTestContent(),
  })

  if (!testContentId) {
    log.error('Cannot continue without test content')
    return
  }

  results.push({ name: 'Approve', success: await testApprove() })
  results.push({ name: 'Feature', success: await testFeature() })
  results.push({ name: 'Pin', success: await testPin() })
  results.push({ name: 'Unfeature', success: await testUnfeature() })
  results.push({ name: 'Unpin', success: await testUnpin() })
  results.push({ name: 'Archive', success: await testArchive() })
  results.push({ name: 'Reject', success: await testReject() })
  results.push({ name: 'Delete', success: await testDelete() })
  results.push({ name: 'Verify Deletion', success: await verifyDeletion() })

  // Bonus test
  await testArchiveLogic()

  // Summary
  log.title('Test Summary')
  const passed = results.filter((r) => r.success).length
  const total = results.length

  results.forEach((result) => {
    if (result.success) {
      log.success(`${result.name}: PASSED`)
    } else {
      log.error(`${result.name}: FAILED`)
    }
  })

  console.log(
    `\n${colors.bright}Total: ${passed}/${total} tests passed${colors.reset}\n`
  )

  if (passed === total) {
    log.success('All tests passed! 🎉')
  } else {
    log.error(`${total - passed} test(s) failed`)
  }
}

// Run tests
runAllTests().catch((error) => {
  log.error('Test suite crashed: ' + error.message)
  console.error(error)
})
