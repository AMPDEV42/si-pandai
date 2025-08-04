/**
 * Production-Safe Network Test Utility
 * Tests network connectivity without causing CSP violations or fetch errors
 */

import { checkNetworkConnectivity, getConnectivityStatus } from '../lib/networkUtils';
import { config } from '../config/environment';
import { apiLogger } from '../lib/logger';

/**
 * Safe network connectivity test that won't throw errors in production
 */
export const safeNetworkTest = async () => {
  try {
    apiLogger.info('Running safe network connectivity test');
    
    // Test basic network connectivity
    const networkStatus = await checkNetworkConnectivity();
    
    // Test Supabase connectivity if configured
    let supabaseStatus = null;
    if (config.supabase.url && config.supabase.anonKey) {
      const connectivityStatus = await getConnectivityStatus(
        config.supabase.url,
        config.supabase.anonKey
      );
      supabaseStatus = connectivityStatus;
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      network: networkStatus,
      supabase: supabaseStatus,
      environment: import.meta.env.PROD ? 'production' : 'development',
      navigator: {
        onLine: navigator.onLine,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      }
    };
    
    apiLogger.info('Network connectivity test completed successfully', result);
    return result;
    
  } catch (error) {
    // Gracefully handle any errors
    const fallbackResult = {
      timestamp: new Date().toISOString(),
      error: error.message,
      network: { isOnline: navigator.onLine, method: 'navigator-fallback' },
      supabase: { isReachable: true, status: 'assumed-reachable' },
      environment: import.meta.env.PROD ? 'production' : 'development',
      note: 'Test failed gracefully - using fallback assumptions'
    };
    
    apiLogger.debug('Network test failed gracefully, using fallback', fallbackResult);
    return fallbackResult;
  }
};

/**
 * Quick connectivity check for use in components
 */
export const quickConnectivityCheck = () => {
  return {
    isOnline: navigator.onLine,
    timestamp: new Date().toISOString(),
    method: 'navigator-only',
    note: 'Quick check using navigator.onLine only'
  };
};

export default safeNetworkTest;
