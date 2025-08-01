/**
 * Simple Google Drive Domain Test
 * Quick test to verify domain authorization issues
 */

import { config } from '../config/environment';

export const testGoogleDriveSimple = async () => {
  console.log('🔍 Testing Google Drive Domain Authorization...');
  console.log('📍 Current Domain:', window.location.origin);
  
  // Test 1: Check if Google API script loads
  try {
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        setTimeout(() => reject(new Error('Script load timeout')), 5000);
      });
    }
    console.log('✅ Google API script loaded');
  } catch (error) {
    console.error('❌ Failed to load Google API script:', error);
    return;
  }
  
  // Test 2: Check GAPI modules
  try {
    await new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', resolve, reject);
      setTimeout(() => reject(new Error('GAPI load timeout')), 5000);
    });
    console.log('✅ GAPI modules loaded');
  } catch (error) {
    console.error('❌ Failed to load GAPI modules:', error);
    return;
  }
  
  // Test 3: Simple client init (this should fail with domain error)
  try {
    await window.gapi.client.init({
      apiKey: config.googleDrive.apiKey,
      clientId: config.googleDrive.clientId,
      scope: config.googleDrive.scope
    });
    console.log('✅ GAPI client initialized - Domain is authorized!');
  } catch (error) {
    console.error('❌ GAPI client init failed:', error);
    console.log('🎯 Expected Error: This confirms domain authorization is needed');
    console.log(`📋 Required Action: Add "${window.location.origin}" to Google Cloud Console OAuth settings`);
    
    // Show specific instructions
    console.log(`
🔧 Fix Instructions:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth 2.0 Client ID: 47138776708-suu99tvg4v2l4248ololg59hvsevpo13.apps.googleusercontent.com
3. Click "Edit"
4. Under "Authorized JavaScript origins", add:
   ${window.location.origin}
5. Save changes
6. Wait 5-10 minutes for propagation
7. Try again
    `);
  }
};

// Make it globally available for console testing
window.testGoogleDriveSimple = testGoogleDriveSimple;

console.log('🧪 Google Drive domain test loaded. Run: testGoogleDriveSimple()');
