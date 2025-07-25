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
      apiKeyLength: config.googleDrive.apiKey?.length || 0,
      clientIdLength: config.googleDrive.clientId?.length || 0
    });

    return isEnabled && hasApiKey && hasClientId;
  }

  /**
   * Initialize Google Drive API with retry mechanism
   */
  async initialize() {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return true if already initialized
    if (this.isInitialized && this.gapi) {
      return true;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    try {
      // Check configuration
      if (!this.isConfigured()) {
        throw new Error('Google Drive credentials not found in environment variables');
      }

      // Log domain information for debugging
      const currentDomain = window.location.origin;
      apiLogger.info('Initializing Google Drive API', {
        hasApiKey: !!config.googleDrive.apiKey,
        hasClientId: !!config.googleDrive.clientId,
        currentDomain,
        apiKeyPrefix: config.googleDrive.apiKey?.substring(0, 10) + '...',
        clientIdPrefix: config.googleDrive.clientId?.substring(0, 20) + '...'
      });

      // Load Google API script
      await this.loadGoogleAPI();

      // Initialize GAPI client and auth2 separately
      await new Promise((resolve, reject) => {
        // Add timeout to handle cases where GAPI doesn't load
        const timeout = setTimeout(() => {
          reject(new Error('GAPI load timeout - script may be blocked or network issue'));
        }, 10000);

        window.gapi.load('client:auth2', async () => {
          clearTimeout(timeout);
          try {
            // Check if gapi is properly loaded
            if (!window.gapi) {
              throw new Error('GAPI not loaded - window.gapi is undefined');
            }

            if (!window.gapi.client) {
              throw new Error('GAPI client not available - window.gapi.client is undefined');
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
            apiLogger.error('Failed to initialize GAPI client', { error: errorDetails });

            // Check for common issues and provide specific guidance
            if (errorDetails.message.includes('origin') ||
                errorDetails.message.includes('domain') ||
                errorDetails.message.includes('not allowed') ||
                error?.error === 'idpiframe_initialization_failed') {
              reject(new Error(`❌ Domain Authorization Required: The domain "${window.location.origin}" is not authorized in Google Cloud Console.

📋 To fix this:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit OAuth 2.0 Client ID: 47138776708-suu99tvg4v2l4248ololg59hvsevpo13.apps.googleusercontent.com
3. Add to "Authorized JavaScript origins": ${window.location.origin}
4. Save and wait 5-10 minutes for changes to propagate`));
            } else if (errorDetails.code === 'popup_blocked_by_browser') {
              reject(new Error('Popup blocked by browser. Please allow popups for this domain.'));
            } else if (!errorDetails.gapiAvailable) {
              reject(new Error('Google API script not loaded. Check network connectivity.'));
            } else if (!errorDetails.clientAvailable) {
              reject(new Error('GAPI client modules not loaded properly. Try refreshing the page.'));
            } else if (errorDetails.message === 'No message' || errorDetails.message === '') {
              reject(new Error(`⚠️  Google API initialization failed silently. This usually indicates domain authorization issues.

🔍 Current domain: ${window.location.origin}
💡 Most likely cause: Domain not authorized in Google Cloud Console OAuth settings.

Please add this domain to your Google Cloud Console OAuth 2.0 Client ID authorized origins.`));
            } else {
              reject(new Error(`GAPI client initialization failed: ${errorDetails.message || errorDetails.code}`));
            }
          }
        }, (error) => {
          clearTimeout(timeout);
          const errorDetails = {
            name: error?.name || 'Unknown',
            message: error?.message || 'Failed to load GAPI modules',
            code: error?.code || 'GAPI_LOAD_ERROR'
          };
          apiLogger.error('Failed to load GAPI modules', { error: errorDetails });
          reject(new Error(`Failed to load GAPI modules: ${errorDetails.message}`));
        });
      });

      return true;

    } catch (error) {
      this.initializationPromise = null;
      this.isInitialized = false;
      apiLogger.error('Failed to initialize Google Drive API', error);
      throw error;
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
   * Authenticate user with Google Drive
   */
  async authenticate() {
    try {
      await this.initialize();

      const authInstance = this.gapi.auth2.getAuthInstance();
      
      if (!authInstance) {
        throw new Error('Google Auth instance not available');
      }

      // Check if already signed in
      if (authInstance.isSignedIn.get()) {
        const currentUser = authInstance.currentUser.get();
        this.accessToken = currentUser.getAuthResponse().access_token;
        
        apiLogger.info('User already authenticated with Google Drive');
        return true;
      }

      // Sign in user
      apiLogger.info('Requesting Google Drive authentication');
      const user = await authInstance.signIn({
        prompt: 'select_account'
      });
      
      this.accessToken = user.getAuthResponse().access_token;
      
      apiLogger.info('Google Drive authentication successful', {
        hasAccessToken: !!this.accessToken
      });
      
      return true;

    } catch (error) {
      const errorDetails = {
        name: error?.name || 'Unknown',
        message: error?.message || 'No message',
        code: error?.error || error?.code || 'unknown',
        details: error?.details || 'No details',
        stack: error?.stack || 'No stack trace',
        stringified: error?.toString() || 'Cannot stringify error'
      };

      apiLogger.error('Google Drive authentication failed', {
        error: errorDetails
      });

      // Handle specific error cases
      if (errorDetails.code === 'popup_blocked_by_browser') {
        throw new Error('Popup diblokir browser. Pastikan popup diizinkan untuk website ini.');
      } else if (errorDetails.code === 'access_denied') {
        throw new Error('Akses ditolak. Silakan berikan izin untuk mengakses Google Drive.');
      } else if (errorDetails.code === 'popup_closed_by_user') {
        throw new Error('Popup ditutup oleh user. Silakan coba lagi dan selesaikan proses login.');
      } else if (errorDetails.message && errorDetails.message !== 'No message') {
        throw new Error(`Gagal melakukan autentikasi Google Drive: ${errorDetails.message}`);
      } else {
        throw new Error(`Gagal melakukan autentikasi Google Drive: ${errorDetails.code || 'Unknown error'}`);
      }
    }
  }

  /**
   * Get authentication status
   */
  async isAuthenticated() {
    try {
      if (!this.isInitialized || !this.gapi) {
        return false;
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        return false;
      }

      const isSignedIn = authInstance.isSignedIn.get();
      
      if (isSignedIn) {
        // Update access token
        const currentUser = authInstance.currentUser.get();
        this.accessToken = currentUser.getAuthResponse().access_token;
      }

      return isSignedIn;
    } catch (error) {
      apiLogger.error('Failed to check authentication status', error);
      return false;
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
    apiLogger.info('Google Drive service reset');
  }
}

// Create and export service instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
