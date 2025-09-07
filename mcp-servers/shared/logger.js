import { config } from './config.js';

class Logger {
  constructor(service = 'MCP') {
    this.service = service;
    this.level = config.logging.level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      message,
      ...meta
    };

    if (config.logging.format === 'json') {
      return JSON.stringify(logEntry);
    } else {
      return `[${timestamp}] ${level.toUpperCase()} [${this.service}] ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ''
      }`;
    }
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export default Logger;
