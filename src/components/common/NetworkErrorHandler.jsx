/**
 * Network Error Handler Component
 * Shows helpful guidance when network/Supabase connectivity fails
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { runConnectivityDiagnostics } from '../../lib/customSupabaseClient';
import { apiLogger } from '../../lib/logger';

const NetworkErrorHandler = ({ error, onRetry, className = '' }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Auto-run diagnostics when component mounts
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const result = await runConnectivityDiagnostics();
      setDiagnostics(result);
    } catch (error) {
      apiLogger.error('Failed to run diagnostics', error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const isNetworkError = (error) => {
    const networkErrors = [
      'Failed to fetch',
      'Network request failed',
      'TypeError: fetch failed',
      'Connection reset',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];
    
    const errorMessage = error?.message || error?.toString() || '';
    return networkErrors.some(netError => 
      errorMessage.toLowerCase().includes(netError.toLowerCase())
    );
  };

  const getErrorType = () => {
    if (isNetworkError(error)) {
      return {
        type: 'network',
        title: 'Network Connection Issue',
        icon: <WifiOff className="w-6 h-6" />,
        description: 'Unable to connect to the server. This could be a temporary network issue.'
      };
    }
    
    return {
      type: 'general',
      title: 'Connection Error',
      icon: <AlertCircle className="w-6 h-6" />,
      description: 'There was a problem connecting to the service.'
    };
  };

  const errorInfo = getErrorType();

  const getConnectivityStatus = () => {
    if (!diagnostics) return null;
    
    const networkOk = diagnostics.network?.isOnline;
    const supabaseOk = diagnostics.supabase?.isHealthy;
    
    if (networkOk && supabaseOk) {
      return { status: 'good', message: 'All connections working', color: 'green' };
    } else if (networkOk && !supabaseOk) {
      return { status: 'partial', message: 'Network OK, database issue', color: 'yellow' };
    } else if (!networkOk) {
      return { status: 'poor', message: 'Network connectivity issues', color: 'red' };
    }
    
    return { status: 'unknown', message: 'Status unknown', color: 'gray' };
  };

  const connectivityStatus = getConnectivityStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-2xl mx-auto ${className}`}
    >
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-300 flex items-center gap-3">
            {errorInfo.icon}
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Description */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-100 text-sm mb-2">
              {errorInfo.description}
            </p>
            <code className="text-xs text-red-200 bg-red-900/20 p-2 rounded block break-all">
              {error?.message || 'Unknown error'}
            </code>
          </div>

          {/* Connectivity Status */}
          {connectivityStatus && (
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Connection Status</span>
              </div>
              <Badge className={`bg-${connectivityStatus.color}-500/20 text-${connectivityStatus.color}-400 border-${connectivityStatus.color}-500/30`}>
                {connectivityStatus.message}
              </Badge>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              {isRunningDiagnostics ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Diagnostics Details */}
          {diagnostics && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-400 hover:text-white p-0 h-auto"
              >
                {showDetails ? 'Hide' : 'Show'} diagnostics details
              </Button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-900/50 rounded-lg p-4 space-y-3"
                  >
                    {/* Network Status */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Network Connectivity</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Status</span>
                          <Badge className={diagnostics.network?.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {diagnostics.network?.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Connectivity</span>
                          <span className="text-gray-300">{Math.round((diagnostics.network?.connectivity || 0) * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Supabase Status */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Database Connection</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Status</span>
                          <Badge className={diagnostics.supabase?.isHealthy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {diagnostics.supabase?.isHealthy ? 'Healthy' : 'Error'}
                          </Badge>
                        </div>
                        {diagnostics.supabase?.responseTime && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Response Time</span>
                            <span className="text-gray-300">{diagnostics.supabase.responseTime}ms</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Browser Info */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Browser Status</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Online</span>
                          <Badge className={diagnostics.browser?.onLine ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {diagnostics.browser?.onLine ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Cookies</span>
                          <Badge className={diagnostics.browser?.cookieEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {diagnostics.browser?.cookieEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-200 mb-2">💡 Troubleshooting Tips</h4>
            <ul className="text-blue-100 text-sm space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Disable browser extensions temporarily</li>
              <li>• Clear browser cache and cookies</li>
              <li>• Try using a different browser or incognito mode</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NetworkErrorHandler;
