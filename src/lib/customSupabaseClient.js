/**
 * Professional Supabase Client Configuration
 * Centralized database client with proper error handling and configuration
 */

import { createClient } from '@supabase/supabase-js';
import config from '../config/environment';
import { apiLogger } from './logger';

// Validate configuration
if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Supabase configuration is missing. Please check environment variables.');
}

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

// Error handling wrapper for Supabase operations
export const withErrorHandling = async (operation, context = '') => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    if (result.error) {
      apiLogger.error(`Supabase operation failed: ${context}`, result.error);
      throw new Error(result.error.message || 'Database operation failed');
    }

    apiLogger.debug(`Supabase operation completed: ${context}`, {
      duration: `${duration}ms`,
      count: result.data?.length || (result.data ? 1 : 0)
    });

    return result;
  } catch (error) {
    apiLogger.error(`Supabase operation error: ${context}`, error);
    throw error;
  }
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
