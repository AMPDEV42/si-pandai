/**
 * Professional Data Validation and Sanitization
 * Provides comprehensive input validation and sanitization
 */

import config from '../config/environment';
import { logger } from './logger';

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// NIP validation regex (18 digits)
const NIP_REGEX = /^\d{18}$/;

// Indonesian phone number regex
const PHONE_REGEX = /^(\+62|62|0)[8][1-9][0-9]{6,9}$/;

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Sanitizes string input by removing dangerous characters
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove basic XSS vectors
    .replace(/\0/g, '') // Remove null bytes
    .slice(0, 1000); // Limit length
};

/**
 * Sanitizes HTML content (basic protection)
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validates email address
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email');
  }
  
  const sanitized = sanitizeString(email).toLowerCase();
  
  if (!EMAIL_REGEX.test(sanitized)) {
    throw new ValidationError('Format email tidak valid', 'email');
  }
  
  if (sanitized.length > 254) {
    throw new ValidationError('Email terlalu panjang', 'email');
  }
  
  return sanitized;
};

/**
 * Validates password strength
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'password');
  }
  
  if (password.length < 8) {
    throw new ValidationError('Password minimal 8 karakter', 'password');
  }
  
  if (password.length > 128) {
    throw new ValidationError('Password maksimal 128 karakter', 'password');
  }
  
  // Check for basic strength requirements
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
  
  if (!hasLower || !hasUpper || !hasDigit) {
    throw new ValidationError(
      'Password harus mengandung huruf besar, huruf kecil, dan angka',
      'password'
    );
  }
  
  return password;
};

/**
 * Validates NIP (Nomor Induk Pegawai)
 */
export const validateNIP = (nip) => {
  if (!nip || typeof nip !== 'string') {
    throw new ValidationError('NIP is required', 'nip');
  }
  
  const sanitized = sanitizeString(nip).replace(/\s/g, '');
  
  if (!NIP_REGEX.test(sanitized)) {
    throw new ValidationError('Format NIP tidak valid (harus 18 digit)', 'nip');
  }
  
  return sanitized;
};

/**
 * Validates Indonesian phone number
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Nomor telepon is required', 'phone');
  }
  
  const sanitized = sanitizeString(phone).replace(/[\s-()]/g, '');
  
  if (!PHONE_REGEX.test(sanitized)) {
    throw new ValidationError(
      'Format nomor telepon tidak valid (contoh: 08123456789)',
      'phone'
    );
  }
  
  return sanitized;
};

/**
 * Validates name (Indonesian names)
 */
export const validateName = (name, fieldName = 'name') => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 2) {
    throw new ValidationError(`${fieldName} minimal 2 karakter`, fieldName);
  }
  
  if (sanitized.length > 100) {
    throw new ValidationError(`${fieldName} maksimal 100 karakter`, fieldName);
  }
  
  // Indonesian name pattern (letters, spaces, dots, apostrophes)
  const namePattern = /^[a-zA-Z\s.',-]+$/;
  if (!namePattern.test(sanitized)) {
    throw new ValidationError(
      `${fieldName} hanya boleh mengandung huruf, spasi, titik, dan tanda kutip`,
      fieldName
    );
  }
  
  return sanitized;
};

/**
 * Validates file upload
 */
export const validateFile = (file) => {
  if (!file || !file.size || !file.type) {
    throw new ValidationError('File tidak valid', 'file');
  }
  
  // Check file size
  if (file.size > config.security.maxFileSize) {
    const maxSizeMB = Math.round(config.security.maxFileSize / (1024 * 1024));
    throw new ValidationError(
      `Ukuran file maksimal ${maxSizeMB}MB`,
      'file'
    );
  }
  
  // Check file type
  if (!config.security.allowedFileTypes.includes(file.type)) {
    throw new ValidationError(
      'Tipe file tidak diizinkan. Gunakan PDF, DOC, DOCX, JPG, PNG, atau GIF',
      'file'
    );
  }
  
  // Check filename for security
  const filename = sanitizeString(file.name);
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new ValidationError('Nama file tidak valid', 'file');
  }
  
  return true;
};

/**
 * Validates submission form data
 */
export const validateSubmissionForm = (formData) => {
  const errors = {};
  
  try {
    // Validate personal info
    if (formData.personalInfo) {
      const { fullName, nip, unit, position, phone } = formData.personalInfo;
      
      if (fullName) validateName(fullName, 'Nama lengkap');
      if (nip) validateNIP(nip);
      if (unit) validateName(unit, 'Unit kerja');
      if (position) validateName(position, 'Jabatan');
      if (phone) validatePhone(phone);
    }
    
    // Validate title
    if (formData.title) {
      const title = sanitizeString(formData.title);
      if (title.length < 5) {
        errors.title = 'Judul minimal 5 karakter';
      }
      if (title.length > 200) {
        errors.title = 'Judul maksimal 200 karakter';
      }
    }
    
    // Validate notes
    if (formData.notes) {
      const notes = sanitizeString(formData.notes);
      if (notes.length > 2000) {
        errors.notes = 'Catatan maksimal 2000 karakter';
      }
    }
    
    // Validate files
    if (formData.files && Array.isArray(formData.files)) {
      formData.files.forEach((file, index) => {
        try {
          validateFile(file);
        } catch (error) {
          errors[`file_${index}`] = error.message;
        }
      });
    }
    
  } catch (error) {
    if (error instanceof ValidationError) {
      errors[error.field] = error.message;
    } else {
      logger.error('Validation error', error);
      errors.general = 'Terjadi kesalahan validasi';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates user registration data
 */
export const validateUserRegistration = (userData) => {
  const errors = {};
  
  try {
    validateEmail(userData.email);
  } catch (error) {
    errors.email = error.message;
  }
  
  try {
    validatePassword(userData.password);
  } catch (error) {
    errors.password = error.message;
  }
  
  try {
    validateName(userData.fullName, 'Nama lengkap');
  } catch (error) {
    errors.fullName = error.message;
  }
  
  // Validate role
  const validRoles = ['admin-master', 'admin-unit', 'user'];
  if (!validRoles.includes(userData.role)) {
    errors.role = 'Role tidak valid';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  sanitizeString,
  sanitizeHtml,
  validateEmail,
  validatePassword,
  validateNIP,
  validatePhone,
  validateName,
  validateFile,
  validateSubmissionForm,
  validateUserRegistration,
  ValidationError
};
