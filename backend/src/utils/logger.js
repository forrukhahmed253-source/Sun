const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (metadata && Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json(),
    customFormat
  ),
  transports: [
    // Console transport
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      )
    }),
    
    // File transport for all logs
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // File transport for error logs
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // File transport for audit logs
    new transports.File({
      filename: path.join(logDir, 'audit.log'),
      level: 'audit',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  ],
  exceptionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'rejections.log') 
    })
  ]
});

// Custom audit log method
logger.audit = (action, userId, details = {}) => {
  logger.log({
    level: 'audit',
    message: `AUDIT: ${action}`,
    userId,
    ...details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  });
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
      userId: req.user?.id || 'anonymous',
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log at different levels based on status code
    if (res.statusCode >= 500) {
      logger.error('Server Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client Error', logData);
    } else {
      logger.info('Request Completed', logData);
    }
    
    // Audit log for sensitive operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && 
        ['/api/transactions', '/api/admin', '/api/users'].some(path => req.originalUrl.includes(path))) {
      logger.audit('Sensitive Operation', req.user?.id, {
        action: req.method,
        endpoint: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }
  });
  
  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });
  
  next(err);
};

// Performance monitoring
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds
    
    if (duration > 1000) { // Log slow requests (> 1 second)
      logger.warn('Slow Request Detected', {
        url: req.originalUrl,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
        threshold: '1000ms'
      });
    }
  });
  
  next();
};

// Database query logger (for Mongoose)
const mongooseLogger = () => {
  const mongoose = require('mongoose');
  
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.debug('Mongoose Query', {
      collection: collectionName,
      method: method,
      query: JSON.stringify(query),
      doc: JSON.stringify(doc)
    });
  });
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  performanceMonitor,
  mongooseLogger
};
