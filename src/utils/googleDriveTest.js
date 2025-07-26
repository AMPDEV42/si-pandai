/**
 * Simple Google Drive Test Utilities
 * Provides quick testing functions for Google Drive integration
 */

import { googleDriveService } from '../services/googleDriveService';
import { apiLogger } from '../lib/logger';

/**
 * Test Google Drive configuration and authentication
 */
export const testGoogleDriveConnection = async () => {
  const results = {
    configured: false,
    initialized: false,
    authenticated: false,
    error: null
  };

  try {
    // Test configuration
    results.configured = googleDriveService.isConfigured();
    if (!results.configured) {
      results.error = 'Google Drive not configured - missing environment variables';
      return results;
    }

    // Test initialization
    await googleDriveService.initialize();
    results.initialized = true;

    // Test authentication
    results.authenticated = await googleDriveService.isAuthenticated();
    if (!results.authenticated) {
      results.error = 'User not authenticated with Google Drive';
      return results;
    }

    apiLogger.info('Google Drive connection test passed', results);
    return results;

  } catch (error) {
    results.error = error.message;
    apiLogger.error('Google Drive connection test failed', error);
    return results;
  }
};

/**
 * Test file upload to Google Drive
 */
export const testGoogleDriveUpload = async () => {
  try {
    // First test connection
    const connectionTest = await testGoogleDriveConnection();
    if (!connectionTest.authenticated) {
      throw new Error(connectionTest.error || 'Connection test failed');
    }

    // Create test file
    const testContent = `SIPANDAI Google Drive Upload Test
Timestamp: ${new Date().toISOString()}
Domain: ${window.location.origin}
User Agent: ${navigator.userAgent}

This test file was generated to verify that file upload to Google Drive is working correctly.
If you can see this file in your Google Drive, the integration is successful!`;

    const testFile = new File([testContent], 'sipandai-upload-test.txt', {
      type: 'text/plain'
    });

    // Create folder structure
    const testSubmissionType = { category: 'SIPANDAI Test' };
    const testEmployeeName = 'Upload Test User';

    const folderStructure = await googleDriveService.createSubmissionFolderStructure(
      testSubmissionType,
      testEmployeeName
    );

    // Upload test file
    const uploadResult = await googleDriveService.uploadFile(
      testFile,
      folderStructure.employeeFolderId,
      `SIPANDAI-Upload-Test-${Date.now()}.txt`
    );

    apiLogger.info('Google Drive upload test successful', {
      fileId: uploadResult.id,
      fileName: uploadResult.name,
      folderId: folderStructure.employeeFolderId
    });

    return {
      success: true,
      fileId: uploadResult.id,
      fileName: uploadResult.name,
      viewLink: uploadResult.webViewLink,
      folderStructure
    };

  } catch (error) {
    apiLogger.error('Google Drive upload test failed', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get Google Drive status for UI display
 */
export const getGoogleDriveStatus = async () => {
  try {
    const configured = googleDriveService.isConfigured();
    if (!configured) {
      return {
        status: 'not_configured',
        message: 'Google Drive not configured',
        canUpload: false
      };
    }

    const authenticated = await googleDriveService.isAuthenticated();
    if (!authenticated) {
      return {
        status: 'not_authenticated',
        message: 'Please authenticate with Google Drive',
        canUpload: false
      };
    }

    return {
      status: 'ready',
      message: 'Google Drive ready for uploads',
      canUpload: true
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      canUpload: false
    };
  }
};

/**
 * Quick authentication check
 */
export const quickAuthCheck = async () => {
  try {
    if (!googleDriveService.isConfigured()) {
      return false;
    }

    return await googleDriveService.isAuthenticated();
  } catch (error) {
    apiLogger.error('Quick auth check failed', error);
    return false;
  }
};
