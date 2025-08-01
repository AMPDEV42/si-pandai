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

  // Test multiple reliable endpoints
  const endpoints = [
    'https://www.google.com/favicon.ico',
    'https://cdn.jsdelivr.net/npm/axios@1.6.0/package.json',
    'https://api.github.com',
    'https://jsonplaceholder.typicode.com/posts/1'
  ];

  const testEndpoint = async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'no-cors' // Allow cross-origin requests
      });

      clearTimeout(timeoutId);
      return { success: true, url };
    } catch (error) {
      return {
        success: false,
        url,
        error: error.name === 'AbortError' ? 'timeout' : error.message
      };
    }
  };

  try {
    // Test endpoints in parallel with shorter timeout
    const results = await Promise.allSettled(
      endpoints.map(endpoint => testEndpoint(endpoint))
    );

    const successfulTests = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length;

    const connectivity = successfulTests / endpoints.length;

    return {
      isOnline: connectivity > 0,
      connectivity,
      responseTime: connectivity > 0.5 ? 'fast' : 'slow',
      testedEndpoints: endpoints.length,
      successfulTests
    };
  } catch (error) {
    // Fallback: assume online if navigator says so
    return {
      isOnline: navigator.onLine,
      connectivity: navigator.onLine ? 0.5 : 0,
      reason: 'Network test failed, using navigator.onLine',
      fallback: true
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
