/**
 * Google Drive Service
 * Handles file uploads and folder management in Google Drive
 */

import { apiLogger } from '../lib/logger';

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.apiKey = null;
    this.clientId = null;
    this.scope = 'https://www.googleapis.com/auth/drive.file';
    this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    this.gapi = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Google Drive API
   */
  async initialize() {
    try {
      // Get credentials from environment
      this.apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
      this.clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;

      if (!this.apiKey || !this.clientId) {
        throw new Error('Google Drive credentials not found in environment variables');
      }

      // Load Google API
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              clientId: this.clientId,
              discoveryDocs: [this.discoveryDoc],
              scope: this.scope
            });

            this.gapi = window.gapi;
            this.isInitialized = true;
            
            apiLogger.info('Google Drive API initialized successfully');
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

    } catch (error) {
      apiLogger.error('Failed to initialize Google Drive API', error);
      throw error;
    }
  }

  /**
   * Load Google API script
   */
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Authenticate user with Google Drive
   */
  async authenticate() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      
      if (authInstance.isSignedIn.get()) {
        this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        return true;
      }

      const user = await authInstance.signIn();
      this.accessToken = user.getAuthResponse().access_token;
      
      apiLogger.info('Google Drive authentication successful');
      return true;

    } catch (error) {
      apiLogger.error('Google Drive authentication failed', error);
      throw new Error('Gagal melakukan autentikasi Google Drive');
    }
  }

  /**
   * Find or create folder by name
   */
  async findOrCreateFolder(folderName, parentFolderId = null) {
    try {
      // Search for existing folder
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await this.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      const folders = response.result.files;

      if (folders && folders.length > 0) {
        apiLogger.debug('Found existing folder', { folderName, folderId: folders[0].id });
        return folders[0].id;
      }

      // Create new folder if not found
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentFolderId) {
        folderMetadata.parents = [parentFolderId];
      }

      const createResponse = await this.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      const folderId = createResponse.result.id;
      apiLogger.info('Created new folder', { folderName, folderId });
      
      return folderId;

    } catch (error) {
      apiLogger.error('Failed to find or create folder', { folderName, error });
      throw error;
    }
  }

  /**
   * Create folder structure for submission
   */
  async createSubmissionFolderStructure(submissionType, employeeName) {
    try {
      // Create main SIPANDAI folder
      const mainFolderId = await this.findOrCreateFolder('SIPANDAI');
      
      // Create category folder (e.g., "Pemberhentian", "Pengangkatan")
      const categoryFolderId = await this.findOrCreateFolder(
        submissionType.category, 
        mainFolderId
      );
      
      // Create employee folder
      const employeeFolderId = await this.findOrCreateFolder(
        employeeName, 
        categoryFolderId
      );

      apiLogger.info('Submission folder structure created', {
        submissionCategory: submissionType.category,
        employeeName,
        employeeFolderId
      });

      return {
        mainFolderId,
        categoryFolderId,
        employeeFolderId
      };

    } catch (error) {
      apiLogger.error('Failed to create submission folder structure', error);
      throw error;
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(file, folderId, fileName = null) {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const metadata = {
        name: fileName || file.name,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      apiLogger.info('File uploaded to Google Drive', {
        fileName: result.name,
        fileId: result.id,
        folderId
      });

      return {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

    } catch (error) {
      apiLogger.error('Failed to upload file to Google Drive', error);
      throw error;
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId) {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      await this.gapi.client.drive.files.delete({
        fileId: fileId
      });

      apiLogger.info('File deleted from Google Drive', { fileId });

    } catch (error) {
      apiLogger.error('Failed to delete file from Google Drive', error);
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  getFileDownloadUrl(fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Check if Google Drive is properly configured
   */
  isConfigured() {
    return !!(import.meta.env.VITE_GOOGLE_DRIVE_API_KEY && import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID);
  }

  /**
   * Get authentication status
   */
  async isAuthenticated() {
    try {
      if (!this.isInitialized) {
        return false;
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    } catch (error) {
      return false;
    }
  }
}

// Create and export service instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
