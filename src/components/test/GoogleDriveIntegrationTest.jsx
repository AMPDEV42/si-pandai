/**
 * Google Drive Integration Test Component
 * Simple test to verify Google Drive functionality
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, RefreshCw, Upload, Folder } from 'lucide-react';
import { googleDriveService } from '../../services/googleDriveService';
import { useToast } from '../ui/use-toast';
import { apiLogger } from '../../lib/logger';

const GoogleDriveIntegrationTest = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const checkConfiguration = () => {
    const configured = googleDriveService.isConfigured();
    setIsConfigured(configured);
    apiLogger.info('Google Drive configuration check', { configured });
    return configured;
  };

  const initializeService = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      if (!checkConfiguration()) {
        throw new Error('Google Drive tidak dikonfigurasi dengan benar');
      }

      const initialized = await googleDriveService.initialize();
      if (!initialized) {
        throw new Error('Gagal menginisialisasi Google Drive API');
      }

      toast({
        title: 'Inisialisasi berhasil',
        description: 'Google Drive API berhasil diinisialisasi',
      });

      return true;
    } catch (error) {
      apiLogger.error('Google Drive initialization failed', error);
      setError(error.message);
      toast({
        title: 'Inisialisasi gagal',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const authenticateUser = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const authResult = await googleDriveService.authenticate(false); // Not silent
      if (!authResult) {
        throw new Error('Autentikasi dibatalkan');
      }

      const authenticated = await googleDriveService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        toast({
          title: 'Autentikasi berhasil',
          description: 'Berhasil terhubung ke Google Drive',
        });
      }

      return authenticated;
    } catch (error) {
      apiLogger.error('Google Drive authentication failed', error);
      setError(error.message);
      toast({
        title: 'Autentikasi gagal',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const testGoogleDriveOperations = async () => {
    try {
      setIsTesting(true);
      setError(null);
      setTestResults(null);

      const results = {
        folderCreation: false,
        fileUpload: false,
        error: null
      };

      // Test folder creation
      try {
        const folderResult = await googleDriveService.createSubmissionFolderStructure(
          { category: 'Test' },
          'Test User'
        );
        results.folderCreation = !!folderResult.employeeFolderId;
        results.folderId = folderResult.employeeFolderId;
      } catch (error) {
        results.error = `Folder creation failed: ${error.message}`;
      }

      // Test file upload (create a small test file)
      if (results.folderCreation) {
        try {
          const testFile = new File(['Test content'], 'test-file.txt', { type: 'text/plain' });
          const uploadResult = await googleDriveService.uploadFile(
            testFile,
            results.folderId,
            'test-upload.txt'
          );
          results.fileUpload = !!uploadResult.id;
          results.fileId = uploadResult.id;
        } catch (error) {
          results.error = `File upload failed: ${error.message}`;
        }
      }

      setTestResults(results);

      if (results.folderCreation && results.fileUpload) {
        toast({
          title: 'Test berhasil',
          description: 'Semua operasi Google Drive berfungsi dengan baik',
        });
      } else {
        toast({
          title: 'Test sebagian berhasil',
          description: results.error || 'Beberapa operasi gagal',
          variant: 'destructive'
        });
      }

    } catch (error) {
      apiLogger.error('Google Drive test failed', error);
      setError(error.message);
      toast({
        title: 'Test gagal',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const resetTest = () => {
    googleDriveService.reset();
    setIsAuthenticated(false);
    setTestResults(null);
    setError(null);
    checkConfiguration();
  };

  React.useEffect(() => {
    checkConfiguration();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-white/20 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Google Drive Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Konfigurasi:</span>
            <Badge className={`${isConfigured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConfigured ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Dikonfigurasi
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Tidak Dikonfigurasi
                </>
              )}
            </Badge>
          </div>

          {/* Authentication Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Autentikasi:</span>
            <Badge className={`${isAuthenticated ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {isAuthenticated ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Terautentikasi
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Belum Autentikasi
                </>
              )}
            </Badge>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Hasil Test:</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Pembuatan Folder:</span>
                  <Badge className={`${testResults.folderCreation ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {testResults.folderCreation ? 'Berhasil' : 'Gagal'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Upload File:</span>
                  <Badge className={`${testResults.fileUpload ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {testResults.fileUpload ? 'Berhasil' : 'Gagal'}
                  </Badge>
                </div>
                {testResults.error && (
                  <p className="text-xs text-red-300 mt-2">{testResults.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={initializeService}
              disabled={isInitializing || !isConfigured}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Inisialisasi...
                </>
              ) : (
                'Inisialisasi'
              )}
            </Button>

            <Button
              onClick={authenticateUser}
              disabled={isAuthenticating || !isConfigured}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Autentikasi...
                </>
              ) : (
                'Autentikasi'
              )}
            </Button>

            <Button
              onClick={testGoogleDriveOperations}
              disabled={isTesting || !isAuthenticated}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Test Upload
                </>
              )}
            </Button>

            <Button
              onClick={resetTest}
              size="sm"
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              Reset
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Langkah-langkah:</p>
            <ol className="list-decimal list-inside space-y-0.5 ml-2">
              <li>Pastikan environment variables dikonfigurasi</li>
              <li>Klik "Inisialisasi" untuk memuat Google Drive API</li>
              <li>Klik "Autentikasi" untuk login ke Google</li>
              <li>Klik "Test Upload" untuk menguji fungsi upload</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleDriveIntegrationTest;
