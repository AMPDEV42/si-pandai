/**
 * Google Drive Test Runner Component
 * Tests Google Drive integration functionality
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Folder,
  RefreshCw,
  Play
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import GoogleDriveAuth from '../common/GoogleDriveAuth';
import { googleDriveService } from '../../services/googleDriveService';
import { apiLogger } from '../../lib/logger';

const GoogleDriveTestRunner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const { toast } = useToast();

  const updateTestResult = (testName, result) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: result
    }));
  };

  const testConfiguration = async () => {
    setCurrentTest('Checking configuration...');
    
    try {
      const isConfigured = googleDriveService.isConfigured();
      
      if (isConfigured) {
        updateTestResult('configuration', { 
          success: true, 
          message: 'Configuration OK' 
        });
        return true;
      } else {
        updateTestResult('configuration', { 
          success: false, 
          message: 'Missing environment variables' 
        });
        return false;
      }
    } catch (error) {
      updateTestResult('configuration', { 
        success: false, 
        message: error.message 
      });
      return false;
    }
  };

  const testInitialization = async () => {
    setCurrentTest('Initializing Google Drive API...');
    
    try {
      await googleDriveService.initialize();
      updateTestResult('initialization', { 
        success: true, 
        message: 'API Initialized' 
      });
      return true;
    } catch (error) {
      updateTestResult('initialization', { 
        success: false, 
        message: error.message 
      });
      return false;
    }
  };

  const testAuthentication = async () => {
    setCurrentTest('Checking authentication...');
    
    try {
      const authStatus = await googleDriveService.isAuthenticated();
      
      if (authStatus) {
        updateTestResult('authentication', { 
          success: true, 
          message: 'User authenticated' 
        });
        return true;
      } else {
        updateTestResult('authentication', { 
          success: false, 
          message: 'Authentication required' 
        });
        return false;
      }
    } catch (error) {
      updateTestResult('authentication', { 
        success: false, 
        message: error.message 
      });
      return false;
    }
  };

  const testFolderCreation = async () => {
    setCurrentTest('Testing folder creation...');
    
    try {
      const testSubmissionType = { category: 'Test Upload Category' };
      const testEmployeeName = 'Test Employee Upload';

      const folderStructure = await googleDriveService.createSubmissionFolderStructure(
        testSubmissionType,
        testEmployeeName
      );

      if (folderStructure.employeeFolderId) {
        updateTestResult('folderCreation', { 
          success: true, 
          message: 'Folder structure created',
          data: folderStructure
        });
        return folderStructure;
      } else {
        throw new Error('Failed to create folder structure');
      }
    } catch (error) {
      updateTestResult('folderCreation', { 
        success: false, 
        message: error.message 
      });
      return null;
    }
  };

  const testFileUpload = async (folderStructure) => {
    setCurrentTest('Testing file upload...');
    
    try {
      // Create a test file
      const testContent = `SIPANDAI Google Drive Test File
Generated at: ${new Date().toISOString()}
Domain: ${window.location.origin}

This is a test file to verify Google Drive integration is working correctly.
If you can see this file in your Google Drive, the integration is successful!`;
      
      const testFile = new File([testContent], 'sipandai-test.txt', { 
        type: 'text/plain' 
      });

      const uploadResult = await googleDriveService.uploadFile(
        testFile,
        folderStructure.employeeFolderId,
        'SIPANDAI-Test-Upload.txt'
      );

      if (uploadResult.id) {
        updateTestResult('fileUpload', { 
          success: true, 
          message: 'File uploaded successfully',
          data: {
            fileId: uploadResult.id,
            fileName: uploadResult.name,
            viewLink: uploadResult.webViewLink
          }
        });

        // Show success toast with file link
        toast({
          title: 'Upload berhasil!',
          description: `File test berhasil diupload ke Google Drive`,
          action: uploadResult.webViewLink ? (
            <Button 
              size="sm" 
              onClick={() => window.open(uploadResult.webViewLink, '_blank')}
            >
              Lihat File
            </Button>
          ) : null
        });

        return uploadResult;
      } else {
        throw new Error('Upload result missing file ID');
      }
    } catch (error) {
      updateTestResult('fileUpload', { 
        success: false, 
        message: error.message 
      });
      return null;
    }
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults({});

    try {
      // Test configuration
      const configOk = await testConfiguration();
      if (!configOk) {
        toast({
          title: 'Test gagal',
          description: 'Konfigurasi Google Drive tidak lengkap',
          variant: 'destructive'
        });
        return;
      }

      // Test initialization
      const initOk = await testInitialization();
      if (!initOk) {
        toast({
          title: 'Test gagal',
          description: 'Gagal menginisialisasi Google Drive API',
          variant: 'destructive'
        });
        return;
      }

      // Test authentication
      const authOk = await testAuthentication();
      if (!authOk) {
        toast({
          title: 'Test terhenti',
          description: 'Autentikasi Google Drive diperlukan untuk melanjutkan test',
          variant: 'destructive'
        });
        return;
      }

      // Test folder creation
      const folderStructure = await testFolderCreation();
      if (!folderStructure) {
        toast({
          title: 'Test gagal',
          description: 'Gagal membuat struktur folder di Google Drive',
          variant: 'destructive'
        });
        return;
      }

      // Test file upload
      const uploadResult = await testFileUpload(folderStructure);
      if (!uploadResult) {
        toast({
          title: 'Test gagal',
          description: 'Gagal mengupload file ke Google Drive',
          variant: 'destructive'
        });
        return;
      }

      // All tests passed
      toast({
        title: 'Semua test berhasil!',
        description: 'Google Drive integration berfungsi dengan baik',
      });

    } catch (error) {
      apiLogger.error('Test runner error:', error);
      toast({
        title: 'Test error',
        description: `Terjadi error during testing: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getTestIcon = (result) => {
    if (!result) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    return result.success ? 
      <CheckCircle className="w-4 h-4 text-green-400" /> : 
      <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getTestStatus = (result) => {
    if (!result) return 'Not tested';
    return result.success ? 'Passed' : 'Failed';
  };

  const getTestColor = (result) => {
    if (!result) return 'text-gray-400';
    return result.success ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Google Drive Auth */}
      <GoogleDriveAuth 
        onAuthChange={setIsAuthenticated}
      />

      {/* Test Controls */}
      <Card className="border-white/20 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Google Drive Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runFullTest}
            disabled={isRunning || !isAuthenticated}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {currentTest || 'Running tests...'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Integration Test
              </>
            )}
          </Button>

          {!isAuthenticated && (
            <p className="text-sm text-amber-400 text-center">
              ⚠️ Autentikasi Google Drive diperlukan untuk menjalankan test
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card className="border-white/20 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'configuration', label: 'Configuration Check', icon: <TestTube className="w-4 h-4" /> },
              { key: 'initialization', label: 'API Initialization', icon: <RefreshCw className="w-4 h-4" /> },
              { key: 'authentication', label: 'User Authentication', icon: <CheckCircle className="w-4 h-4" /> },
              { key: 'folderCreation', label: 'Folder Creation', icon: <Folder className="w-4 h-4" /> },
              { key: 'fileUpload', label: 'File Upload', icon: <Upload className="w-4 h-4" /> }
            ].map(({ key, label, icon }) => {
              const result = testResults[key];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm text-gray-300">{label}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getTestIcon(result)}
                    <Badge className={`text-xs ${
                      result?.success ? 'bg-green-500/20 text-green-400' : 
                      result ? 'bg-red-500/20 text-red-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {getTestStatus(result)}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}

            {/* Show additional info for successful file upload */}
            {testResults.fileUpload?.success && testResults.fileUpload.data && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded bg-green-500/10 border border-green-500/20"
              >
                <h4 className="text-sm font-medium text-green-400 mb-2">Upload Success Details:</h4>
                <div className="text-xs text-green-300 space-y-1">
                  <div>File ID: {testResults.fileUpload.data.fileId}</div>
                  <div>File Name: {testResults.fileUpload.data.fileName}</div>
                  {testResults.fileUpload.data.viewLink && (
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => window.open(testResults.fileUpload.data.viewLink, '_blank')}
                      >
                        Open in Google Drive
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleDriveTestRunner;
