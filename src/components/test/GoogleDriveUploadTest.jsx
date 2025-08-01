/**
 * Google Drive Upload Test Component
 * Simple test component to verify Google Drive upload functionality
 */

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { googleDriveService } from '../../services/googleDriveService';
import { useToast } from '../ui/use-toast';

const GoogleDriveUploadTest = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const { toast } = useToast();

  // Check authentication status
  const checkAuth = async () => {
    try {
      const authStatus = await googleDriveService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setAuthError(null);
      
      if (!authStatus) {
        // Try to authenticate
        await googleDriveService.authenticate(false); // Not silent
        const newAuthStatus = await googleDriveService.isAuthenticated();
        setIsAuthenticated(newAuthStatus);
      }
    } catch (error) {
      setAuthError(error.message);
      setIsAuthenticated(false);
    }
  };

  // Test file upload
  const testUpload = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please authenticate with Google Drive first",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Create a test file
      const testContent = `Test file uploaded from SIPANDAI
Domain: ${window.location.origin}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}`;

      const testFile = new File([testContent], 'sipandai-test.txt', {
        type: 'text/plain'
      });

      // Upload to Google Drive
      const result = await googleDriveService.uploadFile(testFile, {
        description: 'Test upload from SIPANDAI application',
        folderId: null // Upload to root folder
      });

      setUploadResult({
        success: true,
        fileId: result.id,
        fileName: result.name,
        webViewLink: result.webViewLink,
        message: 'File uploaded successfully!'
      });

      toast({
        title: "Upload Successful",
        description: `File uploaded: ${result.name}`,
      });

    } catch (error) {
      setUploadResult({
        success: false,
        error: error.message,
        message: 'Upload failed'
      });

      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-blue-500/20 bg-blue-500/5 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-blue-300 flex items-center gap-3">
          <Upload className="w-5 h-5" />
          Google Drive Upload Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Info */}
        <div className="bg-white/10 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">Current Configuration</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Domain:</span>
              <code className="text-green-400">{window.location.origin}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Google Drive Configured:</span>
              <Badge className={googleDriveService.isConfigured() ? 
                'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {googleDriveService.isConfigured() ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Authentication Status:</span>
              <Badge className={isAuthenticated ? 
                'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Authentication Error */}
        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-300 font-medium">Authentication Error</h4>
                <p className="text-red-200 text-sm mt-1">{authError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className={`border rounded-lg p-3 ${
            uploadResult.success ? 
            'bg-green-500/10 border-green-500/20' : 
            'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-2">
              {uploadResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  uploadResult.success ? 'text-green-300' : 'text-red-300'
                }`}>
                  {uploadResult.message}
                </h4>
                
                {uploadResult.success && (
                  <div className="mt-2 space-y-1 text-sm text-green-200">
                    <p><strong>File ID:</strong> {uploadResult.fileId}</p>
                    <p><strong>File Name:</strong> {uploadResult.fileName}</p>
                    {uploadResult.webViewLink && (
                      <p>
                        <strong>View File:</strong>{' '}
                        <a 
                          href={uploadResult.webViewLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Open in Google Drive
                        </a>
                      </p>
                    )}
                  </div>
                )}
                
                {!uploadResult.success && (
                  <p className="text-red-200 text-sm mt-1">{uploadResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={checkAuth}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Authentication
          </Button>
          
          <Button
            onClick={testUpload}
            disabled={isUploading || !googleDriveService.isConfigured()}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Test Upload
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <h4 className="text-amber-200 font-medium mb-2">Test Instructions</h4>
          <ol className="text-amber-100 text-sm space-y-1 list-decimal list-inside">
            <li>Click "Check Authentication" to verify Google Drive access</li>
            <li>If not authenticated, follow the authentication flow</li>
            <li>Click "Test Upload" to upload a test file</li>
            <li>Check the result and verify file appears in Google Drive</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveUploadTest;
