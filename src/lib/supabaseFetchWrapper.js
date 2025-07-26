/**
 * Enhanced Fetch Wrapper for Supabase
 * Provides better error handling and debugging for Supabase requests
 */

import { apiLogger } from './logger';
import { config } from '../config/environment';

// Create enhanced fetch function for Supabase
export const createSupabaseFetch = () => {
  return async (url, options = {}) => {
    try {
      // Ensure API key is always included
      const headers = {
        'apikey': config.supabase.anonKey,
        'Authorization': `Bearer ${config.supabase.anonKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Create request with proper headers
      const fetchOptions = {
        ...options,
        headers
      };

      apiLogger.debug('Supabase fetch request', {
        url: url.substring(0, 100) + '...',
        method: options.method || 'GET',
        hasApiKey: !!headers.apikey,
        headersCount: Object.keys(headers).length
      });

      const response = await fetch(url, fetchOptions);

      // Log response details
      apiLogger.debug('Supabase fetch response', {
        url: url.substring(0, 100) + '...',
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage;
        try {
          const errorText = await response.text();
          errorMessage = errorText;
          apiLogger.error('Supabase fetch error response', {
            url: url.substring(0, 100) + '...',
            status: response.status,
            error: errorText
          });
        } catch (textError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          apiLogger.error('Supabase fetch error (no body)', {
            url: url.substring(0, 100) + '...',
            status: response.status,
            statusText: response.statusText
          });
        }

        throw new Error(`Supabase request failed: ${errorMessage}`);
      }

      return response;

    } catch (error) {
      apiLogger.error('Supabase fetch exception', {
        url: url.substring(0, 100) + '...',
        error: error.message,
        name: error.name,
        stack: error.stack
      });

      // Re-throw with enhanced error message
      throw new Error(`Supabase fetch failed: ${error.message}`);
    }
  };
};

// Test function to verify Supabase connectivity
export const testSupabaseFetch = async () => {
  const supabaseFetch = createSupabaseFetch();
  
  try {
    console.log('🧪 Testing enhanced Supabase fetch...');
    
    // Test HEAD request to REST API
    const response = await supabaseFetch(`${config.supabase.url}/rest/v1/`, {
      method: 'HEAD'
    });

    console.log('✅ Enhanced Supabase fetch test passed:', {
      status: response.status,
      ok: response.ok
    });

    return { success: true, status: response.status };

  } catch (error) {
    console.error('❌ Enhanced Supabase fetch test failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-test in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    testSupabaseFetch().then(result => {
      console.log('🔧 Enhanced Supabase Fetch Test Result:', result);
    });
  }, 3000);
}
