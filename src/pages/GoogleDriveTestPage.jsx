/**
 * Google Drive Integration Test Page
 * For testing and validating Google Drive functionality
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Folder,
  FileText,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import GoogleDriveAuth from '../components/common/GoogleDriveAuth';
import { googleDriveService } from '../services/googleDriveService';
import { apiLogger } from '../lib/logger';
import { config } from '../config/environment';
import { debugGoogleDrive } from '../debug/googleDriveDebug';

const GoogleDriveTestPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testLog, setTestLog] = useState([]);

  const addToLog = (message, type = 'info') => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setTestLog(prev => [...prev, logEntry]);
  };

  const runConfigurationTest = async () => {
    addToLog('Testing Google Drive configuration...', 'info');
    
    try {
      const isConfigured = googleDriveService.isConfigured();
      
      if (isConfigured) {
        addToLog('✓ Google Drive configuration valid', 'success');
        return { success: true, message: 'Configuration OK' };
      } else {
        addToLog('✗ Google Drive configuration missing', 'error');
        return { success: false, message: 'Missing environment variables' };
      }
    } catch (error) {
      addToLog(`✗ Configuration test failed: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const runInitializationTest = async () => {
    addToLog('Testing Google Drive API initialization...', 'info');
    
    try {
      await googleDriveService.initialize();
      addToLog('✓ Google Drive API initialized successfully', 'success');
      return { success: true, message: 'Initialization OK' };
    } catch (error) {
      addToLog(`✗ Initialization failed: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const runAuthenticationTest = async () => {
    addToLog('Testing Google Drive authentication...', 'info');
    
    try {
      const authStatus = await googleDriveService.isAuthenticated();
      
      if (authStatus) {
        addToLog('✓ User already authenticated', 'success');
        return { success: true, message: 'Already authenticated' };
      } else {
        addToLog('User not authenticated', 'warning');
        return { success: false, message: 'Authentication required' };
      }
    } catch (error) {
      addToLog(`✗ Authentication test failed: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const runFolderCreationTest = async () => {
    addToLog('Testing folder creation...', 'info');
    
    try {
      if (!isAuthenticated) {
        throw new Error('Authentication required for folder creation test');
      }

      const testSubmissionType = { category: 'Test Category' };
      const testEmployeeName = 'Test Employee';

      const folderStructure = await googleDriveService.createSubmissionFolderStructure(
        testSubmissionType,
        testEmployeeName
      );

      if (folderStructure.employeeFolderId) {
        addToLog('✓ Folder structure created successfully', 'success');
        return { 
          success: true, 
          message: 'Folder creation OK',
          data: folderStructure
        };
      } else {
        throw new Error('Failed to create folder structure');
      }
    } catch (error) {
      addToLog(`✗ Folder creation failed: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const runFileUploadTest = async () => {
    addToLog('Testing file upload...', 'info');
    
    try {
      if (!isAuthenticated) {
        throw new Error('Authentication required for file upload test');
      }

      // Create a test file
      const testContent = 'This is a test file for Google Drive integration';
      const testFile = new File([testContent], 'test-file.txt', { type: 'text/plain' });

      // Create folder structure first
      const testSubmissionType = { category: 'Test Category' };
      const testEmployeeName = 'Test Employee';
      
      const folderStructure = await googleDriveService.createSubmissionFolderStructure(
        testSubmissionType,
        testEmployeeName
      );

      // Upload test file
      const uploadResult = await googleDriveService.uploadFile(
        testFile,
        folderStructure.employeeFolderId,
        'test-upload.txt'
      );

      if (uploadResult.id) {
        addToLog('✓ File uploaded successfully', 'success');
        addToLog(`File ID: ${uploadResult.id}`, 'info');
        
        // Clean up - delete test file
        try {
          await googleDriveService.deleteFile(uploadResult.id);
          addToLog('✓ Test file cleaned up', 'success');
        } catch (cleanupError) {
          addToLog('Warning: Failed to clean up test file', 'warning');
        }

        return { 
          success: true, 
          message: 'File upload OK',
          data: uploadResult
        };
      } else {
        throw new Error('Upload result missing file ID');
      }
    } catch (error) {
      addToLog(`✗ File upload failed: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const runDebugTest = async () => {
    addToLog('Running detailed Google Drive debug...', 'info');

    try {
      await debugGoogleDrive();
      addToLog('✓ Debug completed - check browser console for details', 'success');
      return { success: true, message: 'Debug completed' };
    } catch (error) {
      addToLog(`✗ Debug failed: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestLog([]);
    setTestResults({});

    addToLog('Starting Google Drive integration tests...', 'info');

    const tests = [
      { name: 'debug', test: runDebugTest },
      { name: 'configuration', test: runConfigurationTest },
      { name: 'initialization', test: runInitializationTest },
      { name: 'authentication', test: runAuthenticationTest },
      { name: 'folderCreation', test: runFolderCreationTest },
      { name: 'fileUpload', test: runFileUploadTest }
    ];

    const results = {};

    for (const { name, test } of tests) {
      try {
        const result = await test();
        results[name] = result;
        
        if (!result.success && name === 'configuration') {
          // Stop testing if configuration fails
          addToLog('Stopping tests due to configuration failure', 'error');
          break;
        }
        
        if (!result.success && name === 'authentication') {
          // Skip tests that require authentication
          addToLog('Skipping tests that require authentication', 'warning');
          results.folderCreation = { success: false, message: 'Skipped - no auth' };
          results.fileUpload = { success: false, message: 'Skipped - no auth' };
          break;
        }
      } catch (error) {
        results[name] = { success: false, message: error.message };
        addToLog(`Test ${name} threw error: ${error.message}`, 'error');
      }
    }

    setTestResults(results);
    addToLog('Test suite completed', 'info');
    setIsRunningTests(false);
  };

  const getTestStatusIcon = (result) => {
    if (!result) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    if (result.success) return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getTestStatusColor = (result) => {
    if (!result) return 'text-gray-400';
    if (result.success) return 'text-green-400';
    return 'text-red-400';
  };

  useEffect(() => {
    // Auto-run configuration test on mount
    runConfigurationTest().then(result => {
      setTestResults(prev => ({ ...prev, configuration: result }));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <TestTube className="w-8 h-8" />
            Google Drive Integration Test
          </h1>
          <p className="text-gray-300">
            Test and validate Google Drive integration functionality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Environment Configuration */}
            <Card className="border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Configuration Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Google Drive Enabled</span>
                    <Badge className={config.googleDrive.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {config.googleDrive.enabled ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">API Key</span>
                    <Badge className={config.googleDrive.apiKey ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {config.googleDrive.apiKey ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Client ID</span>
                    <Badge className={config.googleDrive.clientId ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {config.googleDrive.clientId ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Drive Auth */}
            <GoogleDriveAuth 
              onAuthChange={setIsAuthenticated}
              className="border-white/20 bg-white/5"
            />

            {/* Test Controls */}
            <Card className="border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Test Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Test Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Test Results */}
            <Card className="border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'debug', label: 'Debug Analysis', icon: <AlertCircle className="w-4 h-4" /> },
                  { key: 'configuration', label: 'Configuration', icon: <TestTube className="w-4 h-4" /> },
                  { key: 'initialization', label: 'API Initialization', icon: <RefreshCw className="w-4 h-4" /> },
                  { key: 'authentication', label: 'Authentication', icon: <CheckCircle className="w-4 h-4" /> },
                  { key: 'folderCreation', label: 'Folder Creation', icon: <Folder className="w-4 h-4" /> },
                  { key: 'fileUpload', label: 'File Upload', icon: <Upload className="w-4 h-4" /> }
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded border border-white/10">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-sm text-gray-300">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTestStatusIcon(testResults[key])}
                      <span className={`text-xs ${getTestStatusColor(testResults[key])}`}>
                        {testResults[key]?.message || 'Not run'}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test Log */}
            <Card className="border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Test Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {testLog.length === 0 ? (
                    <p className="text-gray-400 text-sm">No test logs yet</p>
                  ) : (
                    testLog.map((log, index) => (
                      <div key={index} className="text-xs flex items-start gap-2">
                        <span className="text-gray-500 font-mono">{log.timestamp}</span>
                        <span className={
                          log.type === 'success' ? 'text-green-400' :
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warning' ? 'text-yellow-400' :
                          'text-gray-300'
                        }>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveTestPage;
