/**
 * Simple Supabase Fetch Test Component
 * Tests fetch requests to diagnose connection issues
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/customSupabaseClient';
import { config } from '../../config/environment';

const SupabaseFetchTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName, testFunction) => {
    try {
      console.log(`🧪 Running ${testName}...`);
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, ...result }
      }));
      console.log(`✅ ${testName} passed:`, result);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
      console.error(`❌ ${testName} failed:`, error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});

    // Test 1: Direct fetch to Supabase REST API
    await runTest('directFetch', async () => {
      const response = await fetch(`${config.supabase.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': config.supabase.anonKey,
          'Authorization': `Bearer ${config.supabase.anonKey}`
        }
      });

      return {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      };
    });

    // Test 2: Supabase client auth test
    await runTest('supabaseAuth', async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return {
        hasSession: !!data?.session,
        user: data?.session?.user?.email || 'No user logged in'
      };
    });

    // Test 3: Simple database query
    await runTest('databaseQuery', async () => {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .limit(1);

      if (error) throw error;

      return {
        dataCount: data?.length || 0,
        totalCount: count,
        hasData: !!data?.length
      };
    });

    setIsRunning(false);
  };

  const getStatusBadge = (result) => {
    if (!result) return <Badge className="bg-gray-500/20 text-gray-400">Not tested</Badge>;
    
    return result.success ? 
      <Badge className="bg-green-500/20 text-green-400">Pass</Badge> :
      <Badge className="bg-red-500/20 text-red-400">Fail</Badge>;
  };

  return (
    <Card className="border-white/20 bg-white/5">
      <CardHeader>
        <CardTitle className="text-white">Supabase Fetch Tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>

        {/* Test Results */}
        <div className="space-y-3">
          {[
            { key: 'directFetch', label: 'Direct REST API Fetch' },
            { key: 'supabaseAuth', label: 'Supabase Auth Test' },
            { key: 'databaseQuery', label: 'Database Query Test' }
          ].map(({ key, label }) => {
            const result = testResults[key];
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded border border-white/10">
                <span className="text-sm text-gray-300">{label}</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result)}
                  {result && !result.success && (
                    <span className="text-xs text-red-400 max-w-xs truncate">
                      {result.error}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration Info */}
        <div className="mt-4 p-3 rounded bg-white/5 border border-white/10">
          <h4 className="text-sm font-medium text-white mb-2">Configuration</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <div>URL: {config.supabase.url}</div>
            <div>API Key: {config.supabase.anonKey ? 'Present' : 'Missing'} ({config.supabase.anonKey?.length} chars)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseFetchTest;
