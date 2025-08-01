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
import GoogleDriveTestRunner from '../components/test/GoogleDriveTestRunner';
import GoogleDriveUploadTest from '../components/test/GoogleDriveUploadTest';
import SupabaseFetchTest from '../components/test/SupabaseFetchTest';
import { googleDriveService } from '../services/googleDriveService';
import { apiLogger } from '../lib/logger';
import { config } from '../config/environment';
import { debugGoogleDrive } from '../debug/googleDriveDebug';
import DomainInstructions from '../components/debug/DomainInstructions';
import { testSupabaseConnection } from '../utils/supabaseConnectionTest';

const GoogleDriveTestPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testLog, setTestLog] = useState([]);
  const [activeTab, setActiveTab] = useState('test');
  const [isLoading, setIsLoading] = useState(true);

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
      // First ensure we're initialized
      if (!isInitialized) {
        addToLog('Initializing Google Drive service...', 'info');
        await googleDriveService.initialize();
        setIsInitialized(true);
      }
      
      // Check authentication status
      const authStatus = await googleDriveService.isAuthenticated();
      
      if (authStatus) {
        addToLog('✓ User authenticated', 'success');
        setIsAuthenticated(true);
        return { success: true, message: 'Authentication successful' };
      } else {
        // Try to authenticate silently
        try {
          addToLog('Attempting silent authentication...', 'info');
          await googleDriveService.authenticate(true);
          setIsAuthenticated(true);
          addToLog('✓ Silent authentication successful', 'success');
          return { success: true, message: 'Silent authentication successful' };
        } catch (silentAuthError) {
          addToLog('Silent authentication failed, manual sign-in required', 'warning');
          return { 
            success: false, 
            message: 'Manual sign-in required',
            requiresUserAction: true
          };
        }
      }
    } catch (error) {
      addToLog(`✗ Authentication test failed: ${error.message}`, 'error');
      return { 
        success: false, 
        message: error.message,
        requiresUserAction: error.requiresUserAction || false
      };
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

  const runSupabaseConnectionTest = async () => {
    addToLog('Testing Supabase connection...', 'info');

    try {
      const result = await testSupabaseConnection();

      if (result.configured && result.networkReachable && result.authWorking && result.healthCheck) {
        addToLog('✓ Supabase connection test passed', 'success');
        return { success: true, message: 'Supabase connection OK' };
      } else {
        addToLog(`✗ Supabase connection issues: ${result.error}`, 'error');
        return { success: false, message: result.error || 'Connection failed' };
      }
    } catch (error) {
      addToLog(`✗ Supabase connection test failed: ${error.message}`, 'error');
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

    try {
      // Run configuration test
      const configResult = await runConfigurationTest();
      setTestResults(prev => ({ ...prev, configuration: configResult }));
      
      // Only proceed if configuration is valid
      if (configResult.success) {
        // Run initialization test
        const initResult = await runInitializationTest();
        setTestResults(prev => ({ ...prev, initialization: initResult }));
        
        // Only proceed if initialization is successful
        if (initResult.success) {
          // Run authentication test
          const authResult = await runAuthenticationTest();
          setTestResults(prev => ({ ...prev, authentication: authResult }));
          
          // If authentication requires user action, stop here
          if (authResult.requiresUserAction) {
            addToLog('ℹ️ Authentication requires user action. Please sign in when prompted.', 'info');
            setIsRunningTests(false);
            return;
          }
          
          // Only proceed if authenticated
          if (authResult.success) {
            // Run folder creation test
            const folderResult = await runFolderCreationTest();
            setTestResults(prev => ({ ...prev, folderCreation: folderResult }));
            
            // Run file upload test if folder creation was successful
            if (folderResult.success) {
              const uploadResult = await runFileUploadTest();
              setTestResults(prev => ({ ...prev, fileUpload: uploadResult }));
            }
            
            // Run Supabase test
            const supabaseResult = await runSupabaseConnectionTest();
            setTestResults(prev => ({ ...prev, supabaseConnection: supabaseResult }));
            
            // Run debug test
            const debugResult = await runDebugTest();
            setTestResults(prev => ({ ...prev, debug: debugResult }));
          }
        }
      }
    } catch (error) {
      addToLog(`✗ Test execution error: ${error.message}`, 'error');
    } finally {
      setIsRunningTests(false);
      addToLog('Test suite completed', 'info');
    }
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

  // Initialize Google Drive and check authentication status on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const isConfigured = googleDriveService.isConfigured();
        
        if (!isConfigured) {
          addToLog('⚠️ Google Drive is not properly configured. Please check your environment variables.', 'warning');
          return;
        }
        
        // Initialize the Google Drive service
        await googleDriveService.initialize();
        setIsInitialized(true);
        
        // Check authentication status
        const authStatus = await googleDriveService.isAuthenticated();
        setIsAuthenticated(authStatus);
        
        if (!authStatus) {
          // Try silent authentication
          try {
            addToLog('Attempting silent authentication...', 'info');
            await googleDriveService.authenticate(true);
            setIsAuthenticated(true);
            addToLog('✓ Silent authentication successful', 'success');
          } catch (error) {
            if (error.requiresUserAction) {
              addToLog('User interaction required for authentication', 'info');
            } else {
              addToLog(`Silent authentication failed: ${error.message}`, 'warning');
            }
          }
        } else {
          addToLog('✓ Already authenticated with Google Drive', 'success');
        }
      } catch (error) {
        addToLog(`Initialization error: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
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

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              API Testing
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Upload Test
            </button>
            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'supabase'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Supabase Test
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'setup'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Domain Setup
            </button>
          </div>
        </div>

        {activeTab === 'setup' ? (
          <DomainInstructions />
        ) : activeTab === 'supabase' ? (
          <div className="max-w-2xl mx-auto">
            <SupabaseFetchTest />
          </div>
        ) : activeTab === 'upload' ? (
          <div className="max-w-2xl mx-auto">
            <GoogleDriveTestRunner />
          </div>
        ) : (
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
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Google Drive Integration Test</h1>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Initializing...
                      </div>
                    ) : !isInitialized ? (
                      <div className="text-sm text-yellow-600">
                        Service not initialized. Check configuration.
                      </div>
                    ) : !isAuthenticated ? (
                      <Button 
                        onClick={async () => {
                          try {
                            await googleDriveService.authenticate();
                            setIsAuthenticated(true);
                            addToLog('✓ Manual authentication successful', 'success');
                          } catch (error) {
                            addToLog(`✗ Authentication failed: ${error.message}`, 'error');
                          }
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Sign In to Google Drive
                      </Button>
                    ) : (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Connected to Google Drive
                      </div>
                    )}
                    
                    <Button 
                      onClick={runAllTests} 
                      disabled={isRunningTests || !isInitialized}
                      className="flex items-center gap-2"
                    >
                      {isRunningTests ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4" />
                          Run All Tests
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
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
                  { key: 'supabaseConnection', label: 'Supabase Connection', icon: <CheckCircle className="w-4 h-4" /> },
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
        )}
      </div>
    </div>
  );
};

export default GoogleDriveTestPage;
