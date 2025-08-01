/**
 * Domain Authorization Error Component
 * Shows helpful guidance when Google Drive domain authorization fails
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { config } from '../../config/environment';

const DomainAuthError = ({ currentDomain, onRetry }) => {
  const [copied, setCopied] = useState(false);

  const copyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy domain:', error);
    }
  };

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-amber-300 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            Domain Authorization Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Problem Description */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <h4 className="font-medium text-amber-200 mb-2">What's happening?</h4>
            <p className="text-amber-100 text-sm">
              The Google Drive API cannot initialize because the current domain is not authorized 
              in your Google Cloud Console. This is a security measure by Google to prevent 
              unauthorized access to your API credentials.
            </p>
          </div>

          {/* Current Domain Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-white">Current Domain</h4>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
              <code className="flex-1 text-green-400 font-mono text-sm break-all">
                {currentDomain}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyDomain}
                className="p-2 h-8 w-8 text-gray-400 hover:text-white"
                title="Copy domain"
              >
                <Copy className="w-4 h-4" />
              </Button>
              {copied && (
                <Badge className="bg-green-500/20 text-green-400 text-xs">
                  Copied!
                </Badge>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h4 className="font-medium text-white">Quick Fix Steps</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">
                    Open Google Cloud Console and navigate to credentials
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openGoogleConsole}
                    className="mt-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Google Cloud Console
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">
                    Find your OAuth 2.0 Client ID and click "Edit"
                  </p>
                  <code className="text-xs text-gray-400 mt-1 block">
                    Client ID: {config.googleDrive.clientId || 'YOUR_CLIENT_ID'}
                  </code>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">
                    Add the current domain to "Authorized JavaScript origins"
                  </p>
                  <div className="bg-gray-800 rounded p-2 mt-2">
                    <code className="text-green-400 text-xs break-all">{currentDomain}</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">
                    Save changes and wait 5-10 minutes for propagation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-200 mb-2">💡 Pro Tips</h4>
            <ul className="text-blue-100 text-sm space-y-1">
              <li>• Keep existing domains (localhost) for development</li>
              <li>• Changes take 5-10 minutes to propagate</li>
              <li>• Use custom domains in production for stable URLs</li>
              <li>• Test immediately after making changes</li>
            </ul>
          </div>

          {/* Retry Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Again
            </Button>
          </div>

          {/* Help Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">
              Need more help? Check{' '}
              <a 
                href="/GOOGLE_DRIVE_DOMAIN_FIX.md" 
                className="text-blue-400 hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                detailed documentation
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DomainAuthError;
