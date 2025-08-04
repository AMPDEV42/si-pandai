import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import debug tools in development (only when debugging is explicitly needed)
if (import.meta.env.DEV && window.location.search.includes('debug=true')) {
  import('./debug/testGoogleDomain.js').then(() => {
    console.log('🧪 Google Drive debug tools loaded');
  });

  // Quick Supabase test for debugging API key issues
  import('./utils/quickSupabaseTest.js').then(() => {
    console.log('🔧 Supabase test tools loaded');
  });

  // Debug Supabase connection
  import('./utils/debugSupabaseConnection.js').then(() => {
    console.log('🔍 Supabase connection debug loaded');
  });

  // Enhanced Supabase fetch test
  import('./lib/supabaseFetchWrapper.js').then(() => {
    console.log('🔧 Enhanced Supabase fetch test loaded');
  });
} else if (import.meta.env.DEV) {
  console.log('💡 Add ?debug=true to URL to enable debug tools');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
