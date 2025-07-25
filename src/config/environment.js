/**
 * Professional Environment Configuration Management
 * Centralizes all environment variables and provides type checking
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const optionalEnvVars = [
  'VITE_EMAIL_HOST',
  'VITE_EMAIL_PORT',
  'VITE_EMAIL_USER',
  'VITE_EMAIL_PASSWORD',
  'VITE_GOOGLE_DRIVE_API_KEY',
  'VITE_GOOGLE_DRIVE_CLIENT_ID'
];

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Validate environment on module load
validateEnvironment();

export const config = {
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Application
  app: {
    name: 'SIPANDAI',
    fullName: 'Sistem Informasi Pengajuan Administrasi Digital ASN Terintegrasi',
    version: '1.0.0',
    author: 'Alhadi Media Design'
  },
  
  // Database
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Email Service
  email: {
    host: import.meta.env.VITE_EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(import.meta.env.VITE_EMAIL_PORT || '587'),
    user: import.meta.env.VITE_EMAIL_USER || '',
    password: import.meta.env.VITE_EMAIL_PASSWORD || '',
    enabled: !!(import.meta.env.VITE_EMAIL_USER && import.meta.env.VITE_EMAIL_PASSWORD)
  },

  // Google Drive Integration
  googleDrive: {
    apiKey: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '',
    clientId: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || '',
    scope: 'https://www.googleapis.com/auth/drive.file',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    enabled: !!(import.meta.env.VITE_GOOGLE_DRIVE_API_KEY && import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID)
  },
  
  // Security
  security: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // UI/UX
  ui: {
    toastDuration: 5000,
    loadingDelay: 200,
    notificationRefreshInterval: 30000,
    maxNotificationsDisplay: 50
  },
  
  // Development
  dev: {
    enableDevTools: import.meta.env.DEV,
    logLevel: import.meta.env.DEV ? 'debug' : 'error',
    mockData: import.meta.env.DEV
  }
};

export default config;
