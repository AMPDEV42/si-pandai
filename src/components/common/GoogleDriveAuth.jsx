/**
 * Google Drive Authentication Component
 * Handles Google Drive authentication and status display with improved validation
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudOff, CheckCircle, AlertCircle, LogIn, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { googleDriveService } from '../../services/googleDriveService';
import { apiLogger } from '../../lib/logger';
import { config } from '../../config/environment';
import DomainAuthError from './DomainAuthError';

const GoogleDriveAuth = ({ onAuthChange = () => {}, className = '' }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [isDomainError, setIsDomainError] = useState(false);
  const [configDetails, setConfigDetails] = useState({ apiKey: false, clientId: false });

  useEffect(() => {
    checkConfiguration();
    checkAuthentication();
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
        return;
      }

      const authenticated = await googleDriveService.isAuthenticated();
      setIsAuthenticated(authenticated);
      onAuthChange(authenticated);

      if (authenticated) {
        setError(null);
      }

    } catch (error) {
      apiLogger.error('Failed to check Google Drive authentication', error);
      setIsAuthenticated(false);
      onAuthChange(false);
      
      if (error.message.includes('not initialized')) {
        setError('Google Drive service belum diinisialisasi. Coba refresh halaman.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      apiLogger.info('Starting Google Drive authentication');
      await googleDriveService.authenticate();
      
      setIsAuthenticated(true);
      onAuthChange(true);

      apiLogger.info('Google Drive authentication successful');

    } catch (error) {
      apiLogger.error('Google Drive authentication failed', error);

      let errorMessage = 'Gagal melakukan autentikasi Google Drive.';
      let isDomain = false;

      // Handle specific error cases
      if (error.message.includes('popup')) {
        errorMessage = 'Popup diblokir browser. Pastikan popup diizinkan untuk website ini.';
      } else if (error.message.includes('access_denied')) {
        errorMessage = 'Akses ditolak. Silakan berikan izin untuk mengakses Google Drive.';
      } else if (error.message.includes('origin') || error.message.includes('domain') || error.message.includes('Domain authorization')) {
        errorMessage = 'Domain tidak diotorisasi dalam Google Cloud Console.';
        isDomain = true;
      } else if (error.message.includes('quota')) {
        errorMessage = 'Quota API tercapai. Coba lagi dalam beberapa saat.';
      } else {
        errorMessage = error.message;
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
                  <Badge className={`text-xs ${configDetails.apiKey ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {configDetails.apiKey ? 'Ada' : 'Tidak Ada'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300">VITE_GOOGLE_DRIVE_CLIENT_ID</span>
                  <Badge className={`text-xs ${configDetails.clientId ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {configDetails.clientId ? 'Ada' : 'Tidak Ada'}
                  </Badge>
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
                isChecking ? 'bg-blue-500/20' :
                'bg-gray-500/20'
              }`}>
                {isChecking ? (
                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                ) : isAuthenticated ? (
                  <Cloud className="w-5 h-5 text-green-400" />
                ) : (
                  <CloudOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-white">Google Drive</h4>
                <p className="text-sm text-gray-400">
                  Integrasi untuk penyimpanan dokumen
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                className={`text-xs ${
                  isAuthenticated 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : isChecking
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {isChecking ? (
                  'Memeriksa...'
                ) : isAuthenticated ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Terhubung
                  </>
                ) : (
                  'Belum Terhubung'
                )}
              </Badge>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="p-1 h-6 w-6 text-gray-400 hover:text-white"
                title="Refresh status"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Status Description */}
          <div className="text-sm text-gray-300">
            {isAuthenticated ? (
              <p>✓ Dokumen akan disimpan otomatis ke Google Drive dengan struktur folder yang terorganisir</p>
            ) : (
              <p>Dokumen akan disimpan sementara. Hubungkan ke Google Drive untuk penyimpanan yang lebih aman.</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-400">{error}</p>
                  {error.includes('popup') && (
                    <p className="text-xs text-red-300 mt-1">
                      Tip: Aktifkan popup di browser settings atau coba gunakan browser lain.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Authentication Actions */}
          <div className="flex gap-2">
            {!isAuthenticated ? (
              <Button
                onClick={handleAuthenticate}
                disabled={isAuthenticating || isChecking}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Hubungkan ke Google Drive
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="border-gray-500/30 text-gray-300 hover:bg-gray-500/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Reset Koneksi
              </Button>
            )}
          </div>

          {/* Info for authenticated state */}
          {isAuthenticated && (
            <div className="text-xs text-gray-500 bg-white/5 p-2 rounded border border-white/10">
              <strong>Struktur Folder:</strong> SIPANDAI → [Kategori Pengajuan] → [Nama Pegawai] → [Dokumen]
            </div>
          )}

          {/* Configuration Info */}
          {isConfigured && (
            <div className="text-xs text-gray-600 border-t border-white/10 pt-2">
              <div className="flex items-center justify-between">
                <span>Konfigurasi Google Drive</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  Aktif
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveAuth;
