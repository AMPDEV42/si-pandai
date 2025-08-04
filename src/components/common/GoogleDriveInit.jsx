/**
 * Google Drive Initialization Component
 * Handles Google Drive initialization with graceful fallback for CSP and iframe issues
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { googleDriveService } from '../../services/googleDriveService';
import { apiLogger } from '../../lib/logger';

const GoogleDriveInit = ({ onStatusChange = () => {} }) => {
  const [status, setStatus] = useState('checking'); // checking, failed, csp-error, domain-error, success
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    initializeGoogleDrive();
  }, []);

  const initializeGoogleDrive = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      setStatus('checking');

      // Check if Google Drive is configured
      if (!googleDriveService.isConfigured()) {
        setStatus('failed');
        setError('Google Drive tidak dikonfigurasi. Periksa environment variables.');
        onStatusChange(false, 'not-configured');
        return;
      }

      // Try to initialize Google Drive
      apiLogger.info('Google Drive initialization disabled - using polling instead');
      const initResult = await googleDriveService.initialize();
      
      if (initResult) {
        setStatus('success');
        onStatusChange(true, 'ready');
        apiLogger.info('Google Drive initialized successfully');
      } else {
        throw new Error('Initialization returned false');
      }

    } catch (error) {
      handleInitializationError(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleInitializationError = (error) => {
    const errorMessage = error.message || 'Unknown error';

    // Detect CSP-related errors
    if (errorMessage.includes('CSP') ||
        errorMessage.includes('Content Security Policy') ||
        errorMessage.includes('script-src') ||
        errorMessage.includes('frame-src') ||
        errorMessage.includes('CSP_VIOLATION')) {
      setStatus('csp-error');
      setError('Content Security Policy memblokir Google Drive. Konfigurasi CSP diperlukan.');
      onStatusChange(false, 'csp-blocked');
      apiLogger.debug('Google Drive blocked by CSP', { error: errorMessage });
      return;
    }

    // Detect domain authorization errors
    if (errorMessage.includes('Domain Authorization Required') ||
        errorMessage.includes('not authorized') ||
        errorMessage.includes('origin') ||
        errorMessage.includes('domain') ||
        error?.error === 'idpiframe_initialization_failed') {
      setStatus('domain-error');
      setError('Domain tidak diotorisasi di Google Cloud Console.');
      onStatusChange(false, 'domain-not-authorized');
      apiLogger.debug('Google Drive domain not authorized', { domain: window.location.origin });
      return;
    }

    // Other errors
    setStatus('failed');
    setError(errorMessage);
    onStatusChange(false, 'error');
    apiLogger.debug('Google Drive initialization failed', error);
  };

  const handleRetry = () => {
    initializeGoogleDrive();
  };

  const handleFallbackMode = () => {
    // Enable fallback mode - disable Google Drive and continue with local storage
    apiLogger.info('Google Drive fallback mode enabled - files will be stored locally');
    onStatusChange(false, 'fallback-mode');
    setStatus('fallback');
  };

  // Don't render anything if initialization is successful
  if (status === 'success') {
    return null;
  }

  // CSP Error Component
  if (status === 'csp-error') {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5 mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-300">Content Security Policy Issue</h4>
                <p className="text-sm text-amber-200/80 mt-1">
                  Browser security policies are blocking Google Drive integration.
                </p>
              </div>
            </div>

            {showDetails && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-200 mb-2">Technical Details:</p>
                <div className="text-xs text-amber-300 space-y-1">
                  <p>• CSP script-src directive blocking Google API scripts</p>
                  <p>• frame-src directive may be blocking OAuth iframes</p>
                  <p>• connect-src may be blocking API connections</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleFallbackMode}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Lanjutkan Tanpa Google Drive
              </Button>
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
                size="sm"
              >
                {showDetails ? 'Sembunyikan' : 'Detail'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Domain Error Component
  if (status === 'domain-error') {
    return (
      <Card className="border-red-500/20 bg-red-500/5 mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-300">Domain Authorization Required</h4>
                <p className="text-sm text-red-200/80 mt-1">
                  Domain ini belum diotorisasi di Google Cloud Console.
                </p>
              </div>
            </div>

            {showDetails && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-200 mb-2">Langkah perbaikan:</p>
                <ol className="text-xs text-red-300 space-y-1 list-decimal list-inside">
                  <li>Buka Google Cloud Console</li>
                  <li>Edit OAuth 2.0 Client ID</li>
                  <li>Tambahkan domain ini ke Authorized JavaScript origins</li>
                  <li>Simpan dan tunggu 5-10 menit</li>
                </ol>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleFallbackMode}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Lanjutkan Tanpa Google Drive
              </Button>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                disabled={isInitializing}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Coba Lagi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback Mode Component
  if (status === 'fallback') {
    return (
      <Card className="border-blue-500/20 bg-blue-500/5 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-300">Mode Lokal Aktif</h4>
              <p className="text-sm text-blue-200/80 mt-1">
                File akan disimpan sementara di browser. Google Drive tidak tersedia.
              </p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Fallback
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // General Error Component
  if (status === 'failed') {
    return (
      <Card className="border-red-500/20 bg-red-500/5 mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-300">Google Drive Error</h4>
                <p className="text-sm text-red-200/80 mt-1">
                  {error || 'Gagal menginisialisasi Google Drive'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                disabled={isInitializing}
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Mencoba...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Coba Lagi
                  </>
                )}
              </Button>
              <Button
                onClick={handleFallbackMode}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Lanjutkan Tanpa Google Drive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Checking/Loading Component
  return (
    <Card className="border-blue-500/20 bg-blue-500/5 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-300">Menyiapkan Google Drive</h4>
            <p className="text-sm text-blue-200/80 mt-1">
              Menginisialisasi koneksi ke Google Drive...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveInit;
