/**
 * Professional Supabase Client Configuration
 * Centralized database client with proper error handling and configuration
 */

import { createClient } from '@supabase/supabase-js';
import config from '../config/environment';
import { apiLogger } from './logger';

// Validate configuration
if (!config.supabase.url || !config.supabase.anonKey) {
  apiLogger.error('Supabase configuration missing', {
    hasUrl: !!config.supabase.url,
    hasAnonKey: !!config.supabase.anonKey,
    urlPrefix: config.supabase.url?.substring(0, 30) + '...',
    anonKeyPrefix: config.supabase.anonKey?.substring(0, 20) + '...'
  });
  throw new Error('Supabase configuration is missing. Please check environment variables.');
}

// Log successful configuration (without exposing sensitive data)
apiLogger.debug('Supabase client configured', {
  url: config.supabase.url.substring(0, 30) + '...',
  hasAnonKey: !!config.supabase.anonKey,
  anonKeyLength: config.supabase.anonKey.length
});

// Professional Supabase client configuration
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'sipandai-auth-token',
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': `${config.app.name}@${config.app.version}`
    }
  }
};

// Create Supabase client with professional configuration
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  supabaseConfig
);

// Test client immediately after creation in development
if (config.isDevelopment) {
  console.log('🔧 Supabase client created with:', {
    url: config.supabase.url.substring(0, 30) + '...',
    hasAnonKey: !!config.supabase.anonKey,
    client: !!supabase
  });
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelay: 500,
  maxDelay: 3000,
  backoffFactor: 2
};

// Check if error is retryable
const isRetryableError = (error) => {
  const retryableErrors = [
    'Failed to fetch',
    'Network request failed',
    'TypeError: fetch failed',
    'TypeError: Failed to fetch',
    'Connection reset',
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ENETUNREACH',
    'ECONNREFUSED',
    'Load failed',
    'fetch failed',
    'NetworkError',
    'AbortError',
    'TimeoutError'
  ];

  const errorMessage = error?.message || error?.toString() || '';
  const errorName = error?.name || '';

  return retryableErrors.some(retryableError =>
    errorMessage.toLowerCase().includes(retryableError.toLowerCase()) ||
    errorName.toLowerCase().includes(retryableError.toLowerCase())
  ) || error instanceof TypeError;
};

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced error handling wrapper with retry logic
export const withErrorHandling = async (operation, context = '') => {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      // Check for Supabase error in result
      if (result?.error) {
        const error = new Error(result.error.message || 'Database operation failed');
        error.supabaseError = result.error;
        error.code = result.error.code;

        // Log specific API key error
        if (result.error.message?.includes('No API key')) {
          apiLogger.error(`Supabase API key missing: ${context}`, {
            error: result.error,
            hint: result.error.hint
          });
        }

        // Don't retry API key errors or authentication errors
        if (result.error.message?.includes('No API key') ||
            result.error.message?.includes('Invalid API key') ||
            result.error.code === 'invalid_api_key') {
          throw error;
        }

        // Check if this is a retryable Supabase error
        if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
          const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt),
            RETRY_CONFIG.maxDelay
          );

          apiLogger.warn(`Supabase operation failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}): ${context}`, {
            error: result.error,
            retryIn: `${delay}ms`
          });

          await sleep(delay);
          continue;
        }

        apiLogger.error(`Supabase operation failed: ${context}`, result.error);
        throw error;
      }

      if (attempt > 0) {
        apiLogger.info(`Supabase operation succeeded after ${attempt + 1} attempts: ${context}`, {
          duration: `${duration}ms`,
          count: result?.data?.length || (result?.data ? 1 : 0)
        });
      } else {
        apiLogger.debug(`Supabase operation completed: ${context}`, {
          duration: `${duration}ms`,
          count: result?.data?.length || (result?.data ? 1 : 0)
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if it's a response body already read error
      if (error.message?.includes('body stream already read')) {
        apiLogger.error(`Response body already consumed: ${context}`, {
          error: error.message,
          stack: error.stack
        });
        break;
      }

      // Check if this is a retryable network error
      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt),
          RETRY_CONFIG.maxDelay
        );

        apiLogger.warn(`Network error on attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}: ${context}`, {
          error: error.message,
          retryIn: `${delay}ms`,
          isNetworkError: true
        });

        await sleep(delay);
        continue;
      }

      // Final attempt failed or non-retryable error
      break;
    }
  }

  // All retries exhausted
  apiLogger.error(`Supabase operation error after ${RETRY_CONFIG.maxRetries + 1} attempts: ${context}`, {
    error: lastError?.message,
    stack: lastError?.stack,
    isNetworkError: isRetryableError(lastError)
  });

  throw lastError;
};

// Network connectivity checker
export const checkNetworkConnectivity = async () => {
  try {
    // Test connectivity with more reliable endpoints and shorter timeout
    const endpoints = [
      { url: 'https://www.google.com/favicon.ico', name: 'google' },
      { url: 'https://cdn.jsdelivr.net/npm/axios@1.6.0/package.json', name: 'jsdelivr' },
      { url: 'https://api.github.com', name: 'github' }
    ];

    const testWithTimeout = async (endpoint) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Shorter timeout

      try {
        const response = await fetch(endpoint.url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors' // Allow cross-origin
        });
        clearTimeout(timeoutId);
        return { name: endpoint.name, success: true };
      } catch (error) {
        clearTimeout(timeoutId);
        return {
          name: endpoint.name,
          success: false,
          error: error.name === 'AbortError' ? 'timeout' : error.message
        };
      }
    };

    const results = await Promise.allSettled(
      endpoints.map(endpoint => testWithTimeout(endpoint))
    );

    const successCount = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length;

    return {
      isOnline: successCount > 0,
      connectivity: successCount / endpoints.length,
      details: results.map(result =>
        result.status === 'fulfilled' ? result.value :
        { name: 'unknown', success: false, error: result.reason?.message }
      )
    };
  } catch (error) {
    // Fallback to navigator.onLine
    return {
      isOnline: navigator.onLine,
      connectivity: navigator.onLine ? 0.5 : 0,
      error: error.message,
      fallback: true
    };
  }
};

// Supabase health check
export const checkSupabaseHealth = async () => {
  try {
    const startTime = Date.now();

    // Simple health check - try to connect to auth
    const { data, error } = await supabase.auth.getSession();
    const duration = Date.now() - startTime;

    if (error && !error.message.includes('session') && !error.message.includes('Auth session missing')) {
      throw error;
    }

    return {
      isHealthy: true,
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Comprehensive connectivity diagnostics
export const runConnectivityDiagnostics = async () => {
  apiLogger.info('Running connectivity diagnostics...');

  const [networkCheck, supabaseCheck] = await Promise.all([
    checkNetworkConnectivity(),
    checkSupabaseHealth()
  ]);

  const diagnostics = {
    timestamp: new Date().toISOString(),
    network: networkCheck,
    supabase: supabaseCheck,
    browser: {
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled
    },
    environment: {
      protocol: window.location.protocol,
      host: window.location.host,
      supabaseUrl: config.supabase.url
    }
  };

  apiLogger.info('Connectivity diagnostics completed', diagnostics);
  return diagnostics;
};

// Helper functions for common operations
export const supabaseHelpers = {
  // Safe select with error handling
  async safeSelect(table, query = '*', filters = {}) {
    return withErrorHandling(async () => {
      let builder = supabase.from(table).select(query);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          builder = builder.eq(key, value);
        }
      });

      return await builder;
    }, `SELECT from ${table}`);
  },

  // Safe insert with error handling
  async safeInsert(table, data) {
    return withErrorHandling(async () => {
      return await supabase.from(table).insert(data).select();
    }, `INSERT into ${table}`);
  },

  // Safe update with error handling
  async safeUpdate(table, id, data) {
    return withErrorHandling(async () => {
      return await supabase.from(table).update(data).eq('id', id).select();
    }, `UPDATE ${table}`);
  },

  // Safe delete with error handling
  async safeDelete(table, id) {
    return withErrorHandling(async () => {
      return await supabase.from(table).delete().eq('id', id);
    }, `DELETE from ${table}`);
  }
};

export default supabase;
