/**
 * Quick Supabase Test - Test API key and connection immediately
 */

import { supabase } from '../lib/customSupabaseClient';
import { config } from '../config/environment';

export const testSupabaseApiKey = async () => {
  console.log('🔧 Testing Supabase API Key...');
  
  // Check environment variables
  console.log('Environment check:', {
    hasUrl: !!config.supabase.url,
    hasAnonKey: !!config.supabase.anonKey,
    url: config.supabase.url?.substring(0, 30) + '...',
    anonKeyLength: config.supabase.anonKey?.length
  });

  try {
    // Test 1: Simple auth session check (should work with valid API key)
    console.log('📡 Testing auth session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Auth test failed:', sessionError);
      return { success: false, error: sessionError.message };
    }

    console.log('✅ Auth test passed - API key working');

    // Test 2: Simple database query (test the REST API)
    console.log('📊 Testing database query...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Database test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Database test passed - REST API working');

    return { 
      success: true, 
      message: 'Supabase API key and connection working correctly',
      sessionExists: !!sessionData?.session,
      canQueryDatabase: true
    };

  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-run test when module loads (for debugging)
if (import.meta.env.DEV) {
  setTimeout(() => {
    testSupabaseApiKey().then(result => {
      console.log('🧪 Supabase Test Result:', result);
    });
  }, 1000);
}
