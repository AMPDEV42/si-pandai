/**
 * Fetch Error Test Script
 * Tests various fetch scenarios to verify error handling improvements
 */

// Test different fetch scenarios
export const testFetchErrorHandling = async () => {
  console.log('🧪 Testing fetch error handling...\n');

  const tests = [
    {
      name: 'Valid endpoint',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET'
    },
    {
      name: 'Non-existent endpoint (404)',
      url: 'https://jsonplaceholder.typicode.com/posts/999999',
      method: 'GET'
    },
    {
      name: 'Invalid domain',
      url: 'https://this-domain-does-not-exist-12345.com',
      method: 'GET'
    },
    {
      name: 'CORS blocked endpoint',
      url: 'https://www.google.com/api/test',
      method: 'GET'
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    try {
      const response = await fetch(test.url, {
        method: test.method,
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (response.ok) {
        console.log(`  ✅ Success: ${response.status} ${response.statusText}`);
        results.push({ ...test, success: true, status: response.status });
      } else {
        console.log(`  ⚠️  HTTP Error: ${response.status} ${response.statusText}`);
        results.push({ ...test, success: false, status: response.status, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      console.log(`  ❌ Network Error: ${error.message}`);
      results.push({ ...test, success: false, error: error.message });
    }
    console.log('');
  }

  console.log('📊 Test Summary:');
  console.log(`  Total tests: ${tests.length}`);
  console.log(`  Successful: ${results.filter(r => r.success).length}`);
  console.log(`  Failed: ${results.filter(r => !r.success).length}`);

  return results;
};

// Test empty response handling specifically
export const testEmptyResponseHandling = async () => {
  console.log('🔍 Testing empty response handling...\n');

  try {
    // Test a HEAD request which typically has empty body
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });

    console.log(`HEAD request result: ${response.status} ${response.statusText}`);
    console.log(`Response body should be empty for HEAD request`);

    return { success: true, status: response.status };
  } catch (error) {
    console.log(`HEAD request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Run tests if called directly
if (typeof window !== 'undefined') {
  window.testFetchErrorHandling = testFetchErrorHandling;
  window.testEmptyResponseHandling = testEmptyResponseHandling;
  
  console.log('🔧 Fetch error testing functions loaded:');
  console.log('   - testFetchErrorHandling()');
  console.log('   - testEmptyResponseHandling()');
}
