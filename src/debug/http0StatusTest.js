/**
 * HTTP 0 Status Test
 * Tests scenarios that typically result in HTTP 0 status codes
 */

export const testHttp0Scenarios = async () => {
  console.log('🧪 Testing HTTP 0 status scenarios...\n');

  const scenarios = [
    {
      name: 'CORS blocked request',
      url: 'https://www.facebook.com/api/test',
      description: 'Should be blocked by CORS and result in HTTP 0'
    },
    {
      name: 'Invalid protocol',
      url: 'invalid://test.com',
      description: 'Invalid protocol should fail'
    },
    {
      name: 'Cancelled request',
      url: 'https://httpbin.org/delay/10',
      timeout: 100,
      description: 'Request cancelled due to timeout'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    
    try {
      const controller = new AbortController();
      if (scenario.timeout) {
        setTimeout(() => controller.abort(), scenario.timeout);
      }

      const response = await fetch(scenario.url, {
        signal: controller.signal,
        mode: 'cors'
      });

      console.log(`  Result: HTTP ${response.status} ${response.statusText}`);
      
    } catch (error) {
      console.log(`  Caught error: ${error.name} - ${error.message}`);
    }
    console.log('');
  }

  console.log('✅ HTTP 0 testing completed');
  console.log('Note: These errors should now be filtered out from console logs');
};

// Test extension URLs (should be filtered)
export const testExtensionFiltering = () => {
  console.log('🔍 Testing extension URL filtering...\n');

  const extensionUrls = [
    'chrome-extension://test/content.js',
    'moz-extension://test/content.js',
    'safari-extension://test/content.js'
  ];

  extensionUrls.forEach(url => {
    console.log(`Testing extension URL: ${url}`);
    fetch(url).catch(error => {
      console.log(`  This error should be filtered: ${error.message}`);
    });
  });

  console.log('✅ Extension URL filtering test completed');
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  window.testHttp0Scenarios = testHttp0Scenarios;
  window.testExtensionFiltering = testExtensionFiltering;
  
  console.log('🔧 HTTP 0 testing functions loaded:');
  console.log('   - testHttp0Scenarios()');
  console.log('   - testExtensionFiltering()');
}
