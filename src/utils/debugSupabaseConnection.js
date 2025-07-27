/**
 * Debug Supabase Connection
 * Direct test untuk diagnose connection issues
 */

import { supabase } from '../lib/customSupabaseClient';
import { config } from '../config/environment';

export const debugSupabaseConnection = async () => {
  console.log('🔍 Starting Supabase connection debug...');
  
  // Step 1: Check configuration
  console.log('📋 Configuration check:', {
    url: config.supabase.url,
    hasAnonKey: !!config.supabase.anonKey,
    anonKeyLength: config.supabase.anonKey?.length,
    anonKeyStart: config.supabase.anonKey?.substring(0, 20) + '...'
  });

  // Step 2: Test direct fetch to Supabase
  console.log('🌐 Testing direct fetch to Supabase REST API...');
  
  try {
    const response = await fetch(`${config.supabase.url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': config.supabase.anonKey,
        'Authorization': `Bearer ${config.supabase.anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Direct fetch response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct fetch error response:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log('✅ Direct fetch successful');

  } catch (error) {
    console.error('❌ Direct fetch failed:', error);
    return { success: false, error: error.message };
  }

  // Step 3: Test Supabase client auth
  console.log('🔐 Testing Supabase client auth...');
  
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Auth test failed:', sessionError);
      return { success: false, error: sessionError.message };
    }

    console.log('✅ Auth test passed:', {
      hasSession: !!sessionData?.session,
      user: sessionData?.session?.user?.email || 'No user'
    });

  } catch (error) {
    console.error('❌ Auth test exception:', error);
    return { success: false, error: error.message };
  }

  // Step 4: Test simple database query
  console.log('📊 Testing database query...');
  
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('❌ Database query failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Database query successful:', {
      dataCount: data?.length || 0,
      totalCount: count,
      sampleData: data?.[0] || 'No data'
    });

  } catch (error) {
    console.error('❌ Database query exception:', error);
    return { success: false, error: error.message };
  }

  console.log('🎉 All Supabase tests passed!');
  return { success: true, message: 'Supabase connection working correctly' };
};

// Auto-run dalam development
if (import.meta.env.DEV) {
  setTimeout(() => {
    debugSupabaseConnection().then(result => {
      console.log('🧪 Supabase Debug Result:', result);
    });
  }, 2000);
}
