/**
 * Professional Logging System
 * Provides structured logging with different levels and contexts
 */

import config from '../config/environment';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3
};

const getCurrentLogLevel = () => {
  if (config.isProduction) return LOG_LEVELS.ERROR;
  if (config.dev.logLevel === 'debug') return LOG_LEVELS.DEBUG;
  if (config.dev.logLevel === 'info') return LOG_LEVELS.INFO;
  if (config.dev.logLevel === 'warn') return LOG_LEVELS.WARN;
  return LOG_LEVELS.ERROR;
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.currentLevel = getCurrentLogLevel();
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data })
    };

    if (config.isDevelopment) {
      return `[${timestamp}] ${level.toUpperCase()} [${this.context}] ${message}${data ? ' ' + JSON.stringify(data, null, 2) : ''}`;
    }

    return logEntry;
  }

  error(message, error = null) {
    if (this.currentLevel >= LOG_LEVELS.ERROR) {
      const logData = error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      } : null;

      const formatted = this.formatMessage('ERROR', message, logData);
      console.error(formatted);

      // In production, you might want to send this to a monitoring service
      if (config.isProduction && error) {
        this.sendToMonitoring('error', message, error);
      }
    }
  }

  warn(message, data = null) {
    if (this.currentLevel >= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage('WARN', message, data);
      console.warn(formatted);
    }
  }

  info(message, data = null) {
    if (this.currentLevel >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage('INFO', message, data);
      console.info(formatted);
    }
  }

  debug(message, data = null) {
    if (this.currentLevel >= LOG_LEVELS.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, data);
      console.debug(formatted);
    }
  }

  // Performance logging
  time(label) {
    if (this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  timeEnd(label) {
    if (this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }

  // User activity logging
  userAction(action, userId, details = null) {
    this.info(`User Action: ${action}`, {
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Security logging
  security(event, details = null) {
    this.warn(`Security Event: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...details
    });
  }

  // API logging
  apiCall(method, url, status, duration = null) {
    const message = `API ${method.toUpperCase()} ${url} - ${status}`;
    const data = {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : null
    };

    if (status >= 400) {
      this.error(message, data);
    } else {
      this.debug(message, data);
    }
  }

  // Mock function for production monitoring integration
  sendToMonitoring(level, message, error) {
    // In a real application, this would integrate with services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - AWS CloudWatch
    // etc.
    
    if (config.isDevelopment) {
      console.log('Would send to monitoring:', { level, message, error });
    }
  }
}

// Create default logger instance
export const logger = new Logger('SIPANDAI');

// Create logger factory for specific contexts
export const createLogger = (context) => new Logger(context);

// Export specific loggers for common use cases
export const authLogger = new Logger('Auth');
export const apiLogger = new Logger('API');
export const uiLogger = new Logger('UI');
export const securityLogger = new Logger('Security');

export default logger;
