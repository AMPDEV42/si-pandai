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
      // In production, use a more conservative approach to avoid fetch errors
      const isProduction = import.meta.env.PROD;

      // Check if environment variables are configured
      const hasSupabaseConfig = config.supabase.url && config.supabase.anonKey;

      if (!hasSupabaseConfig) {
        const isDevelopment = import.meta.env.DEV;

        setNetworkStatus({
          isOnline: isDevelopment, // Assume online in dev when config missing
          isChecking: false,
          lastCheck: new Date(),
          supabaseReachable: isDevelopment,
          configMissing: true,
          status: isDevelopment ? 'dev-config-missing' : 'config-error',
          issues: ['Missing Supabase configuration']
        });

        if (!isDevelopment) {
          setShowNetworkError(true);
          toast({
            title: 'Konfigurasi hilang',
            description: 'Konfigurasi database tidak ditemukan. Hubungi administrator.',
            variant: 'destructive'
          });
        }
        return;
      }

      let connectivityStatus;
      try {
        connectivityStatus = await getConnectivityStatus(
          config.supabase.url,
          config.supabase.anonKey
        );
      } catch (connectivityError) {
        // Handle connectivity check failures gracefully in all environments
        const isDevelopment = import.meta.env.DEV;
        const isProduction = import.meta.env.PROD;
        const isNetworkError = connectivityError.message?.includes('Failed to fetch') || connectivityError.name === 'TypeError';

        // Create a safe fallback status - assume online to prevent app blocking
        connectivityStatus = {
          isOnline: true, // Always assume online to prevent blocking
          status: isNetworkError ? 'connectivity-check-failed-fallback' : 'unknown-error-fallback',
          details: {
            network: { isOnline: navigator.onLine },
            supabase: {
              isReachable: true, // Assume reachable in all environments
              error: connectivityError.message
            }
          },
          issues: [],
          note: 'Connectivity check failed but assumed online to prevent app blocking'
        };

        // Log but don't throw in production to prevent app breakage
        if (isProduction) {
          console.warn('Connectivity check failed in production:', {
            error: connectivityError.message,
            type: connectivityError.name,
            navigator_online: navigator.onLine
          });
        }
      }

      // Determine connection status more conservatively
      const hasNavigatorOnline = navigator.onLine;
      const isDefinitelyOffline = connectivityStatus.status === 'offline' && !hasNavigatorOnline;
      const isConnectivityCheckFailed = connectivityStatus.status === 'connectivity-check-failed';

      // Be conservative: only consider truly offline if navigator says offline AND connectivity check confirms
      const isConnected = hasNavigatorOnline && !isDefinitelyOffline;

      setNetworkStatus({
        isOnline: isConnected,
        isChecking: false,
        lastCheck: new Date(),
        supabaseReachable: connectivityStatus.details?.supabase?.isReachable ?? true, // Default to true if unknown
        details: connectivityStatus.details,
        status: connectivityStatus.status,
        issues: connectivityStatus.issues,
        configMissing: false,
        connectivityCheckFailed: isConnectivityCheckFailed
      });

      if (isConnected && showNetworkError) {
        setShowNetworkError(false);
        toast({
          title: 'Koneksi pulih',
          description: 'Koneksi ke server telah dipulihkan',
        });
        onNetworkRestore?.();
      } else if (isDefinitelyOffline && !showNetworkError) {
        // Only show error for definitive offline status (both navigator and connectivity check agree)
        setShowNetworkError(true);
        toast({
          title: 'Masalah koneksi',
          description: connectivityStatus.issues?.join(', ') || 'Tidak dapat terhubung ke server',
          variant: 'destructive'
        });
      } else if (isConnectivityCheckFailed && !showNetworkError) {
        // For connectivity check failures, show a milder warning
        toast({
          title: 'Peringatan koneksi',
          description: 'Pemeriksaan koneksi gagal, tetapi aplikasi masih berfungsi',
          variant: 'default'
        });
      }

    } catch (error) {
      // Conservative fallback - don't assume offline unless navigator confirms
      const isDevelopment = import.meta.env.DEV;
      const isProduction = import.meta.env.PROD;
      const isNetworkError = error.message?.includes('Failed to fetch') || error.name === 'TypeError';
      const isConfigError = error.message?.includes('ConfigError') || error.name === 'ConfigError';

      // In production, log error but maintain functionality
      if (isProduction && isNetworkError) {
        console.warn('Network check failed in production, assuming connectivity:', {
          error: error.message,
          navigator_online: navigator.onLine
        });
      }

      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine, // Trust navigator.onLine as primary indicator
        isChecking: false,
        lastCheck: new Date(),
        error: error.message,
        configMissing: isConfigError,
        checkFailed: true
      }));

      // Handle configuration errors (always show these)
      if (isConfigError) {
        setShowNetworkError(true);
        toast({
          title: 'Masalah konfigurasi',
          description: 'Aplikasi tidak dikonfigurasi dengan benar. Hubungi administrator.',
          variant: 'destructive'
        });
        return;
      }

      // Only show error if navigator definitively reports offline
      if (!navigator.onLine) {
        setShowNetworkError(true);
        toast({
          title: 'Masalah koneksi',
          description: 'Periksa koneksi internet Anda',
          variant: 'destructive'
        });
      } else if (isProduction && isNetworkError) {
        // In production, if navigator says online but we have network errors, show a gentle warning
        toast({
          title: 'Peringatan',
          description: 'Pemeriksaan jaringan gagal, tetapi koneksi tampaknya tersedia',
          variant: 'default'
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
    // Safe initial check with error boundary
    const safeCheckConnectivity = async () => {
      try {
        await checkConnectivity();
      } catch (error) {
        console.warn('Initial connectivity check failed:', error.message);
        // Set a safe default state
        setNetworkStatus({
          isOnline: navigator.onLine,
          isChecking: false,
          lastCheck: new Date(),
          supabaseReachable: false,
          configMissing: true,
          error: error.message
        });
      }
    };

    safeCheckConnectivity();

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      () => {
        setTimeout(safeCheckConnectivity, 1000);
      },
      () => {
        setNetworkStatus(prev => ({ ...prev, isOnline: false }));
        setShowNetworkError(true);
      }
    );

    // Periodic check every 30 seconds if offline
    const interval = setInterval(() => {
      if (!networkStatus.isOnline) {
        safeCheckConnectivity();
      }
    }, 30000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [networkStatus.isOnline]);

  if (showNetworkError && !networkStatus.isOnline && !navigator.onLine) {
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
                  {networkStatus.configMissing ? 'Masalah Konfigurasi' : 'Masalah Koneksi'}
                </h2>
                <p className="text-red-200/80 text-sm">
                  {networkStatus.configMissing
                    ? 'Aplikasi tidak dikonfigurasi dengan benar. Hubungi administrator untuk mengatur environment variables.'
                    : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'
                  }
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
