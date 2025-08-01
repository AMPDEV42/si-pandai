/**
 * Verify Google Drive Error Suppression
 * Test script to confirm domain authorization errors are properly handled
 */

import { googleDriveService } from '../services/googleDriveService';
import { checkGoogleDriveAvailability, safeInitializeGoogleDrive } from '../utils/googleDriveAvailability';

export const verifyGoogleDriveFix = async () => {
  console.log('🧪 Verifying Google Drive error suppression...\n');

  // Test 1: Check domain blocking status
  console.log('1️⃣ Domain Blocking Status:');
  console.log(`   isDomainBlocked: ${googleDriveService.isDomainBlocked}`);
  console.log(`   domainAuthError: ${googleDriveService.domainAuthError}`);
  console.log(`   isAvailable(): ${googleDriveService.isAvailable()}`);
  console.log('');

  // Test 2: Test availability checker
  console.log('2️⃣ Availability Check:');
  const availability = await checkGoogleDriveAvailability();
  console.log(`   Available: ${availability.available}`);
  console.log(`   Reason: ${availability.reason}`);
  console.log(`   Code: ${availability.code}`);
  console.log('');

  // Test 3: Test safe initialization
  console.log('3️⃣ Safe Initialization:');
  const initResult = await safeInitializeGoogleDrive();
  console.log(`   Initialization Result: ${initResult}`);
  console.log('');

  // Test 4: Test isAuthenticated (should not throw errors)
  console.log('4️⃣ Authentication Check:');
  try {
    const authResult = await googleDriveService.isAuthenticated();
    console.log(`   Authentication Result: ${authResult}`);
  } catch (error) {
    console.log(`   Authentication Error: ${error.message}`);
  }
  console.log('');

  // Test 5: Test configuration check
  console.log('5️⃣ Configuration Check:');
  const isConfigured = googleDriveService.isConfigured();
  console.log(`   Is Configured: ${isConfigured}`);
  console.log('');

  console.log('✅ Google Drive error suppression verification completed!');
  console.log('📊 Summary:');
  console.log(`   - Domain Blocked: ${googleDriveService.isDomainBlocked ? 'YES' : 'NO'}`);
  console.log(`   - Service Available: ${availability.available ? 'YES' : 'NO'}`);
  console.log(`   - Safe to Use: ${initResult ? 'YES' : 'NO'}`);

  return {
    domainBlocked: googleDriveService.isDomainBlocked,
    available: availability.available,
    safeToUse: initResult,
    summary: availability
  };
};

// Test current error level by triggering a domain auth error
export const testErrorSuppression = async () => {
  console.log('🔇 Testing error suppression...');
  
  // Force trigger domain auth error
  try {
    // This should fail gracefully without ERROR logs
    if (!googleDriveService.isDomainBlocked) {
      await googleDriveService.initialize();
    }
    console.log('No domain authorization error occurred (already blocked or fixed)');
  } catch (error) {
    console.log('Domain authorization error caught:', error.message.substring(0, 100) + '...');
  }
  
  console.log('Error suppression test completed');
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  window.verifyGoogleDriveFix = verifyGoogleDriveFix;
  window.testErrorSuppression = testErrorSuppression;
  
  console.log('🔧 Google Drive verification functions loaded:');
  console.log('   - verifyGoogleDriveFix()');
  console.log('   - testErrorSuppression()');
}
