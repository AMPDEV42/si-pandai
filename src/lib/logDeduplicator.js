/**
 * Log Deduplication Utility
 * Prevents duplicate log messages from spamming the console
 */

class LogDeduplicator {
  constructor() {
    this.recentLogs = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Check if a log message should be allowed based on deduplication rules
   * @param {string} message - The log message
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {number} timeWindow - Time window in ms for deduplication (default: 5000ms)
   * @returns {boolean} - Whether the log should be allowed
   */
  shouldLog(message, level = 'info', timeWindow = 5000) {
    const key = `${level}:${message}`;
    const now = Date.now();
    
    if (this.recentLogs.has(key)) {
      const lastLogTime = this.recentLogs.get(key);
      if ((now - lastLogTime) < timeWindow) {
        return false; // Suppress duplicate log
      }
    }
    
    this.recentLogs.set(key, now);
    return true;
  }

  /**
   * Clean up old log entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    for (const [key, timestamp] of this.recentLogs.entries()) {
      if ((now - timestamp) > maxAge) {
        this.recentLogs.delete(key);
      }
    }
  }

  /**
   * Destroy the deduplicator and clean up resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.recentLogs.clear();
  }
}

// Create global instance
export const logDeduplicator = new LogDeduplicator();

/**
 * Enhanced logger wrapper with deduplication
 */
export const createDedupedLogger = (originalLogger) => {
  return {
    debug: (message, ...args) => {
      if (logDeduplicator.shouldLog(message, 'debug', 10000)) {
        originalLogger.debug(message, ...args);
      }
    },
    info: (message, ...args) => {
      if (logDeduplicator.shouldLog(message, 'info', 5000)) {
        originalLogger.info(message, ...args);
      }
    },
    warn: (message, ...args) => {
      if (logDeduplicator.shouldLog(message, 'warn', 30000)) {
        originalLogger.warn(message, ...args);
      }
    },
    error: (message, ...args) => {
      if (logDeduplicator.shouldLog(message, 'error', 10000)) {
        originalLogger.error(message, ...args);
      }
    }
  };
};

export default logDeduplicator;
