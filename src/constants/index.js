/**
 * Professional Application Constants
 * Centralized constant definitions for better maintainability
 */

// Application Information
export const APP_INFO = {
  NAME: 'SIPANDAI',
  FULL_NAME: 'Sistem Informasi Pengajuan Administrasi Digital ASN Terintegrasi',
  VERSION: '1.0.0',
  AUTHOR: 'Alhadi Media Design',
  DESCRIPTION: 'Platform digital untuk memfasilitasi proses pengajuan berbagai jenis usulan administrasi kepegawaian PNS secara efisien dan terintegrasi.'
};

// User Roles
export const USER_ROLES = {
  ADMIN_MASTER: 'admin-master',
  ADMIN_UNIT: 'admin-unit',
  USER: 'user'
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN_MASTER]: 'Admin Master',
  [USER_ROLES.ADMIN_UNIT]: 'Admin Unit',
  [USER_ROLES.USER]: 'Pengguna'
};

// Submission Status
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION: 'revision'
};

export const STATUS_LABELS = {
  [SUBMISSION_STATUS.PENDING]: 'Menunggu',
  [SUBMISSION_STATUS.APPROVED]: 'Disetujui',
  [SUBMISSION_STATUS.REJECTED]: 'Ditolak',
  [SUBMISSION_STATUS.REVISION]: 'Revisi'
};

export const STATUS_COLORS = {
  [SUBMISSION_STATUS.PENDING]: 'bg-yellow-500',
  [SUBMISSION_STATUS.APPROVED]: 'bg-green-500',
  [SUBMISSION_STATUS.REJECTED]: 'bg-red-500',
  [SUBMISSION_STATUS.REVISION]: 'bg-purple-500'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx']
};

// Navigation Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD_ADMIN_MASTER: '/dashboard/admin-master',
  DASHBOARD_ADMIN_UNIT: '/dashboard/admin-unit',
  NEW_SUBMISSION: '/pengajuan/baru',
  SUBMISSION_HISTORY: '/pengajuan/riwayat',
  SUBMISSION_HISTORY_ADMIN: '/pengajuan/riwayat-admin',
  USER_MANAGEMENT: '/manajemen-pengguna',
  REPORTS: '/laporan',
  DOCUMENT_TEMPLATES: '/template-dokumen',
  EMPLOYEE_DATA: '/pegawai'
};

// API Endpoints (for future use)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh'
  },
  SUBMISSIONS: {
    LIST: '/submissions',
    CREATE: '/submissions',
    UPDATE: '/submissions/:id',
    DELETE: '/submissions/:id',
    APPROVE: '/submissions/:id/approve',
    REJECT: '/submissions/:id/reject'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/mark-all-read'
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id'
  }
};

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 254,
    PATTERN: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: false
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s.',-]+$/
  },
  NIP: {
    LENGTH: 18,
    PATTERN: /^\d{18}$/
  },
  PHONE: {
    PATTERN: /^(\+62|62|0)[8][1-9][0-9]{6,9}$/
  }
};

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  LOADING_DELAY: 200,
  NOTIFICATION_REFRESH_INTERVAL: 30000,
  MAX_NOTIFICATIONS_DISPLAY: 50,
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  ITEMS_PER_PAGE: 10
};

// Storage Keys
export const STORAGE_KEYS = {
  SUBMISSIONS: 'sipandai_submissions',
  USER_PREFERENCES: 'sipandai_user_preferences',
  THEME: 'sipandai_theme',
  LANGUAGE: 'sipandai_language'
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Terjadi kesalahan yang tidak terduga',
  NETWORK: 'Koneksi bermasalah. Silakan periksa internet Anda',
  UNAUTHORIZED: 'Anda tidak memiliki akses untuk melakukan aksi ini',
  VALIDATION: 'Data yang dimasukkan tidak valid',
  FILE_TOO_LARGE: 'Ukuran file terlalu besar',
  FILE_TYPE_NOT_ALLOWED: 'Tipe file tidak diizinkan',
  REQUIRED_FIELD: 'Field ini wajib diisi'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login berhasil',
  LOGOUT: 'Logout berhasil',
  SAVE: 'Data berhasil disimpan',
  UPDATE: 'Data berhasil diperbarui',
  DELETE: 'Data berhasil dihapus',
  UPLOAD: 'File berhasil diunggah',
  SUBMIT: 'Pengajuan berhasil dikirim'
};

export default {
  APP_INFO,
  USER_ROLES,
  ROLE_LABELS,
  SUBMISSION_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  NOTIFICATION_TYPES,
  FILE_UPLOAD,
  ROUTES,
  API_ENDPOINTS,
  VALIDATION_RULES,
  UI_CONSTANTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
