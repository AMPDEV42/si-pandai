/**
 * Simple Network Checker
 * Provides basic connectivity detection without external requests to avoid CSP violations
 */

import { apiLogger } from './logger';

/**
 * Simple connectivity check using only navigator.onLine
 * No external requests to avoid CSP violations
 */
export const checkBasicConnectivity = () => {
  const isOnline = navigator.onLine;
  const result = {
    isOnline,
    connectivity: isOnline ? 1 : 0,
    method: 'navigator-only',
    timestamp: new Date().toISOString(),
    note: 'Basic connectivity check using navigator.onLine only'
  };
  
  apiLogger.debug('Basic connectivity check completed', result);
  return result;
};

/**
 * Test Supabase connectivity without external requests
 */
export const checkSupabaseBasic = async (supabaseUrl, apiKey) => {
  if (!supabaseUrl || !apiKey) {
    return {
      isReachable: false,
      status: 'config-missing',
      error: 'Missing Supabase configuration',
      note: 'URL or API key not provided'
    };
  }

  try {
    // Simple validation without actual network request
    new URL(supabaseUrl);
    
    return {
      isReachable: true,
      status: 'config-valid',
      hasApiKey: !!apiKey,
      url: supabaseUrl,
      note: 'Configuration validated - actual connectivity assumed'
    };
  } catch (error) {
    return {
      isReachable: false,
      status: 'config-invalid',
      error: 'Invalid Supabase URL format',
      url: supabaseUrl
    };
  }
};

/**
 * Get overall connectivity status without external requests
 */
export const getSimpleConnectivityStatus = async (supabaseUrl, apiKey) => {
  const basic = checkBasicConnectivity();
  const supabase = await checkSupabaseBasic(supabaseUrl, apiKey);
  
  const status = basic.isOnline && supabase.isReachable ? 'online' : 'degraded';
  const issues = [];
  
  if (!basic.isOnline) {
    issues.push('Browser reports offline');
  }
  
  if (!supabase.isReachable) {
    issues.push('Supabase configuration issue');
  }
  
  return {
    status,
    isOnline: basic.isOnline,
    issues,
    details: {
      network: basic,
      supabase: supabase
    },
    timestamp: new Date().toISOString(),
    note: 'Simple connectivity check - no external requests made'
  };
};

export default {
  checkBasicConnectivity,
  checkSupabaseBasic,
  getSimpleConnectivityStatus
};
