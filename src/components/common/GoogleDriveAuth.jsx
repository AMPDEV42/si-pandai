/**
 * Google Drive Authentication Component
 * Handles automatic Google Drive authentication in the background
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Cloud } from 'lucide-react';

// Import using relative paths
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { googleDriveService } from '../../services/googleDriveService';
import { apiLogger } from '../../lib/logger';
import { config } from '../../config/environment';
import DomainAuthError from './DomainAuthError';

const GoogleDriveAuth = ({ onAuthChange = () => {}, className = '' }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDomainError, setIsDomainError] = useState(false);
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

      // Check if Google Drive is available first
      if (!googleDriveService.isAvailable()) {
        setIsDomainError(true);
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

  // Handle domain authorization error
  if (error && (error.includes('Domain Authorization Required') || error.includes('not authorized in Google Cloud Console'))) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-300">Perlu Konfigurasi Google Cloud Console</h4>
            <p className="text-sm text-amber-200 mt-1">
              Domain {window.location.origin} belum diotorisasi di Google Cloud Console.
            </p>
            <div className="mt-3 text-xs bg-amber-900/30 p-3 rounded">
              <p className="font-medium mb-2">Cara memperbaiki:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">Google Cloud Console</a></li>
                <li>Edit OAuth 2.0 Client ID: {config.googleDrive.clientId || 'YOUR_CLIENT_ID'}</li>
                <li>Di bagian "Authorized JavaScript origins", tambahkan: <code className="bg-amber-900/50 px-1.5 py-0.5 rounded">{window.location.origin}</code></li>
                <li>Di bagian "Authorized redirect URIs", tambahkan: <code className="bg-amber-900/50 px-1.5 py-0.5 rounded">{window.location.origin}/auth/google/callback</code></li>
                <li>Simpan perubahan dan tunggu 5-10 menit</li>
              </ol>
              <button 
                onClick={handleRefresh}
                className="mt-3 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded flex items-center"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Saya sudah mengaturnya, coba lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show UI if there's an error or if we're still checking
  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Menyiapkan koneksi Google Drive...</span>
      </div>
    );
  }

  const handleAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      // Check if Google Drive is available before attempting authentication
      if (!googleDriveService.isAvailable()) {
        setIsDomainError(true);
        return;
      }

      const authResult = await googleDriveService.authenticate();
      
      if (!authResult) {
        throw new Error('Autentikasi dibatalkan atau gagal');
      }
      
      setIsAuthenticated(true);
      onAuthChange(true);
      setError(null);
      setIsDomainError(false);
      apiLogger.info('Google Drive authentication successful');
    } catch (error) {
      // Check if it's a domain authorization error for conditional logging
      const isDomainError = error.message.includes('DOMAIN_AUTH_ERROR') ||
                           error.message.includes('origin') ||
                           error.message.includes('domain') ||
                           error.message.includes('not allowed') ||
                           error.message.includes('Domain authorization') ||
                           error.message.includes('Google Drive unavailable: Domain authorization required');

      if (isDomainError) {
        apiLogger.debug('Google Drive authentication failed - domain authorization required', {
          domain: window.location.origin
        });
      } else {
        apiLogger.error('Google Drive authentication failed', error);
      }

      let errorMessage = 'Gagal melakukan autentikasi Google Drive.';
      let isDomain = false;

      // Handle specific error cases
      if (error.message.includes('popup')) {
        errorMessage = 'Popup diblokir browser. Pastikan popup diizinkan untuk website ini.';
      } else if (error.message.includes('access_denied')) {
        errorMessage = 'Akses ditolak. Silakan berikan izin untuk mengakses Google Drive.';
      } else if (error.message.includes('DOMAIN_AUTH_ERROR') ||
                error.message.includes('origin') ||
                error.message.includes('domain') ||
                error.message.includes('not allowed') ||
                error.message.includes('Domain authorization') ||
                error.message.includes('Google Drive unavailable: Domain authorization required') ||
                (error.error && error.error === 'idpiframe_initialization_failed')) {
        errorMessage = `Domain ${window.location.origin} tidak diotorisasi.\n\n` +
                     '1. Buka Google Cloud Console\n' +
                     '2. Buka menu "APIs & Services" > "Credentials"\n' +
                     '3. Edit OAuth 2.0 Client ID yang digunakan\n' +
                     `4. Tambahkan "${window.location.origin}" ke Authorized JavaScript origins\n` +
                     '5. Simpan perubahan dan tunggu 5-10 menit';
        isDomain = true;
      } else if (error.message.includes('quota')) {
        errorMessage = 'Quota API tercapai. Coba lagi dalam beberapa saat.';
      } else if (error.message.includes('not initialized')) {
        errorMessage = 'Google Drive service belum siap. Silakan refresh halaman dan coba lagi.';
      } else if (error.message.includes('gapi is not defined') || 
                error.message.includes('gapi.client is not defined')) {
        errorMessage = 'Google API gagal dimuat. Pastikan koneksi internet stabil dan coba lagi.';
      } else {
        errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui';
      }

      setError(errorMessage);
      setIsDomainError(isDomain);
      setIsAuthenticated(false);
      onAuthChange(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRefresh = () => {
    setError(null);
    setIsDomainError(false);
    checkConfiguration();
    checkAuthentication();
  };

  const handleReset = () => {
    googleDriveService.reset();
    setIsAuthenticated(false);
    setError(null);
    setIsDomainError(false);
    onAuthChange(false);
    checkAuthentication();
  };

  if (!isConfigured) {
    return (
      <Card className={`border-amber-500/20 bg-amber-500/5 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Error Header */}
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-300">Google Drive Belum Dikonfigurasi</h4>
                <p className="text-sm text-amber-200/80 mt-1">
                  Environment variables untuk Google Drive tidak lengkap
                </p>
              </div>
            </div>

            {/* Configuration Details */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-200 mb-2">Status konfigurasi:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300">VITE_GOOGLE_DRIVE_API_KEY</span>
                  <span className={`text-xs px-2 py-1 rounded ${configDetails.apiKey ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {configDetails.apiKey ? 'Ada' : 'Tidak Ada'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300">VITE_GOOGLE_DRIVE_CLIENT_ID</span>
                  <span className={`text-xs px-2 py-1 rounded ${configDetails.clientId ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {configDetails.clientId ? 'Ada' : 'Tidak Ada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="text-xs text-amber-200/70">
              <p>Untuk mengaktifkan Google Drive:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1 ml-2">
                <li>Buka Google Cloud Console</li>
                <li>Aktifkan Google Drive API</li>
                <li>Buat API Key dan OAuth 2.0 Client ID</li>
                <li>Tambahkan ke environment variables</li>
              </ol>
            </div>

            <Button
              onClick={handleRefresh}
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Periksa Ulang Konfigurasi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show domain authorization error component if detected
  if (isDomainError) {
    return (
      <div className={className}>
        <DomainAuthError
          currentDomain={window.location.origin}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <Card className={`border-white/20 bg-white/5 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                isAuthenticated ? 'bg-green-500/20' : 
                isChecking ? 'bg-blue-500/20' : 'bg-amber-500/20'
              }`}>
                {isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : isChecking ? (
                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-white">
                  {isAuthenticated ? 'Terkoneksi ke Google Drive' : 'Google Drive'}
                </h4>
                <p className="text-xs text-gray-400">
                  {isAuthenticated ? 'Siap digunakan' : 
                   isChecking ? 'Memeriksa koneksi...' : 'Belum terhubung'}
                </p>
              </div>
            </div>
            {isAuthenticated ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Aktif
              </Badge>
            ) : null}
          </div>

          {/* Status Message */}
          {error && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!isAuthenticated && (
              <Button
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Hubungkan ke Google Drive'
                )}
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Segarkan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveAuth;
