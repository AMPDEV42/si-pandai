/**
 * Network Connectivity Checker
 * Provides utilities to check network status and handle connection issues
 */

import { apiLogger } from './logger';

// Simple connectivity check
export const isOnline = () => {
  return navigator.onLine;
};

// Enhanced connectivity check with actual network test
export const checkNetworkConnectivity = async () => {
  if (!navigator.onLine) {
    return {
      isOnline: false,
      connectivity: 0,
      reason: 'Navigator reports offline'
    };
  }

  try {
    // Test with a simple, fast endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://httpbin.org/status/200', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);

    return {
      isOnline: response.ok,
      connectivity: response.ok ? 1 : 0,
      responseTime: response.ok ? 'fast' : 'slow'
    };
  } catch (error) {
    return {
      isOnline: false,
      connectivity: 0,
      reason: error.name === 'AbortError' ? 'timeout' : error.message
    };
  }
};

// Supabase specific connectivity check
export const checkSupabaseConnectivity = async (supabaseUrl, apiKey = null) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const headers = {
      'Cache-Control': 'no-cache'
    };

    // Include API key if provided
    if (apiKey) {
      headers['apikey'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Try to reach Supabase health endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
      headers
    });

    clearTimeout(timeoutId);

    return {
      isReachable: response.status < 500, // Accept even 401/403 as reachable
      status: response.status,
      ok: response.ok,
      hasApiKey: !!apiKey
    };
  } catch (error) {
    apiLogger.error('Supabase connectivity check failed', error);
    return {
      isReachable: false,
      error: error.message,
      name: error.name,
      hasApiKey: !!apiKey
    };
  }
};

// Network event listeners
export const setupNetworkListeners = (onOnline, onOffline) => {
  const handleOnline = () => {
    apiLogger.info('Network connection restored');
    onOnline?.();
  };

  const handleOffline = () => {
    apiLogger.warn('Network connection lost');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Retry with exponential backoff for network operations
export const retryWithBackoff = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Check if error is network-related
      const isNetworkError = 
        error.name === 'TypeError' ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('connection');

      if (!isNetworkError) {
        // Don't retry non-network errors
        throw error;
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      apiLogger.warn(`Network operation failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        error: error.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
