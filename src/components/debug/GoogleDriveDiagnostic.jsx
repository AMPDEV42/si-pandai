import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { config } from '../../config/environment';
import { googleDriveService } from '../../services/googleDriveService';

const GoogleDriveDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({
    environment: null,
    configuration: null,
    initialization: null,
    authentication: null,
    testing: false
  });

  const [testResult, setTestResult] = useState(null);

  const checkEnvironment = () => {
    const env = {
      domain: window.location.origin,
      hasApiKey: !!config.googleDrive.apiKey,
      hasClientId: !!config.googleDrive.clientId,
      apiKeyPrefix: config.googleDrive.apiKey ? config.googleDrive.apiKey.substring(0, 8) + '...' : 'Not found',
      clientIdPrefix: config.googleDrive.clientId ? config.googleDrive.clientId.substring(0, 12) + '...' : 'Not found',
      enabled: config.googleDrive.enabled,
      isProduction: config.isProduction,
      gapiLoaded: !!window.gapi
    };
    
    setDiagnostics(prev => ({ ...prev, environment: env }));
    return env;
  };

  const checkConfiguration = () => {
    const configured = googleDriveService.isConfigured();
    const available = googleDriveService.isAvailable();
    
    const configData = {
      isConfigured: configured,
      isAvailable: available,
      isDomainBlocked: googleDriveService.isDomainBlocked,
      domainAuthError: googleDriveService.domainAuthError
    };
    
    setDiagnostics(prev => ({ ...prev, configuration: configData }));
    return configData;
  };

  const checkInitialization = async () => {
    try {
      const initialized = await googleDriveService.initialize();
      const initData = {
        success: initialized,
        error: null,
        isInitialized: googleDriveService.isInitialized
      };
      
      setDiagnostics(prev => ({ ...prev, initialization: initData }));
      return initData;
    } catch (error) {
      const initData = {
        success: false,
        error: error.message,
        isInitialized: false
      };
      
      setDiagnostics(prev => ({ ...prev, initialization: initData }));
      return initData;
    }
  };

  const checkAuthentication = async () => {
    try {
      const authenticated = await googleDriveService.isAuthenticated();
      const authData = {
        success: authenticated,
        error: null,
        hasAccessToken: !!googleDriveService.accessToken
      };
      
      setDiagnostics(prev => ({ ...prev, authentication: authData }));
      return authData;
    } catch (error) {
      const authData = {
        success: false,
        error: error.message,
        hasAccessToken: false
      };
      
      setDiagnostics(prev => ({ ...prev, authentication: authData }));
      return authData;
    }
  };

  const runFullDiagnostic = async () => {
    setDiagnostics(prev => ({ ...prev, testing: true }));
    
    try {
      checkEnvironment();
      checkConfiguration();
      await checkInitialization();
      await checkAuthentication();
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setDiagnostics(prev => ({ ...prev, testing: false }));
    }
  };

  const testUpload = async () => {
    setTestResult({ testing: true });
    
    try {
      // Create a simple test file
      const testContent = `SIPANDAI Upload Test
Date: ${new Date().toISOString()}
Domain: ${window.location.origin}
API Key: ${config.googleDrive.apiKey ? 'Present' : 'Missing'}
Client ID: ${config.googleDrive.clientId ? 'Present' : 'Missing'}`;

      const testFile = new File([testContent], 'sipandai-test.txt', {
        type: 'text/plain'
      });

      // Test folder creation
      const folderStructure = await googleDriveService.createSubmissionFolderStructure(
        { category: 'Test Upload' },
        'Diagnostic Test'
      );

      // Test file upload
      const uploadResult = await googleDriveService.uploadFile(
        testFile,
        folderStructure.employeeFolderId,
        `test-${Date.now()}.txt`
      );

      setTestResult({
        success: true,
        fileId: uploadResult.id,
        fileName: uploadResult.name,
        viewLink: uploadResult.webViewLink
      });

    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    }
  };

  useEffect(() => {
    runFullDiagnostic();
  }, []);

  const StatusIcon = ({ success, error }) => {
    if (error) return <XCircle className="w-4 h-4 text-red-500" />;
    if (success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const StatusBadge = ({ success, error }) => {
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (success) return <Badge variant="default" className="bg-green-500">Success</Badge>;
    return <Badge variant="secondary">Warning</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Google Drive Diagnostic Tool
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runFullDiagnostic}
              disabled={diagnostics.testing}
            >
              {diagnostics.testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Environment Check */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <StatusIcon success={diagnostics.environment?.hasApiKey && diagnostics.environment?.hasClientId} />
              Environment Variables
            </h3>
            {diagnostics.environment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Domain:</span>
                    <span className="font-mono">{diagnostics.environment.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span>{diagnostics.environment.isProduction ? 'Production' : 'Development'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GAPI Loaded:</span>
                    <span>{diagnostics.environment.gapiLoaded ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>API Key:</span>
                    <span className="font-mono">{diagnostics.environment.apiKeyPrefix}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client ID:</span>
                    <span className="font-mono">{diagnostics.environment.clientIdPrefix}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enabled:</span>
                    <StatusBadge success={diagnostics.environment.enabled} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Check */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <StatusIcon 
                success={diagnostics.configuration?.isConfigured && diagnostics.configuration?.isAvailable} 
                error={diagnostics.configuration?.isDomainBlocked}
              />
              Service Configuration
            </h3>
            {diagnostics.configuration && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Is Configured:</span>
                  <StatusBadge success={diagnostics.configuration.isConfigured} />
                </div>
                <div className="flex justify-between">
                  <span>Is Available:</span>
                  <StatusBadge success={diagnostics.configuration.isAvailable} />
                </div>
                <div className="flex justify-between">
                  <span>Domain Blocked:</span>
                  <StatusBadge success={!diagnostics.configuration.isDomainBlocked} error={diagnostics.configuration.isDomainBlocked} />
                </div>
                {diagnostics.configuration.domainAuthError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Domain Error:</strong> {diagnostics.configuration.domainAuthError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Initialization Check */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <StatusIcon 
                success={diagnostics.initialization?.success} 
                error={diagnostics.initialization?.error}
              />
              API Initialization
            </h3>
            {diagnostics.initialization && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Initialization:</span>
                  <StatusBadge 
                    success={diagnostics.initialization.success} 
                    error={diagnostics.initialization.error}
                  />
                </div>
                {diagnostics.initialization.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {diagnostics.initialization.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Authentication Check */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <StatusIcon 
                success={diagnostics.authentication?.success} 
                error={diagnostics.authentication?.error}
              />
              Authentication
            </h3>
            {diagnostics.authentication && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <StatusBadge 
                    success={diagnostics.authentication.success} 
                    error={diagnostics.authentication.error}
                  />
                </div>
                <div className="flex justify-between">
                  <span>Access Token:</span>
                  <StatusBadge success={diagnostics.authentication.hasAccessToken} />
                </div>
                {diagnostics.authentication.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {diagnostics.authentication.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Test */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold">Upload Test</h3>
              <Button 
                onClick={testUpload} 
                disabled={testResult?.testing || !diagnostics.authentication?.success}
                size="sm"
              >
                {testResult?.testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  'Test Upload'
                )}
              </Button>
            </div>

            {testResult && !testResult.testing && (
              <div className="space-y-2">
                {testResult.success ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Upload Successful!
                    </div>
                    <div className="text-sm space-y-1">
                      <div>File ID: <span className="font-mono">{testResult.fileId}</span></div>
                      <div>File Name: <span className="font-mono">{testResult.fileName}</span></div>
                      {testResult.viewLink && (
                        <div>
                          <a 
                            href={testResult.viewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View in Google Drive
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                      <XCircle className="w-4 h-4" />
                      Upload Failed
                    </div>
                    <div className="text-sm text-red-600">
                      {testResult.error}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Fixes */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Environment Variables</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Current API Key: {config.googleDrive.apiKey ? 'AIzaSyAUKwd...' : 'Not set'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('Environment Debug:', {
                      VITE_GOOGLE_DRIVE_API_KEY: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY,
                      VITE_GOOGLE_DRIVE_CLIENT_ID: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID,
                      configApiKey: config.googleDrive.apiKey,
                      configClientId: config.googleDrive.clientId
                    });
                  }}
                >
                  Log Environment
                </Button>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">Service Reset</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Reset Google Drive service state
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    googleDriveService.reset();
                    runFullDiagnostic();
                  }}
                >
                  Reset Service
                </Button>
              </Card>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleDriveDiagnostic;
