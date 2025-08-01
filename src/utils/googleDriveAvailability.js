/**
 * Google Drive Availability Checker
 * Provides utilities to check if Google Drive is available and handle graceful degradation
 */

import { googleDriveService } from '../services/googleDriveService';
import { config } from '../config/environment';
import { apiLogger } from '../lib/logger';

/**
 * Check if Google Drive integration is available
 * @returns {Object} Availability status and reason
 */
export const checkGoogleDriveAvailability = async () => {
  try {
    // Check if Google Drive is enabled in config
    if (!config.googleDrive.enabled) {
      return {
        available: false,
        reason: 'Google Drive integration is disabled in configuration',
        code: 'DISABLED'
      };
    }

    // Check if properly configured
    if (!config.googleDrive.apiKey || !config.googleDrive.clientId) {
      return {
        available: false,
        reason: 'Google Drive API credentials not configured',
        code: 'NOT_CONFIGURED'
      };
    }

    // Check if domain is blocked
    if (googleDriveService.isDomainBlocked) {
      return {
        available: false,
        reason: 'Domain not authorized in Google Cloud Console',
        code: 'DOMAIN_BLOCKED',
        details: googleDriveService.domainAuthError
      };
    }

    // Try to check if service is configured
    const isConfigured = googleDriveService.isConfigured();
    if (!isConfigured) {
      return {
        available: false,
        reason: 'Google Drive service configuration invalid',
        code: 'INVALID_CONFIG'
      };
    }

    return {
      available: true,
      reason: 'Google Drive integration is available',
      code: 'AVAILABLE'
    };

  } catch (error) {
    apiLogger.error('Error checking Google Drive availability', error);
    return {
      available: false,
      reason: error.message || 'Unknown error checking Google Drive availability',
      code: 'ERROR',
      error: error.message
    };
  }
};

/**
 * Get user-friendly message for Google Drive unavailability
 * @param {string} code - Availability code
 * @returns {string} User-friendly message
 */
export const getUnavailabilityMessage = (code) => {
  switch (code) {
    case 'DISABLED':
      return 'Google Drive integration is currently disabled.';
    case 'NOT_CONFIGURED':
      return 'Google Drive integration is not properly configured.';
    case 'DOMAIN_BLOCKED':
      return 'This domain is not authorized for Google Drive access. Contact your administrator.';
    case 'INVALID_CONFIG':
      return 'Google Drive configuration is invalid.';
    case 'ERROR':
      return 'Unable to connect to Google Drive. Please try again later.';
    default:
      return 'Google Drive integration is currently unavailable.';
  }
};

/**
 * Check if Google Drive features should be shown in UI
 * @returns {boolean} Whether to show Google Drive features
 */
export const shouldShowGoogleDriveFeatures = async () => {
  const availability = await checkGoogleDriveAvailability();
  return availability.available;
};

/**
 * Gracefully handle Google Drive operations with fallback
 * @param {Function} operation - Google Drive operation to attempt
 * @param {Function} fallback - Fallback function if Google Drive unavailable
 * @returns {Promise} Result of operation or fallback
 */
export const withGoogleDriveFallback = async (operation, fallback = null) => {
  try {
    const availability = await checkGoogleDriveAvailability();
    
    if (!availability.available) {
      apiLogger.warn('Google Drive unavailable, using fallback', {
        reason: availability.reason,
        code: availability.code
      });
      
      if (fallback) {
        return await fallback();
      } else {
        throw new Error(getUnavailabilityMessage(availability.code));
      }
    }

    return await operation();
  } catch (error) {
    apiLogger.error('Google Drive operation failed', error);
    
    if (fallback) {
      apiLogger.info('Using fallback due to Google Drive error');
      return await fallback();
    } else {
      throw error;
    }
  }
};

/**
 * Initialize Google Drive with error suppression
 * @returns {Promise<boolean>} Whether initialization succeeded
 */
export const safeInitializeGoogleDrive = async () => {
  try {
    const availability = await checkGoogleDriveAvailability();
    
    if (!availability.available) {
      apiLogger.debug('Skipping Google Drive initialization', {
        reason: availability.reason,
        code: availability.code
      });
      return false;
    }

    const result = await googleDriveService.initialize();
    return !!result;
  } catch (error) {
    // Don't log domain auth errors repeatedly
    if (!error.message?.includes('Domain Authorization Required')) {
      apiLogger.warn('Google Drive initialization failed gracefully', {
        error: error.message
      });
    }
    return false;
  }
};
