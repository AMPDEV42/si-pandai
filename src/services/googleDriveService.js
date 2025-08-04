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
   * Check if Google Drive is available (not blocked)
   */
  isAvailable() {
    return !this.isDomainBlocked && this.isConfigured();
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
                  throw new Error('GAPI client modules not loaded properly. This may be due to CSP restrictions.');
                }

                apiLogger.info('Starting GAPI client initialization', {
                  hasGapi: !!window.gapi,
                  hasClient: !!window.gapi.client,
                  hasAuth2: !!window.gapi.auth2,
                  apiKeyLength: config.googleDrive.apiKey?.length,
                  clientIdLength: config.googleDrive.clientId?.length,
                  currentOrigin: window.location.origin
                });

                // First initialize the client without auth parameters
                await window.gapi.client.init({
                  apiKey: config.googleDrive.apiKey,
                  discoveryDocs: [config.googleDrive.discoveryDoc]
                });

                apiLogger.info('GAPI client initialized, now initializing auth2');

                // Then initialize auth2 separately with explicit iframe policy
                await window.gapi.auth2.init({
                  client_id: config.googleDrive.clientId,
                  scope: config.googleDrive.scope,
                  // Configure iframe settings for better CSP compliance
                  iframe_policy: 'allow-scripts allow-same-origin allow-storage-access-by-user-activation'
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
                message: error?.message || 'Failed to load GAPI modules - possible CSP violation',
                code: error?.code || 'GAPI_LOAD_ERROR',
                suggestion: 'Check Content Security Policy configuration'
              };
              apiLogger.error('Failed to load GAPI modules', { error: errorDetails });
              reject(new Error(`Failed to load GAPI modules: ${errorDetails.message}. ${errorDetails.suggestion}`));
            },
            timeout: 15000, // Increased timeout for better reliability
            ontimeout: () => {
              const errorMsg = 'Timed out while loading GAPI modules. This may be due to CSP restrictions or network issues.';
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
   * Handle GAPI initialization errors with specific guidance including CSP issues
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
      auth2Available: !!window.gapi?.auth2,
      userAgent: navigator.userAgent,
      protocol: window.location.protocol
    };

    // Check for CSP-related errors
    const isCspError = errorDetails.message.includes('CSP') ||
                      errorDetails.message.includes('Content Security Policy') ||
                      errorDetails.message.includes('script-src') ||
                      errorDetails.message.includes('frame-src') ||
                      errorDetails.code === 'CSP_VIOLATION';

    // Check for domain authorization errors
    const isDomainError = errorDetails.message.includes('origin') ||
                         errorDetails.message.includes('domain') ||
                         errorDetails.message.includes('not allowed') ||
                         error?.error === 'idpiframe_initialization_failed';

    // Log appropriately based on error type
    if (isDomainError) {
      apiLogger.debug('GAPI initialization skipped - domain authorization required', {
        domain: window.location.origin,
        error: errorDetails
      });
    } else if (isCspError) {
      apiLogger.warn('GAPI initialization failed - CSP issue detected', {
        domain: window.location.origin,
        error: errorDetails
      });
    } else {
      apiLogger.error('GAPI initialization error', { error: errorDetails });
    }

    // Handle CSP-related errors
    if (isCspError) {
      const errorMessage = `🔒 Content Security Policy Error: Google API scripts are blocked by CSP.

📋 To fix this:
1. Update your Content Security Policy to allow:
   - script-src: 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com
   - frame-src: https://accounts.google.com https://content.googleapis.com
   - connect-src: https://*.googleapis.com https://accounts.google.com

2. If using Vercel, update vercel.json headers
3. If using meta tags, update index.html CSP directives
4. Allow iframe sandbox attributes: allow-scripts allow-same-origin`;

      reject(new Error(errorMessage));
      return;
    }

    // Handle domain authorization errors
    if (isDomainError) {
      // Mark domain as blocked and store error details
      this.isDomainBlocked = true;
      this.domainAuthError = `Domain ${window.location.origin} not authorized`;

      const errorMessage = `❌ Domain Authorization Required: The domain "${window.location.origin}" is not authorized in Google Cloud Console.

📋 To fix this:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit OAuth 2.0 Client ID: ${config.googleDrive.clientId || 'YOUR_CLIENT_ID'}
3. Add to "Authorized JavaScript origins": ${window.location.origin}
4. Add to "Authorized redirect URIs": ${window.location.origin}/auth/google/callback
5. Save and wait 5-10 minutes for changes to propagate

💡 Note: Ensure your Content Security Policy also allows Google's domains.`;

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
      reject(new Error('❌ Google API script not loaded. Check CSP configuration and network connectivity.'));
    } else if (!errorDetails.clientAvailable) {
      reject(new Error('❌ GAPI client modules not loaded properly. This may be due to CSP restrictions. Try refreshing the page.'));
    } else if (errorDetails.message === 'No message' || errorDetails.message === '') {
      reject(new Error(`⚠️ Google API initialization failed silently. This usually indicates domain authorization or CSP issues.

🔍 Current domain: ${window.location.origin}
💡 Possible causes:
- Domain not authorized in Google Cloud Console OAuth settings
- Content Security Policy blocking Google scripts
- Network connectivity issues

Please check both OAuth configuration and CSP settings.`));
    } else {
      reject(new Error(`❌ GAPI initialization failed: ${errorDetails.message || errorDetails.code || 'Unknown error'}. Check CSP and OAuth configuration.`));
    }
  }

  /**
   * Load Google API script with retry mechanism and CSP compliance
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
            message: 'Google API script failed to load - possible CSP violation',
            src: existingScript.src,
            error: error.toString(),
            suggestion: 'Check Content Security Policy allows scripts from googleapis.com'
          };
          apiLogger.error('Existing Google API script failed to load', errorDetails);
          reject(new Error(`Google API script load failed: ${errorDetails.message}. ${errorDetails.suggestion}`));
        });
        return;
      }

      apiLogger.info('Loading Google API script...');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;

      // Add CSP-friendly attributes
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'strict-origin-when-cross-origin';

      const timeout = setTimeout(() => {
        apiLogger.error('Google API script load timeout - possible CSP or network issue');
        reject(new Error('Google API script load timeout. Check Content Security Policy allows scripts from googleapis.com and accounts.google.com'));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        apiLogger.info('Google API script loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        const errorDetails = {
          message: 'Failed to load Google API script - possible CSP violation',
          src: script.src,
          error: error.toString(),
          type: error.type || 'unknown',
          suggestion: 'Ensure CSP allows scripts from googleapis.com'
        };
        apiLogger.error('Failed to load Google API script', errorDetails);
        reject(new Error(`Google API script load failed: ${errorDetails.message}. ${errorDetails.suggestion}`));
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
        apiLogger.debug('Authentication skipped - domain authorization required');
        return false;
      }

      if (!this.gapi || !this.gapi.auth2) {
        throw new Error('Google API not initialized');
      }

      const auth2 = this.gapi.auth2.getAuthInstance();
      
      if (!auth2) {
        throw new Error('Google Auth2 not initialized');
      }

      // Always try silent authentication first with improved error handling
      const googleUser = await auth2.signInSilently();
      const authResponse = googleUser.getAuthResponse();

      if (!authResponse || !authResponse.access_token) {
        throw new Error('Failed to get access token from Google authentication');
      }

      this.accessToken = authResponse.access_token;
      apiLogger.info('Successfully authenticated with Google Drive', {
        hasToken: !!this.accessToken,
        tokenLength: this.accessToken?.length || 0,
        expiresIn: authResponse.expires_in
      });
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

  /**
   * Find or create folder by name with error handling
   */
  async findOrCreateFolder(folderName, parentFolderId = null) {
    try {
      await this.ensureAuthenticated();

      // Sanitize folder name
      const sanitizedName = folderName.replace(/[<>:"/\\|?*]/g, '_').trim();
      if (!sanitizedName) {
        throw new Error('Invalid folder name');
      }

      // Search for existing folder
      let query = `name='${sanitizedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await this.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 10
      });

      const folders = response.result.files;

      if (folders && folders.length > 0) {
        apiLogger.debug('Found existing folder', {
          folderName: sanitizedName,
          folderId: folders[0].id
        });
        return folders[0].id;
      }

      // Create new folder if not found
      const folderMetadata = {
        name: sanitizedName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentFolderId) {
        folderMetadata.parents = [parentFolderId];
      }

      const createResponse = await this.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name'
      });

      const folderId = createResponse.result.id;
      apiLogger.info('Created new folder', {
        folderName: sanitizedName,
        folderId,
        parentFolderId
      });

      return folderId;

    } catch (error) {
      apiLogger.error('Failed to find or create folder', {
        folderName,
        parentFolderId,
        error: error.message
      });
      throw new Error(`Gagal membuat folder "${folderName}": ${error.message}`);
    }
  }

  /**
   * Create folder structure for submission with validation
   */
  async createSubmissionFolderStructure(submissionType, employeeName) {
    try {
      if (!submissionType?.category) {
        throw new Error('Submission type category is required');
      }

      if (!employeeName?.trim()) {
        throw new Error('Employee name is required');
      }

      await this.ensureAuthenticated();

      // Create main SIPANDAI folder
      const mainFolderId = await this.findOrCreateFolder('SIPANDAI');

      // Create category folder (e.g., "Pemberhentian", "Pengangkatan")
      const categoryFolderId = await this.findOrCreateFolder(
        submissionType.category,
        mainFolderId
      );

      // Create employee folder
      const sanitizedEmployeeName = employeeName.trim().replace(/[<>:"/\\|?*]/g, '_');
      const employeeFolderId = await this.findOrCreateFolder(
        sanitizedEmployeeName,
        categoryFolderId
      );

      apiLogger.info('Submission folder structure created successfully', {
        submissionCategory: submissionType.category,
        employeeName: sanitizedEmployeeName,
        folderIds: {
          main: mainFolderId,
          category: categoryFolderId,
          employee: employeeFolderId
        }
      });

      return {
        mainFolderId,
        categoryFolderId,
        employeeFolderId
      };

    } catch (error) {
      apiLogger.error('Failed to create submission folder structure', {
        submissionType: submissionType?.category,
        employeeName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Upload file to Google Drive with retry mechanism
   */
  async uploadFile(file, folderId, fileName = null) {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        await this.ensureAuthenticated();

        if (!file || !folderId) {
          throw new Error('File and folder ID are required');
        }

        // Validate file
        this.validateFile(file);

        // Sanitize filename
        const sanitizedFileName = this.sanitizeFileName(fileName || file.name);

        const metadata = {
          name: sanitizedFileName,
          parents: [folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,createdTime', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: form
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();

        apiLogger.info('File uploaded to Google Drive successfully', {
          fileName: result.name,
          fileId: result.id,
          folderId,
          fileSize: file.size
        });

        return {
          id: result.id,
          name: result.name,
          webViewLink: result.webViewLink,
          webContentLink: result.webContentLink,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          source: 'google-drive'
        };

      } catch (error) {
        attempt++;
        apiLogger.error(`File upload attempt ${attempt} failed`, {
          fileName: fileName || file.name,
          folderId,
          error: error.message,
          attempt
        });

        if (attempt >= this.maxRetries) {
          throw new Error(`Gagal upload file setelah ${this.maxRetries} percobaan: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId) {
    try {
      await this.ensureAuthenticated();

      if (!fileId) {
        throw new Error('File ID is required');
      }

      await this.gapi.client.drive.files.delete({
        fileId: fileId
      });

      apiLogger.info('File deleted from Google Drive', { fileId });

    } catch (error) {
      apiLogger.error('Failed to delete file from Google Drive', {
        fileId,
        error: error.message
      });
      throw new Error(`Gagal menghapus file: ${error.message}`);
    }
  }

  /**
   * Get file download URL
   */
  getFileDownloadUrl(fileId) {
    if (!fileId) {
      throw new Error('File ID is required');
    }
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Validate file before upload
   */
  validateFile(file) {
    if (!file) {
      throw new Error('File is required');
    }

    const maxSize = config.security.maxFileSize;
    if (file.size > maxSize) {
      throw new Error(`File terlalu besar. Maksimal ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    const allowedTypes = config.security.allowedFileTypes;
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, PNG, atau GIF');
    }

    return true;
  }

  /**
   * Sanitize filename for Google Drive
   */
  sanitizeFileName(fileName) {
    if (!fileName) {
      return 'untitled';
    }

    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Ensure user is authenticated before API calls
   */
  async ensureAuthenticated() {
    if (!this.accessToken || !(await this.isAuthenticated())) {
      await this.authenticate();
    }
  }

  /**
   * Reset service state (for testing or error recovery)
   */
  reset() {
    this.accessToken = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.retryCount = 0;
    this.isDomainBlocked = false;
    this.domainAuthError = null;
    apiLogger.info('Google Drive service reset');
  }
}

// Create and export service instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
