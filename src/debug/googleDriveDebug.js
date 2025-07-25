/**
 * Google Drive Debug Script
 * For testing Google Drive API initialization issues
 */

import { config } from '../config/environment';
import { apiLogger } from '../lib/logger';
import { checkDomainAuthorization, formatDomainReport } from '../utils/domainChecker';

export const debugGoogleDrive = async () => {
  console.log('🔍 Starting Google Drive Debug...');
  
  // 1. Check environment variables
  console.log('📋 Environment Check:', {
    hasApiKey: !!config.googleDrive.apiKey,
    hasClientId: !!config.googleDrive.clientId,
    apiKeyLength: config.googleDrive.apiKey?.length || 0,
    clientIdLength: config.googleDrive.clientId?.length || 0,
    currentDomain: window.location.origin,
    isHTTPS: window.location.protocol === 'https:'
  });

  // 2. Check if Google API script can be loaded
  try {
    console.log('📡 Loading Google API script...');
    await loadGoogleAPIScript();
    console.log('✅ Google API script loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Google API script:', error);
    return;
  }

  // 3. Check if gapi is available
  if (!window.gapi) {
    console.error('❌ window.gapi is not available after script load');
    return;
  }
  console.log('✅ window.gapi is available');

  // 4. Try to load gapi modules
  try {
    console.log('🔧 Loading GAPI modules...');
    await new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', resolve, reject);
    });
    console.log('✅ GAPI modules loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load GAPI modules:', error);
    return;
  }

  // 5. Try to initialize gapi client
  try {
    console.log('🔧 Initializing GAPI client...');
    await window.gapi.client.init({
      apiKey: config.googleDrive.apiKey,
      clientId: config.googleDrive.clientId,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scope: 'https://www.googleapis.com/auth/drive.file'
    });
    console.log('✅ GAPI client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize GAPI client:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      stack: error?.stack
    });
    return;
  }

  // 6. Check auth2 instance
  try {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance) {
      console.log('✅ Auth2 instance available');
      console.log('Auth status:', {
        isSignedIn: authInstance.isSignedIn.get(),
        currentUser: authInstance.currentUser.get()?.getBasicProfile()?.getName()
      });
    } else {
      console.error('❌ Auth2 instance not available');
    }
  } catch (error) {
    console.error('❌ Error checking auth2 instance:', error);
  }

  console.log('🎉 Google Drive debug completed');
};

const loadGoogleAPIScript = () => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = resolve;
    script.onerror = (error) => {
      reject(new Error(`Failed to load Google API script: ${error.toString()}`));
    };
    
    document.head.appendChild(script);
  });
};

// Make it available globally for testing
window.debugGoogleDrive = debugGoogleDrive;
