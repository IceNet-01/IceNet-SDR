/**
 * Logger Module
 * Winston-based logging with verbosity controls
 */

import winston from 'winston';
import path from 'path';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format
const customFormat = printf(({ level, message, timestamp, label, stack }) => {
  const labelStr = label ? `[${label}] ` : '';
  if (stack) {
    return `${timestamp} ${level}: ${labelStr}${message}\n${stack}`;
  }
  return `${timestamp} ${level}: ${labelStr}${message}`;
});

export class Logger {
  constructor(label = '') {
    this.label = label;
    this.level = process.env.LOG_LEVEL || 'info';

    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');

    this.logger = createLogger({
      level: this.level,
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.label({ label: this.label }),
        customFormat
      ),
      transports: [
        // Console transport with colors
        new transports.Console({
          format: combine(
            colorize(),
            errors({ stack: true }),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.label({ label: this.label }),
            customFormat
          )
        }),
        // File transport for all logs
        new transports.File({
          filename: path.join(logsDir, 'icenet-sdr.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        // File transport for errors
        new transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 10485760,
          maxFiles: 5
        })
      ]
    });
  }

  setLevel(level) {
    this.level = level;
    this.logger.level = level;
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  silly(message, meta = {}) {
    this.logger.silly(message, meta);
  }
}

export default Logger;
