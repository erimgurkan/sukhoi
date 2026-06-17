const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { SENSITIVE_PATTERNS, REDACT_REPLACEMENT } = require('../config/security');
const config = require('../config');

// Ensure log directory exists
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Helper function to recursively redact sensitive values in objects
function redactObject(obj) {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    let redacted = obj;
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, REDACT_REPLACEMENT);
    }
    return redacted;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }
  
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Redact key values
        newObj[key] = redactObject(obj[key]);
      }
    }
    return newObj;
  }
  
  return obj;
}

// Winston formatting
const redactFormat = winston.format((info) => {
  // Redact message
  if (typeof info.message === 'string') {
    for (const pattern of SENSITIVE_PATTERNS) {
      info.message = info.message.replace(pattern, REDACT_REPLACEMENT);
    }
  }
  
  // Redact any other log metadata
  const keys = Object.keys(info);
  for (const key of keys) {
    if (key !== 'message' && key !== 'level' && key !== 'timestamp') {
      info[key] = redactObject(info[key]);
    }
  }
  
  return info;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    redactFormat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

module.exports = logger;
