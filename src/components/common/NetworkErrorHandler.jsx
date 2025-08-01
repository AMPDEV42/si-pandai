/**
 * Network Error Handler Component
 * Provides UI for handling network connectivity issues
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import {
  isOnline,
  setupNetworkListeners
} from '../../lib/networkChecker';
import { getConnectivityStatus } from '../../lib/networkUtils';
import { config } from '../../config/environment';

const NetworkErrorHandler = ({ children, onNetworkRestore }) => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isChecking: false,
    lastCheck: null,
    supabaseReachable: true
  });
  const [showNetworkError, setShowNetworkError] = useState(false);
  const { toast } = useToast();

  const checkConnectivity = async () => {
    setNetworkStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const connectivityStatus = await getConnectivityStatus(
        config.supabase.url,
        config.supabase.anonKey
      );

      const isConnected = connectivityStatus.isOnline && connectivityStatus.status !== 'offline';

      setNetworkStatus({
        isOnline: isConnected,
        isChecking: false,
        lastCheck: new Date(),
        supabaseReachable: connectivityStatus.details?.supabase?.isReachable || false,
        details: connectivityStatus.details,
        status: connectivityStatus.status,
        issues: connectivityStatus.issues
      });

      if (isConnected && showNetworkError) {
        setShowNetworkError(false);
        toast({
          title: 'Koneksi pulih',
          description: 'Koneksi ke server telah dipulihkan',
        });
        onNetworkRestore?.();
      } else if (!isConnected && !showNetworkError && connectivityStatus.status === 'offline') {
        // Only show error for definitive offline status
        setShowNetworkError(true);
        toast({
          title: 'Masalah koneksi',
          description: connectivityStatus.issues?.join(', ') || 'Tidak dapat terhubung ke server',
          variant: 'destructive'
        });
      }

    } catch (error) {
      // Conservative fallback - don't assume offline
      const isDevelopment = import.meta.env.DEV;
      const isNetworkError = error.message?.includes('Failed to fetch') || error.name === 'TypeError';

      setNetworkStatus(prev => ({
        ...prev,
        isOnline: isDevelopment ? true : navigator.onLine, // Assume online in dev
        isChecking: false,
        lastCheck: new Date(),
        error: error.message
      }));

      // Only show error if navigator definitively reports offline, and not in dev with network errors
      if (!navigator.onLine && !(isDevelopment && isNetworkError)) {
        setShowNetworkError(true);
        toast({
          title: 'Masalah koneksi',
          description: 'Periksa koneksi internet Anda',
          variant: 'destructive'
        });
      }
    }
  };

  const handleRetry = () => {
    checkConnectivity();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      () => {
        setTimeout(checkConnectivity, 1000);
      },
      () => {
        setNetworkStatus(prev => ({ ...prev, isOnline: false }));
        setShowNetworkError(true);
      }
    );

    // Periodic check every 30 seconds if offline
    const interval = setInterval(() => {
      if (!networkStatus.isOnline) {
        checkConnectivity();
      }
    }, 30000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [networkStatus.isOnline]);

  if (showNetworkError && !networkStatus.isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-red-500/20">
                  <WifiOff className="w-8 h-8 text-red-400" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-red-300 mb-2">
                  Masalah Koneksi
                </h2>
                <p className="text-red-200/80 text-sm">
                  Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.
                </p>
              </div>

              {/* Status Details */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-300">Internet</span>
                  <Badge className={`${
                    isOnline() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isOnline() ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-300">Server</span>
                  <Badge className={`${
                    networkStatus.supabaseReachable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {networkStatus.supabaseReachable ? 'Reachable' : 'Unreachable'}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleRetry}
                  disabled={networkStatus.isChecking}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {networkStatus.isChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Memeriksa...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Coba Lagi
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
                >
                  Refresh Halaman
                </Button>
              </div>

              {/* Last Check Time */}
              {networkStatus.lastCheck && (
                <p className="text-xs text-red-300/60">
                  Terakhir diperiksa: {networkStatus.lastCheck.toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Network Status Indicator */}
      <AnimatePresence>
        {!networkStatus.isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-3 flex items-center gap-3">
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-sm">Koneksi bermasalah</span>
                <Button
                  size="sm"
                  onClick={handleRetry}
                  disabled={networkStatus.isChecking}
                  className="h-6 px-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {networkStatus.isChecking ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    'Retry'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NetworkErrorHandler;
