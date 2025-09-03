import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config/env';

// Ensure logs directory exists
if (!fs.existsSync(config.LOGS_DIR)) {
  fs.mkdirSync(config.LOGS_DIR, { recursive: true });
}

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'meeting-brief-generator' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: config.NODE_ENV === 'test',
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(config.LOGS_DIR, 'error.log'),
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(config.LOGS_DIR, 'combined.log'),
    }),
  ],
});

// Usage logger for analytics
const usageLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(config.LOGS_DIR, 'usage.log'),
    }),
  ],
});

export const logUsage = (
  eventType: string,
  data: Record<string, any>,
  clientIp?: string
) => {
  usageLogger.info({
    eventType,
    clientIp: clientIp || 'unknown',
    data,
  });
};

export default logger;