/**
 * Google Drive Service
 * Handles file uploads and folder management in Google Drive
 * Updated with improved error handling and configuration management
 */

import { apiLogger } from '../lib/logger';
import { config } from '../config/environment';

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.gapi = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.domainAuthError = null; // Track domain authorization errors
    this.isDomainBlocked = false; // Flag to prevent repeated attempts
  }

  /**
   * Check if Google Drive is properly configured
   */
  isConfigured() {
    const hasApiKey = !!config.googleDrive.apiKey;
    const hasClientId = !!config.googleDrive.clientId;
    const isEnabled = config.googleDrive.enabled;

    apiLogger.debug('Google Drive configuration check', {
      hasApiKey,
      hasClientId,
      isEnabled,
      isDomainBlocked: this.isDomainBlocked,
      apiKeyLength: config.googleDrive.apiKey?.length || 0,
      clientIdLength: config.googleDrive.clientId?.length || 0
    });

    // Return false if domain is blocked to prevent repeated attempts
    if (this.isDomainBlocked) {
      return false;
    }

    return isEnabled && hasApiKey && hasClientId;
  }

  /**
   * Initialize Google Drive API with retry mechanism
   */
  async initialize() {
    // Return false immediately if domain is blocked
    if (this.isDomainBlocked) {
      apiLogger.warn('Google Drive initialization skipped - domain authorization error', {
        domain: window.location.origin,
        error: this.domainAuthError
      });
      return false;
    }

    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return true if already initialized
    if (this.isInitialized && this.gapi) {
      return true;
    }

    this.initializationPromise = this._performInitialization()
      .then(async () => {
        // After initialization, try to authenticate automatically if not already authenticated
        if (!this.isAuthenticated()) {
          try {
            await this.authenticate(true); // Silent authentication
          } catch (error) {
            apiLogger.warn('Silent authentication failed, will require user interaction', error);
          }
        }
        return true;
      });
      
    return this.initializationPromise;
  }

  async _performInitialization() {
    try {
      // Check configuration
      if (!this.isConfigured()) {
        const errorMsg = '❌ Google Drive credentials not found in environment variables. ' +
          'Please check your .env file and ensure VITE_GOOGLE_DRIVE_API_KEY and VITE_GOOGLE_DRIVE_CLIENT_ID are set.';
        apiLogger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Log domain information for debugging
      const currentDomain = window.location.origin;
      const debugInfo = {
        hasApiKey: !!config.googleDrive.apiKey,
        hasClientId: !!config.googleDrive.clientId,
        currentDomain,
        isHttps: window.location.protocol === 'https:',
        apiKeyPrefix: config.googleDrive.apiKey?.substring(0, 3) + '...',
        clientIdPrefix: config.googleDrive.clientId?.substring(0, 10) + '...'
      };
      
      apiLogger.info('🚀 Initializing Google Drive API', debugInfo);

      // Load Google API script
      await this.loadGoogleAPI();

      // Initialize GAPI client and auth2
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const errorInfo = {
            ...debugInfo,
            hasGapi: !!window.gapi,
            hasGapiClient: !!window.gapi?.client,
            hasGapiAuth2: !!window.gapi?.auth2,
            error: 'Initialization timeout'
          };
          
          const errorMsg = `⏱️ Google API initialization timeout after 15 seconds.

🔍 Debug Info:
- Domain: ${window.location.origin}
- HTTPS: ${window.location.protocol === 'https:'}
- GAPI loaded: ${!!window.gapi}
- GAPI client: ${!!window.gapi?.client}
- GAPI auth2: ${!!window.gapi?.auth2}

💡 Common Solutions:
1. Verify domain is authorized in Google Cloud Console
2. Check browser console for CORS errors
3. Ensure no ad blockers are interfering
4. Verify API key and client ID are correct

📋 Configuration Check:
- API Key: ${config.googleDrive.apiKey ? '✅ Present' : '❌ Missing'}
- Client ID: ${config.googleDrive.clientId ? '✅ Present' : '❌ Missing'}
- Authorized Domain: ${window.location.hostname}`;

          apiLogger.error('GAPI initialization timeout', errorInfo);
          reject(new Error(errorMsg));
        }, 15000); // 15 seconds timeout

        try {
          window.gapi.load('client:auth2', {
            callback: async () => {
              clearTimeout(timeout);
              try {
                // Check if gapi is properly loaded
                if (!window.gapi) {
                  throw new Error('GAPI not loaded - window.gapi is undefined');
                }

                if (!window.gapi.client) {
                  throw new Error('GAPI client modules not loaded properly. Try refreshing the page.');
                }

                apiLogger.info('Starting GAPI client initialization', {
                  hasGapi: !!window.gapi,
                  hasClient: !!window.gapi.client,
                  hasAuth2: !!window.gapi.auth2,
                  apiKeyLength: config.googleDrive.apiKey?.length,
                  clientIdLength: config.googleDrive.clientId?.length
                });

                // First initialize the client without auth parameters
                await window.gapi.client.init({
                  apiKey: config.googleDrive.apiKey,
                  discoveryDocs: [config.googleDrive.discoveryDoc]
                });

                apiLogger.info('GAPI client initialized, now initializing auth2');

                // Then initialize auth2 separately
                await window.gapi.auth2.init({
                  client_id: config.googleDrive.clientId,
                  scope: config.googleDrive.scope
                });

                this.gapi = window.gapi;
                this.isInitialized = true;
                this.initializationPromise = null;

                apiLogger.info('Google Drive API initialized successfully');
                resolve();
              } catch (error) {
                this.handleGapiError(error, reject);
              }
            },
            onerror: (error) => {
              clearTimeout(timeout);
              const errorDetails = {
                name: error?.name || 'Unknown',
                message: error?.message || 'Failed to load GAPI modules',
                code: error?.code || 'GAPI_LOAD_ERROR'
              };
              apiLogger.error('Failed to load GAPI modules', { error: errorDetails });
              reject(new Error(`Failed to load GAPI modules: ${errorDetails.message}`));
            },
            timeout: 10000,
            ontimeout: () => {
              const errorMsg = 'Timed out while loading GAPI modules. Check your internet connection.';
              apiLogger.error(errorMsg);
              reject(new Error(errorMsg));
            }
          });
        } catch (error) {
          clearTimeout(timeout);
          this.handleGapiError(error, reject);
        }
      });
    } catch (error) {
      this.initializationPromise = null;
      this.isInitialized = false;
      apiLogger.error('Failed to initialize Google Drive API', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated with Google Drive
   * @returns {Promise<boolean>} True if authenticated, false otherwise
   */
  async isAuthenticated() {
    try {
      // Return false immediately if domain is blocked
      if (this.isDomainBlocked) {
        return false;
      }

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult) {
          return false;
        }
      }

      if (!this.gapi || !this.gapi.auth2) {
        throw new Error('Google API not properly initialized');
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        return false;
      }

      const isSignedIn = authInstance.isSignedIn.get();
      if (isSignedIn) {
        const user = authInstance.currentUser.get();
        const authResponse = user.getAuthResponse();
        this.accessToken = authResponse.access_token;
        return true;
      }

      return false;
    } catch (error) {
      // Only log as error if it's not a domain authorization issue
      if (error.message?.includes('Domain Authorization Required')) {
        apiLogger.debug('Authentication check skipped - domain not authorized', {
          domain: window.location.origin
        });
      } else {
        apiLogger.error('Failed to check authentication status', error);
      }
      return false;
    }
  }

  /**
   * Handle GAPI initialization errors with specific guidance
   */
  handleGapiError(error, reject) {
    const errorDetails = {
      name: error?.name || 'Unknown',
      message: error?.message || 'No message',
      code: error?.code || 'No code',
      details: error?.details || 'No details',
      stack: error?.stack || 'No stack trace',
      stringified: error?.toString() || 'Cannot stringify error',
      currentDomain: window.location.origin,
      gapiAvailable: !!window.gapi,
      clientAvailable: !!window.gapi?.client,
      auth2Available: !!window.gapi?.auth2
    };

    apiLogger.error('GAPI initialization error', { error: errorDetails });

    // Check for common issues and provide specific guidance
    if (errorDetails.message.includes('origin') ||
        errorDetails.message.includes('domain') ||
        errorDetails.message.includes('not allowed') ||
        error?.error === 'idpiframe_initialization_failed') {

      // Mark domain as blocked and store error details
      this.isDomainBlocked = true;
      this.domainAuthError = `Domain ${window.location.origin} not authorized`;

      const errorMessage = `❌ Domain Authorization Required: The domain "${window.location.origin}" is not authorized in Google Cloud Console.

📋 To fix this:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit OAuth 2.0 Client ID: ${config.googleDrive.clientId || 'YOUR_CLIENT_ID'}
3. Add to "Authorized JavaScript origins": ${window.location.origin}
4. Add to "Authorized redirect URIs": ${window.location.origin}/auth/google/callback
5. Save and wait 5-10 minutes for changes to propagate`;

      // Log once at warning level to reduce noise
      apiLogger.warn('Google Drive domain authorization required', {
        domain: window.location.origin,
        clientId: config.googleDrive.clientId,
        isDomainBlocked: true
      });

      reject(new Error(errorMessage));
    } else if (errorDetails.code === 'popup_blocked_by_browser') {
      reject(new Error('❌ Popup blocked by browser. Please allow popups for this domain.'));
    } else if (!errorDetails.gapiAvailable) {
      reject(new Error('❌ Google API script not loaded. Check network connectivity and try again.'));
    } else if (!errorDetails.clientAvailable) {
      reject(new Error('❌ GAPI client modules not loaded properly. Try refreshing the page.'));
    } else if (errorDetails.message === 'No message' || errorDetails.message === '') {
      reject(new Error(`⚠️ Google API initialization failed silently. This usually indicates domain authorization issues.

🔍 Current domain: ${window.location.origin}
💡 Most likely cause: Domain not authorized in Google Cloud Console OAuth settings.

Please add this domain to your Google Cloud Console OAuth 2.0 Client ID authorized origins.`));
    } else {
      reject(new Error(`❌ GAPI initialization failed: ${errorDetails.message || errorDetails.code || 'Unknown error'}`));
    }
  }

  /**
   * Load Google API script with retry mechanism
   */
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        apiLogger.debug('Google API already loaded');
        resolve();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (existingScript) {
        apiLogger.debug('Google API script already exists, waiting for load');
        existingScript.addEventListener('load', resolve);
        existingScript.addEventListener('error', (error) => {
          const errorDetails = {
            message: 'Google API script failed to load',
            src: existingScript.src,
            error: error.toString()
          };
          apiLogger.error('Existing Google API script failed to load', errorDetails);
          reject(new Error(`Google API script load failed: ${errorDetails.message}`));
        });
        return;
      }

      apiLogger.info('Loading Google API script...');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        apiLogger.info('Google API script loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        const errorDetails = {
          message: 'Failed to load Google API script',
          src: script.src,
          error: error.toString(),
          type: error.type || 'unknown'
        };
        apiLogger.error('Failed to load Google API script', errorDetails);
        reject(new Error(`Google API script load failed: ${errorDetails.message}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Authenticate with Google Drive
   * @param {boolean} silent - If true, will attempt silent authentication without user interaction
   */
  async authenticate(silent = true) {
    try {
      // Return false immediately if domain is blocked
      if (this.isDomainBlocked) {
        throw new Error('Google Drive unavailable: Domain authorization required');
      }

      if (!this.gapi || !this.gapi.auth2) {
        throw new Error('Google API not initialized');
      }

      const auth2 = this.gapi.auth2.getAuthInstance();
      
      if (!auth2) {
        throw new Error('Google Auth2 not initialized');
      }

      // Always try silent authentication first
      const googleUser = await auth2.signInSilently();
      this.accessToken = googleUser.getAuthResponse().access_token;
      apiLogger.info('Successfully authenticated with Google Drive');
      return true;
      
    } catch (error) {
      // If silent auth fails and we're not in silent mode, show the sign-in popup
      if (!silent && (error.error === 'popup_closed_by_user' || error.error === 'access_denied')) {
        try {
          const googleUser = await auth2.signIn({
            prompt: 'select_account',
          });
          this.accessToken = googleUser.getAuthResponse().access_token;
          apiLogger.info('Successfully authenticated with Google Drive after silent failure');
          return true;
        } catch (signInError) {
          apiLogger.error('Failed to authenticate with Google Drive after silent failure', signInError);
          throw signInError;
        }
      }
      
      apiLogger.error('Failed to authenticate with Google Drive', error);
      throw error;
    }
  }

  // ... (other methods remain the same)
}

// Create and export service instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
