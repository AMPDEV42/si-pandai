/**
 * Centralized error types and user-friendly messages
 */

export const ERROR_TYPES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Authentication errors
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Data errors
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONSTRAINT_ERROR: 'CONSTRAINT_ERROR',
  
  // Application errors
  CHUNK_LOAD_ERROR: 'CHUNK_LOAD_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK_ERROR]: 'Terjadi masalah koneksi. Periksa jaringan internet Anda.',
  [ERROR_TYPES.TIMEOUT_ERROR]: 'Permintaan memakan waktu terlalu lama. Silakan coba lagi.',
  [ERROR_TYPES.AUTH_ERROR]: 'Terjadi masalah autentikasi. Silakan login ulang.',
  [ERROR_TYPES.PERMISSION_ERROR]: 'Anda tidak memiliki izin untuk mengakses fitur ini.',
  [ERROR_TYPES.SESSION_EXPIRED]: 'Sesi Anda telah berakhir. Silakan login ulang.',
  [ERROR_TYPES.NOT_FOUND]: 'Data yang dicari tidak ditemukan.',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Data yang dimasukkan tidak valid.',
  [ERROR_TYPES.CONSTRAINT_ERROR]: 'Operasi tidak dapat dilakukan karena terikat dengan data lain.',
  [ERROR_TYPES.CHUNK_LOAD_ERROR]: 'Gagal memuat komponen. Silakan refresh halaman.',
  [ERROR_TYPES.UNKNOWN_ERROR]: 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
};

export const ERROR_RECOVERY_SUGGESTIONS = {
  [ERROR_TYPES.NETWORK_ERROR]: 'Periksa koneksi internet dan coba lagi.',
  [ERROR_TYPES.TIMEOUT_ERROR]: 'Tunggu beberapa saat dan coba lagi.',
  [ERROR_TYPES.AUTH_ERROR]: 'Logout dan login kembali.',
  [ERROR_TYPES.PERMISSION_ERROR]: 'Hubungi administrator untuk mendapatkan akses.',
  [ERROR_TYPES.SESSION_EXPIRED]: 'Klik tombol login untuk masuk kembali.',
  [ERROR_TYPES.NOT_FOUND]: 'Periksa kembali data yang dicari atau refresh halaman.',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Periksa kembali data yang dimasukkan.',
  [ERROR_TYPES.CONSTRAINT_ERROR]: 'Hapus data terkait terlebih dahulu.',
  [ERROR_TYPES.CHUNK_LOAD_ERROR]: 'Refresh halaman atau hapus cache browser.',
  [ERROR_TYPES.UNKNOWN_ERROR]: 'Hubungi support jika masalah berlanjut.'
};

/**
 * Categorize error based on error object
 */
export const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN_ERROR;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || code === 'network_error') {
    return ERROR_TYPES.NETWORK_ERROR;
  }
  
  if (message.includes('timeout') || code === 'timeout') {
    return ERROR_TYPES.TIMEOUT_ERROR;
  }
  
  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized') || code === '401') {
    return ERROR_TYPES.AUTH_ERROR;
  }
  
  if (message.includes('permission') || message.includes('forbidden') || code === '403') {
    return ERROR_TYPES.PERMISSION_ERROR;
  }
  
  if (message.includes('session') || message.includes('expired') || code === 'session_expired') {
    return ERROR_TYPES.SESSION_EXPIRED;
  }
  
  // Data errors
  if (message.includes('not found') || code === '404' || code === 'pgrst116') {
    return ERROR_TYPES.NOT_FOUND;
  }
  
  if (message.includes('validation') || message.includes('invalid') || code === '422') {
    return ERROR_TYPES.VALIDATION_ERROR;
  }
  
  if (message.includes('constraint') || message.includes('foreign key') || code === '23503') {
    return ERROR_TYPES.CONSTRAINT_ERROR;
  }
  
  // Application errors
  if (error.name === 'ChunkLoadError' || message.includes('chunk')) {
    return ERROR_TYPES.CHUNK_LOAD_ERROR;
  }
  
  return ERROR_TYPES.UNKNOWN_ERROR;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  const errorType = categorizeError(error);
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];
};

/**
 * Get recovery suggestion for error
 */
export const getRecoverySuggestion = (error) => {
  const errorType = categorizeError(error);
  return ERROR_RECOVERY_SUGGESTIONS[errorType] || ERROR_RECOVERY_SUGGESTIONS[ERROR_TYPES.UNKNOWN_ERROR];
};
