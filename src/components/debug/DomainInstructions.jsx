/**
 * Domain Authorization Instructions
 * Shows exact instructions for authorizing the current domain
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Globe, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const DomainInstructions = () => {
  const [copied, setCopied] = useState(false);
  const currentDomain = window.location.origin;
  const clientId = '47138776708-suu99tvg4v2l4248ololg59hvsevpo13.apps.googleusercontent.com';

  const copyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  const runTest = () => {
    if (window.testGoogleDriveSimple) {
      window.testGoogleDriveSimple();
    } else {
      console.log('Test function not available');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-6"
    >
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-3">
            <Globe className="w-6 h-6" />
            Google Drive Domain Authorization Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Domain */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Current Domain to Authorize:</h3>
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 rounded p-3">
              <code className="text-green-400 font-mono text-sm flex-1 break-all">
                {currentDomain}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyDomain}
                className="p-2 h-8 w-8 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
              {copied && (
                <span className="text-green-400 text-xs">Copied!</span>
              )}
            </div>
          </div>

          {/* Step-by-step Instructions */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Step-by-Step Instructions:</h3>
            
            <div className="space-y-3">
              <div className="flex gap-4 p-4 bg-white/5 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Open Google Cloud Console</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Navigate to the Google Cloud Console credentials page
                  </p>
                  <Button
                    size="sm"
                    onClick={openGoogleConsole}
                    className="mt-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Console
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Find OAuth 2.0 Client ID</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Look for this specific client ID in your credentials list:
                  </p>
                  <code className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded block mt-2 break-all">
                    {clientId}
                  </code>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Edit OAuth Settings</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Click the edit button (pencil icon) next to the OAuth 2.0 Client ID
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Add Authorized JavaScript Origin</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Under "Authorized JavaScript origins", click "ADD URI" and paste:
                  </p>
                  <div className="bg-green-900/20 border border-green-500/30 rounded p-2 mt-2">
                    <code className="text-green-400 text-sm">{currentDomain}</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Save and Wait</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Click "SAVE" and wait 5-10 minutes for changes to propagate globally
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-green-200 font-medium mb-2">Test Domain Authorization</h4>
            <p className="text-green-100 text-sm mb-3">
              After adding the domain, use this test to verify the setup:
            </p>
            <Button
              onClick={runTest}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Run Domain Test
            </Button>
            <p className="text-xs text-green-300 mt-2">
              Check browser console for detailed test results
            </p>
          </div>

          {/* Additional Info */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <h4 className="text-amber-200 font-medium mb-2">Important Notes</h4>
            <ul className="text-amber-100 text-sm space-y-1">
              <li>• Changes can take 5-10 minutes to propagate</li>
              <li>• Keep existing authorized origins (like localhost)</li>
              <li>• The domain must match exactly (including https://)</li>
              <li>• Test after each deployment to new domains</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DomainInstructions;
