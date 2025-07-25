import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import debug tools in development
if (import.meta.env.DEV) {
  import('./debug/testGoogleDomain.js').then(() => {
    console.log('🧪 Google Drive debug tools loaded');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
