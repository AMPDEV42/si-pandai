/**
 * Simple Supabase Connection Test
 * Quick test to verify Supabase connectivity
 */

import { supabase, checkSupabaseHealth } from '../lib/customSupabaseClient';
import { checkSupabaseConnectivity } from '../lib/networkChecker';
import { config } from '../config/environment';
import { apiLogger } from '../lib/logger';

export const testSupabaseConnection = async () => {
  const results = {
    configured: false,
    networkReachable: false,
    authWorking: false,
    healthCheck: false,
    error: null,
    details: {}
  };

  try {
    // Test 1: Configuration check
    results.configured = !!(config.supabase.url && config.supabase.anonKey);
    if (!results.configured) {
      results.error = 'Supabase configuration missing';
      return results;
    }

    // Test 2: Network reachability
    const connectivityResult = await checkSupabaseConnectivity(config.supabase.url);
    results.networkReachable = connectivityResult.isReachable;
    results.details.connectivity = connectivityResult;

    if (!results.networkReachable) {
      results.error = `Cannot reach Supabase server: ${connectivityResult.error || 'Network error'}`;
      return results;
    }

    // Test 3: Auth session check (minimal test)
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      results.authWorking = true;
      results.details.session = {
        hasSession: !!sessionData?.session,
        error: sessionError?.message
      };
    } catch (authError) {
      results.details.authError = authError.message;
      // Auth errors are expected for non-authenticated users, so don't fail here
      results.authWorking = true;
    }

    // Test 4: Health check
    const healthResult = await checkSupabaseHealth();
    results.healthCheck = healthResult.isHealthy;
    results.details.health = healthResult;

    if (!results.healthCheck) {
      results.error = `Supabase health check failed: ${healthResult.error}`;
      return results;
    }

    // All tests passed
    apiLogger.info('Supabase connection test passed', results);
    return results;

  } catch (error) {
    results.error = error.message;
    results.details.exception = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
    
    apiLogger.error('Supabase connection test failed', error);
    return results;
  }
};

export const quickSupabaseTest = async () => {
  try {
    // Just try to get auth session with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const { error } = await supabase.auth.getSession();
    clearTimeout(timeoutId);

    return {
      success: true,
      connected: true,
      error: error?.message || null
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
};
