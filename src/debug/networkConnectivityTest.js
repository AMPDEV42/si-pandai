/**
 * Network Connectivity Debug Test
 * Standalone script to test network connectivity without UI components
 */

import { getConnectivityStatus, runConnectivityDiagnostics } from '../lib/networkUtils.js';
import { checkNetworkConnectivity, checkSupabaseConnectivity } from '../lib/networkChecker.js';
import { config } from '../config/environment.js';

// Run comprehensive network tests
export const runNetworkDiagnostics = async () => {
  console.log('🔍 Starting Network Connectivity Diagnostics...\n');
  
  try {
    // Test 1: Basic browser connectivity
    console.log('1️⃣ Browser Navigation API Check:');
    console.log(`   navigator.onLine: ${navigator.onLine}`);
    console.log('');

    // Test 2: Enhanced network connectivity
    console.log('2️⃣ Enhanced Network Connectivity Test:');
    const networkResult = await checkNetworkConnectivity();
    console.log('   Result:', JSON.stringify(networkResult, null, 2));
    console.log('');

    // Test 3: Supabase connectivity
    console.log('3️⃣ Supabase Connectivity Test:');
    const supabaseResult = await checkSupabaseConnectivity(
      config.supabase.url, 
      config.supabase.anonKey
    );
    console.log('   Result:', JSON.stringify(supabaseResult, null, 2));
    console.log('');

    // Test 4: Comprehensive status
    console.log('4️⃣ Comprehensive Connectivity Status:');
    const overallStatus = await getConnectivityStatus(
      config.supabase.url, 
      config.supabase.anonKey
    );
    console.log('   Status:', overallStatus.status);
    console.log('   Is Online:', overallStatus.isOnline);
    console.log('   Issues:', overallStatus.issues);
    console.log('');

    // Test 5: Full diagnostics
    console.log('5️⃣ Full Diagnostics Report:');
    const diagnostics = await runConnectivityDiagnostics(
      config.supabase.url, 
      config.supabase.anonKey
    );
    console.log('   Summary:', diagnostics.summary);
    console.log('   Duration:', diagnostics.duration + 'ms');
    console.log('');

    console.log('✅ Network diagnostics completed successfully!');
    return {
      success: true,
      results: {
        network: networkResult,
        supabase: supabaseResult,
        overall: overallStatus,
        diagnostics
      }
    };
  } catch (error) {
    console.error('❌ Network diagnostics failed:', error.message);
    console.error('   Stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
};

// Simple test function for manual debugging
export const quickConnectivityTest = async () => {
  try {
    const status = await getConnectivityStatus(
      config.supabase.url, 
      config.supabase.anonKey
    );
    
    console.log(`🌐 Network Status: ${status.status.toUpperCase()}`);
    console.log(`📡 Online: ${status.isOnline ? 'YES' : 'NO'}`);
    
    if (status.issues.length > 0) {
      console.log('⚠️  Issues:', status.issues.join(', '));
    }
    
    return status;
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    return { status: 'error', error: error.message };
  }
};

// Auto-run if imported directly
if (typeof window !== 'undefined') {
  // Make functions available globally for debugging
  window.runNetworkDiagnostics = runNetworkDiagnostics;
  window.quickConnectivityTest = quickConnectivityTest;
  
  console.log('🔧 Network debugging functions loaded:');
  console.log('   - runNetworkDiagnostics()');
  console.log('   - quickConnectivityTest()');
}
