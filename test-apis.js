const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Test results
const results = {
  passed: [],
  failed: [],
};

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function test(name, fn) {
  try {
    await fn();
    results.passed.push(name);
    log(`✓ ${name}`, 'green');
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`✗ ${name}: ${error.message}`, 'red');
  }
}

async function runTests() {
  log('\n=== Starting API Tests ===\n', 'cyan');

  // 1. Auth Tests
  log('--- Auth Tests ---', 'yellow');

  await test('Check if server is running', async () => {
    const response = await axios.get(`${API_BASE}/health`, { validateStatus: () => true });
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Server not responding properly (${response.status})`);
    }
  });

  // 2. Hub Content Tests (Public endpoints)
  log('\n--- Hub Content Tests ---', 'yellow');

  await test('GET /hub/content - List all contents', async () => {
    const response = await axios.get(`${API_BASE}/hub/content?page=1&limit=5`, {
      validateStatus: () => true,
    });
    if (response.status === 401) {
      // Expected for protected route without token
      return;
    }
    if (response.status !== 200) {
      throw new Error(`Expected 200 or 401, got ${response.status}`);
    }
  });

  await test('GET /hub/featured - Get featured content', async () => {
    const response = await axios.get(`${API_BASE}/hub/featured`, {
      validateStatus: () => true,
    });
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Expected 200 or 404, got ${response.status}`);
    }
  });

  // 3. Academy Tests
  log('\n--- Academy Tests ---', 'yellow');

  await test('GET /academy/courses - List courses', async () => {
    const response = await axios.get(`${API_BASE}/academy/courses?page=1&limit=5`, {
      validateStatus: () => true,
    });
    if (response.status === 401) {
      return; // Protected route
    }
    if (response.status !== 200) {
      throw new Error(`Expected 200 or 401, got ${response.status}`);
    }
  });

  // 4. Alpha Tests
  log('\n--- Alpha Tests ---', 'yellow');

  await test('GET /alpha/posts - List alpha posts', async () => {
    const response = await axios.get(`${API_BASE}/alpha/posts?page=1&limit=5`, {
      validateStatus: () => true,
    });
    if (response.status === 401) {
      return; // Protected route
    }
    if (response.status !== 200) {
      throw new Error(`Expected 200 or 401, got ${response.status}`);
    }
  });

  // 5. Info Tests
  log('\n--- Info Tests ---', 'yellow');

  await test('GET /info/posts - List engagement posts', async () => {
    const response = await axios.get(`${API_BASE}/info/posts?page=1&limit=5`, {
      validateStatus: () => true,
    });
    if (response.status === 401) {
      return; // Protected route
    }
    if (response.status !== 200) {
      throw new Error(`Expected 200 or 401, got ${response.status}`);
    }
  });

  // 6. Studio Tests
  log('\n--- Studio Tests ---', 'yellow');

  await test('GET /studio/requests - List production requests', async () => {
    const response = await axios.get(`${API_BASE}/studio/requests?page=1&limit=5`, {
      validateStatus: () => true,
    });
    if (response.status === 401) {
      return; // Protected route
    }
    if (response.status !== 200) {
      throw new Error(`Expected 200 or 401, got ${response.status}`);
    }
  });

  // 7. Admin Tests
  log('\n--- Admin Tests ---', 'yellow');

  await test('GET /admin/analytics - Get analytics (should require auth)', async () => {
    const response = await axios.get(`${API_BASE}/admin/analytics`, {
      validateStatus: () => true,
    });
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Expected 401 or 403 (unauthorized), got ${response.status}`);
    }
  });

  await test('GET /admin/users - List users (should require auth)', async () => {
    const response = await axios.get(`${API_BASE}/admin/users`, {
      validateStatus: () => true,
    });
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Expected 401 or 403 (unauthorized), got ${response.status}`);
    }
  });

  // Summary
  log('\n=== Test Summary ===\n', 'cyan');
  log(`Passed: ${results.passed.length}`, 'green');
  log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');

  if (results.failed.length > 0) {
    log('\nFailed Tests:', 'red');
    results.failed.forEach(({ name, error }) => {
      log(`  - ${name}: ${error}`, 'red');
    });
  }

  log('\n✓ All tests completed!\n', 'cyan');
}

runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
