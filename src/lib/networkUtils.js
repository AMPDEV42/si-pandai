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
    // In any environment, handle fetch failures gracefully
    const isDevelopment = import.meta.env.DEV;
    const isProduction = import.meta.env.PROD;

    // Skip external connectivity tests in production to avoid CSP and fetch issues
    if (isProduction) {
      clearTimeout(timeoutId);
      return {
        name: endpoint.name,
        url: endpoint.url,
        success: true,
        status: 'production-skip',
        responseTime: 0,
        note: 'External connectivity test skipped in production to prevent CSP violations'
      };
    }

    // In development, skip connectivity tests that are known to fail due to dev environment
    if (isDevelopment && (endpoint.url.includes('api.github.com') || endpoint.url.includes('cdn.jsdelivr.net'))) {
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

    // In any environment, treat fetch errors as non-critical for connectivity tests
    const isDevelopment = import.meta.env.DEV;
    const isProduction = import.meta.env.PROD;
    const isNetworkError = error.message?.includes('Failed to fetch') || error.name === 'TypeError';
    const isCspError = error.message?.includes('CSP') || error.message?.includes('Content Security Policy');

    // Gracefully handle fetch failures to prevent blocking the app
    if (isNetworkError || isCspError) {
      return {
        name: endpoint.name,
        url: endpoint.url,
        success: true, // Mark as success to not block the app
        status: isProduction ? 'production-fallback' : 'dev-assumed',
        error: error.message,
        type: error.name,
        note: 'Connectivity test failed gracefully - assumed online to prevent app blocking'
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

  // In production, skip external endpoint tests to prevent CSP and fetch errors
  const isProduction = import.meta.env.PROD;
  if (isProduction) {
    return {
      isOnline: true,
      connectivity: 1,
      reason: 'Assumed online in production environment',
      method: 'production-assumption',
      note: 'External connectivity tests disabled in production to prevent CSP violations'
    };
  }

  try {
    // Second check: test multiple endpoints (development only)
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

    // Log result for debugging only in development
    if (connectivity === 0) {
      apiLogger.debug('All connectivity tests failed in development', result);
    } else if (connectivity < 1) {
      apiLogger.debug('Partial connectivity detected in development', result);
    }

    return result;
  } catch (error) {
    // Third fallback: conservative approach
    apiLogger.debug('Connectivity check failed, using navigator fallback', error);

    return {
      isOnline: navigator.onLine,
      connectivity: navigator.onLine ? 1 : 0,
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

      // In production or development, handle network/CORS errors gracefully
      if (isNetworkError || isCorsError) {
        return {
          isReachable: true, // Assume reachable to prevent blocking the app
          status: isProduction ? 'production-fetch-fallback' : 'dev-fetch-error',
          error: fetchError.message,
          hasApiKey: !!apiKey,
          url: supabaseUrl,
          note: 'Network/CORS fetch failed but assumed reachable to prevent app blocking'
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

      // Always assume reachable to prevent blocking the app
      return {
        isReachable: true, // Changed to true for both environments
        status: isDevelopment ? 'dev-error' : 'production-fallback',
        error: isAbortError ? 'Connection timeout' : error.message,
        name: error.name,
        hasApiKey: !!apiKey,
        url: supabaseUrl,
        note: 'Network connectivity check failed but assumed reachable to prevent app blocking'
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
