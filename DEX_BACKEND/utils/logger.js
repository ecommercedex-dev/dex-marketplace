import winston from 'winston';
import { config, isProduction } from '../config/config.js';

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dex-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

if (!isProduction) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;