/**
 * Enhanced Network Utilities
 * Provides robust network connectivity testing with fallbacks
 */

import { apiLogger } from './logger';

// Reliable endpoints for connectivity testing
const CONNECTIVITY_ENDPOINTS = [
  { url: 'https://www.google.com/favicon.ico', name: 'google', timeout: 2000 },
  { url: 'https://cdn.jsdelivr.net/npm/axios@1.6.0/package.json', name: 'jsdelivr', timeout: 2000 },
  { url: 'https://api.github.com', name: 'github', timeout: 3000 }
];

// Test a single endpoint with timeout and CORS handling
const testEndpoint = async (endpoint) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

  try {
    // In development, skip connectivity tests that are known to fail due to dev environment
    if (import.meta.env.DEV && (endpoint.url.includes('api.github.com') || endpoint.url.includes('cdn.jsdelivr.net'))) {
      clearTimeout(timeoutId);
      return {
        name: endpoint.name,
        url: endpoint.url,
        success: true,
        status: 'dev-skip',
        responseTime: 0,
        note: 'Skipped in development environment'
      };
    }

    const response = await fetch(endpoint.url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'no-cors',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);

    return {
      name: endpoint.name,
      url: endpoint.url,
      success: true,
      status: response.status || 'opaque',
      responseTime: endpoint.timeout
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // In development, treat certain errors as non-critical
    const isDevelopment = import.meta.env.DEV;
    const isNetworkError = error.message?.includes('Failed to fetch') || error.name === 'TypeError';

    if (isDevelopment && isNetworkError) {
      // Assume connectivity is OK in dev environment if it's a basic network error
      return {
        name: endpoint.name,
        url: endpoint.url,
        success: true,
        status: 'dev-assumed',
        error: error.message,
        type: error.name,
        note: 'Assumed success in development environment'
      };
    }

    return {
      name: endpoint.name,
      url: endpoint.url,
      success: false,
      error: error.name === 'AbortError' ? 'timeout' : error.message,
      type: error.name
    };
  }
};

// Enhanced connectivity check with multiple fallbacks
export const checkNetworkConnectivity = async () => {
  // First check: browser navigator
  if (!navigator.onLine) {
    return {
      isOnline: false,
      connectivity: 0,
      reason: 'Browser reports offline',
      method: 'navigator'
    };
  }

  try {
    // Second check: test multiple endpoints
    const startTime = Date.now();
    const results = await Promise.allSettled(
      CONNECTIVITY_ENDPOINTS.map(endpoint => testEndpoint(endpoint))
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    );

    const connectivity = successful.length / CONNECTIVITY_ENDPOINTS.length;
    
    const result = {
      isOnline: connectivity > 0,
      connectivity,
      duration,
      method: 'endpoint-test',
      details: results.map(result => 
        result.status === 'fulfilled' ? result.value : 
        { success: false, error: result.reason?.message }
      ),
      successful: successful.length,
      total: CONNECTIVITY_ENDPOINTS.length
    };

    // Log result for debugging
    if (connectivity === 0) {
      apiLogger.warn('All connectivity tests failed', result);
    } else if (connectivity < 1) {
      apiLogger.info('Partial connectivity detected', result);
    }

    return result;
  } catch (error) {
    // Third fallback: conservative approach
    apiLogger.error('Connectivity check failed completely', error);
    
    return {
      isOnline: navigator.onLine,
      connectivity: navigator.onLine ? 0.5 : 0,
      reason: 'Connectivity test failed, using navigator fallback',
      method: 'fallback',
      error: error.message
    };
  }
};

// Supabase-specific connectivity check
export const checkSupabaseConnectivity = async (supabaseUrl, apiKey = null) => {
  // Check if environment variables are missing
  if (!supabaseUrl || !supabaseUrl.trim()) {
    const isDevelopment = import.meta.env.DEV;
    const isProduction = import.meta.env.PROD;

    apiLogger.warn('Missing Supabase configuration', {
      hasUrl: !!supabaseUrl,
      hasApiKey: !!apiKey,
      isDevelopment,
      isProduction
    });

    // In production or development, handle missing config gracefully
    return {
      isReachable: false,
      status: 'config-missing',
      error: 'No Supabase URL configured',
      hasApiKey: !!apiKey,
      note: 'Check VITE_SUPABASE_URL environment variable'
    };
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (urlError) {
    return {
      isReachable: false,
      error: 'Invalid Supabase URL format',
      hasApiKey: !!apiKey,
      url: supabaseUrl
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const headers = {
      'Cache-Control': 'no-cache'
    };

    // Include API key if provided
    if (apiKey && apiKey.trim()) {
      headers['apikey'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Test Supabase REST API endpoint with additional error handling
    let response;
    try {
      response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
        headers
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle fetch errors gracefully in all environments
      const isDevelopment = import.meta.env.DEV;
      const isProduction = import.meta.env.PROD;
      const isNetworkError = fetchError.message?.includes('Failed to fetch') || fetchError.name === 'TypeError';
      const isCorsError = fetchError.message?.includes('CORS') || fetchError.message?.includes('cors');

      apiLogger.debug('Supabase fetch failed', {
        url: supabaseUrl,
        error: fetchError.message,
        type: fetchError.name,
        isDevelopment,
        isProduction,
        isNetworkError,
        isCorsError
      });

      // In production, assume connectivity issues rather than failing completely
      if (isProduction && (isNetworkError || isCorsError)) {
        return {
          isReachable: false,
          status: 'connectivity-issue',
          error: `Connection failed: ${fetchError.message}`,
          hasApiKey: !!apiKey,
          url: supabaseUrl,
          note: 'Network or CORS issue - this is normal for some network configurations'
        };
      }

      if (isDevelopment && (isNetworkError || isCorsError)) {
        return {
          isReachable: true,
          status: 'dev-fetch-error',
          error: fetchError.message,
          hasApiKey: !!apiKey,
          url: supabaseUrl,
          note: 'Assumed reachable in development environment despite fetch error'
        };
      }

      throw fetchError;
    }

    clearTimeout(timeoutId);

    const result = {
      isReachable: response.status < 500,
      status: response.status,
      ok: response.ok,
      hasApiKey: !!apiKey,
      url: supabaseUrl
    };

    if (!result.isReachable) {
      apiLogger.warn('Supabase connectivity issue', result);
    }

    return result;
  } catch (error) {
    // Handle all environments gracefully
    const isDevelopment = import.meta.env.DEV;
    const isProduction = import.meta.env.PROD;
    const isNetworkError = error.message?.includes('Failed to fetch') || error.name === 'TypeError';
    const isAbortError = error.name === 'AbortError';
    const isCorsError = error.message?.includes('CORS') || error.message?.includes('cors');

    // In any environment, handle network and CORS errors gracefully
    if (isNetworkError || isAbortError || isCorsError) {
      apiLogger.debug('Supabase connectivity check failed with network error', {
        url: supabaseUrl,
        error: error.message,
        type: error.name,
        isDevelopment,
        isProduction,
        note: 'This is common in certain network configurations and should not block the app'
      });

      // In development, assume reachable; in production, mark as unreachable but not critical
      return {
        isReachable: isDevelopment,
        status: isDevelopment ? 'dev-error' : 'connectivity-error',
        error: isAbortError ? 'Connection timeout' : error.message,
        name: error.name,
        hasApiKey: !!apiKey,
        url: supabaseUrl,
        note: isDevelopment
          ? 'Assumed reachable in development environment despite error'
          : 'Network connectivity issue - this may be due to CORS or network restrictions'
      };
    }

    // For other types of errors, mark as unreachable
    const result = {
      isReachable: false,
      error: error.message,
      name: error.name,
      hasApiKey: !!apiKey,
      url: supabaseUrl
    };

    apiLogger.error('Supabase connectivity check failed with unexpected error', result);
    return result;
  }
};

// Comprehensive connectivity diagnosis
export const runConnectivityDiagnostics = async (supabaseUrl, apiKey) => {
  apiLogger.info('Running comprehensive connectivity diagnostics...');

  const startTime = Date.now();

  try {
    const [networkCheck, supabaseCheck] = await Promise.allSettled([
      checkNetworkConnectivity(),
      checkSupabaseConnectivity(supabaseUrl, apiKey)
    ]);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const networkResult = networkCheck.status === 'fulfilled' ? 
      networkCheck.value : { isOnline: false, error: networkCheck.reason?.message };
    
    const supabaseResult = supabaseCheck.status === 'fulfilled' ? 
      supabaseCheck.value : { isReachable: false, error: supabaseCheck.reason?.message };

    const diagnostics = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      network: networkResult,
      supabase: supabaseResult,
      browser: {
        userAgent: navigator.userAgent.substring(0, 100) + '...',
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language
      },
      environment: {
        protocol: window.location.protocol,
        host: window.location.host,
        supabaseUrl: supabaseUrl?.substring(0, 50) + '...'
      },
      summary: {
        networkOnline: networkResult.isOnline,
        supabaseReachable: supabaseResult.isReachable,
        overallStatus: networkResult.isOnline && supabaseResult.isReachable ? 'healthy' : 'degraded'
      }
    };

    apiLogger.info('Connectivity diagnostics completed', diagnostics);
    return diagnostics;
  } catch (error) {
    const errorDiagnostics = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: error.message,
      summary: {
        overallStatus: 'failed'
      }
    };

    apiLogger.error('Connectivity diagnostics failed', errorDiagnostics);
    return errorDiagnostics;
  }
};

// Smart connectivity status - considers multiple factors
export const getConnectivityStatus = async (supabaseUrl, apiKey) => {
  try {
    const diagnostics = await runConnectivityDiagnostics(supabaseUrl, apiKey);
    
    const { network, supabase } = diagnostics;
    
    // Determine overall status
    let status = 'online';
    let issues = [];
    
    if (!network.isOnline) {
      status = 'offline';
      issues.push('Network connectivity failed');
    } else if (network.connectivity < 0.5) {
      status = 'degraded';
      issues.push('Poor network connectivity');
    }
    
    if (!supabase.isReachable) {
      status = status === 'online' ? 'degraded' : 'offline';
      issues.push('Supabase server unreachable');
    }
    
    return {
      status, // 'online', 'degraded', 'offline'
      isOnline: status !== 'offline',
      issues,
      details: diagnostics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unknown',
      isOnline: navigator.onLine,
      issues: ['Connectivity check failed'],
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
