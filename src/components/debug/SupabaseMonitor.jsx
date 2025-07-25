/**
 * Supabase Connection Monitor
 * Shows connectivity status in development environment
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { checkSupabaseHealth, runConnectivityDiagnostics } from '../../lib/customSupabaseClient';
import { config } from '../../config/environment';

const SupabaseMonitor = () => {
  const [status, setStatus] = useState({
    isHealthy: null,
    responseTime: null,
    lastCheck: null
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (!config.isDevelopment) return;

    const checkStatus = async () => {
      try {
        const health = await checkSupabaseHealth();
        setStatus({
          isHealthy: health.isHealthy,
          responseTime: health.responseTime,
          lastCheck: new Date(),
          error: health.error
        });
      } catch (error) {
        setStatus({
          isHealthy: false,
          responseTime: null,
          lastCheck: new Date(),
          error: error.message
        });
      }
    };

    // Initial check
    checkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    // Show monitor after 2 seconds
    const showTimer = setTimeout(() => setIsVisible(true), 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(showTimer);
    };
  }, []);

  // Don't render in production
  if (!config.isDevelopment) return null;

  const getStatusColor = () => {
    if (status.isHealthy === null) return 'gray';
    return status.isHealthy ? 'green' : 'red';
  };

  const getStatusIcon = () => {
    if (status.isHealthy === null) return <Activity className="w-3 h-3" />;
    return status.isHealthy ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />;
  };

  const getStatusText = () => {
    if (status.isHealthy === null) return 'Checking...';
    if (status.isHealthy) {
      return `Online ${status.responseTime ? `(${status.responseTime}ms)` : ''}`;
    }
    return 'Offline';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Badge 
            className={`
              bg-${getStatusColor()}-500/20 
              text-${getStatusColor()}-400 
              border-${getStatusColor()}-500/30 
              flex items-center gap-2 px-3 py-1.5
              backdrop-blur-sm
              cursor-pointer
              hover:bg-${getStatusColor()}-500/30
              transition-colors
            `}
            onClick={() => {
              console.log('Supabase Status:', status);
              runConnectivityDiagnostics().then(diagnostics => {
                console.log('Full Diagnostics:', diagnostics);
              });
            }}
            title={`Supabase Status - Click for diagnostics${status.error ? `\nError: ${status.error}` : ''}`}
          >
            {getStatusIcon()}
            <span className="text-xs font-medium">
              Supabase: {getStatusText()}
            </span>
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupabaseMonitor;
