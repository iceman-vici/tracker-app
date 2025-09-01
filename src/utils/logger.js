const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = process.env.LOG_DIR || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} ${level}: ${message}`;
    if (Object.keys(metadata).length > 0 && metadata.constructor === Object) {
      msg += ` ${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
  })
);

// Create transport for daily rotate file
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Create transport for error logs
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: logFormat
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    dailyRotateFileTransport,
    errorFileTransport
  ],
  exitOnError: false
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Export logger with realtime capabilities
class RealtimeLogger {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  emit(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };

    // Emit to all connected clients in 'logs' room
    if (this.io) {
      this.io.to('logs').emit('log', logEntry);
    }

    // Also log normally
    logger[level](message, metadata);
  }

  info(message, metadata) {
    this.emit('info', message, metadata);
  }

  warn(message, metadata) {
    this.emit('warn', message, metadata);
  }

  error(message, metadata) {
    this.emit('error', message, metadata);
  }

  debug(message, metadata) {
    this.emit('debug', message, metadata);
  }
}

const realtimeLogger = new RealtimeLogger();

// Wrap original logger methods
const wrappedLogger = {
  ...logger,
  realtime: realtimeLogger,
  info: (message, metadata) => {
    logger.info(message, metadata);
    realtimeLogger.emit('info', message, metadata);
  },
  warn: (message, metadata) => {
    logger.warn(message, metadata);
    realtimeLogger.emit('warn', message, metadata);
  },
  error: (message, metadata) => {
    logger.error(message, metadata);
    realtimeLogger.emit('error', message, metadata);
  },
  debug: (message, metadata) => {
    logger.debug(message, metadata);
    realtimeLogger.emit('debug', message, metadata);
  }
};

module.exports = wrappedLogger;