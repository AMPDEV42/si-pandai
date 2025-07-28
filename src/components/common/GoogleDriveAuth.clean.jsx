/**
 * Google Drive Authentication Component
 * Handles automatic Google Drive authentication in the background
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Cloud } from 'lucide-react';
import { googleDriveService } from '../../services/googleDriveService';
import { apiLogger } from '../../lib/logger';
import { config } from '../../config/environment';

const GoogleDriveAuth = ({ onAuthChange = () => {}, className = '' }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [configDetails, setConfigDetails] = useState({ apiKey: false, clientId: false });

  useEffect(() => {
    const initialize = async () => {
      await checkConfiguration();
      await checkAuthentication();
    };
    
    initialize();
  }, []);

  const checkConfiguration = () => {
    const configured = config.googleDrive.enabled;
    const details = {
      apiKey: !!config.googleDrive.apiKey,
      clientId: !!config.googleDrive.clientId
    };
    
    setIsConfigured(configured);
    setConfigDetails(details);
    
    if (!configured) {
      if (!details.apiKey && !details.clientId) {
        setError('Google Drive belum dikonfigurasi. API Key dan Client ID tidak ditemukan.');
      } else if (!details.apiKey) {
        setError('Google Drive API Key tidak ditemukan dalam environment variables.');
      } else if (!details.clientId) {
        setError('Google Drive Client ID tidak ditemukan dalam environment variables.');
      }
    } else {
      setError(null);
    }

    apiLogger.info('Google Drive configuration check', {
      configured,
      hasApiKey: details.apiKey,
      hasClientId: details.clientId
    });
  };

  const checkAuthentication = async () => {
    try {
      setIsChecking(true);
      
      if (!isConfigured) {
        setIsAuthenticated(false);
        onAuthChange(false);
        return false;
      }

      // Try to authenticate silently
      try {
        await googleDriveService.authenticate(true); // Silent authentication
        const authenticated = await googleDriveService.isAuthenticated();
        setIsAuthenticated(authenticated);
        onAuthChange(authenticated);
        
        if (authenticated) {
          setError(null);
          return true;
        }
      } catch (authError) {
        // Silent auth failed, this is expected if user hasn't authenticated yet
        apiLogger.debug('Silent authentication failed', authError);
      }

      return false;
    } catch (error) {
      apiLogger.error('Failed to check Google Drive authentication', error);
      setIsAuthenticated(false);
      onAuthChange(false);
      
      if (error.message.includes('not initialized')) {
        setError('Google Drive service belum diinisialisasi. Coba refresh halaman.');
      } else if (error.message) {
        setError(`Error: ${error.message}`);
      }
      
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Only show UI if there's an error or if we're still checking
  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Menyiapkan koneksi Google Drive...</span>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Google Drive tidak dikonfigurasi</span>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Fitur Google Drive tidak tersedia karena konfigurasi tidak lengkap.</p>
          {!configDetails.apiKey && <p>• API Key tidak ditemukan</p>}
          {!configDetails.clientId && <p>• Client ID tidak ditemukan</p>}
        </div>
      </div>
    );
  }

  // If we have an error, show it
  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Gagal terhubung ke Google Drive</span>
        </div>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  // If authenticated, show success state (minimal UI)
  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-2 text-green-600 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>Google Drive terhubung</span>
      </div>
    );
  }

  // Default return - shouldn't normally reach here
  return (
    <div className="flex items-center space-x-2 text-gray-500 text-sm">
      <Cloud className="h-4 w-4" />
      <span>Menyiapkan Google Drive...</span>
    </div>
  );
};

export default GoogleDriveAuth;
