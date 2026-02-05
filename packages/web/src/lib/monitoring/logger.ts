/**
 * Application Logger
 *
 * Centralized logging utility with structured logging support
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  stack?: string;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.minLevel =
      process.env.NEXT_PUBLIC_LOG_LEVEL === "debug"
        ? LogLevel.DEBUG
        : process.env.NODE_ENV === "production"
        ? LogLevel.WARN
        : LogLevel.INFO;
    this.isDevelopment = process.env.NODE_ENV !== "production";
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this.minLevel) return;

    const entry = this.formatMessage(level, message, context);

    if (error) {
      entry.stack = error.stack;
    }

    // In development, log to console with colors
    if (this.isDevelopment) {
      const styles = {
        [LogLevel.DEBUG]: "color: gray",
        [LogLevel.INFO]: "color: blue",
        [LogLevel.WARN]: "color: orange",
        [LogLevel.ERROR]: "color: red",
      };

      const style = styles[level];
      const prefix = `[${LogLevel[level]}] ${entry.timestamp}`;

      // eslint-disable-next-line no-console
      console.log(`%c${prefix}`, style, message, context || "", error || "");
    } else {
      // In production, you might send this to a logging service
      // For now, we just use console methods
      const consoleMethod = {
        [LogLevel.DEBUG]: console.debug,
        [LogLevel.INFO]: console.info,
        [LogLevel.WARN]: console.warn,
        [LogLevel.ERROR]: console.error,
      }[level];

      consoleMethod(entry);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API ${method} ${url}`, {
      ...context,
      type: "api_request",
    });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, url: string, statusCode: number, duration: number): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API ${method} ${url} - ${statusCode}`, {
      statusCode,
      duration,
      type: "api_response",
    });
  }

  /**
   * Log user action
   */
  userAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      type: "user_action",
    });
  }

  /**
   * Log performance metric
   */
  performance(name: string, duration: number, context?: LogContext): void {
    this.debug(`Performance: ${name} = ${duration}ms`, {
      ...context,
      type: "performance",
    });
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Performance logger for measuring operation durations
 */
export class PerformanceLogger {
  private startTime: number;
  private name: string;
  private context?: LogContext;

  constructor(name: string, context?: LogContext) {
    this.name = name;
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * End the performance measurement and log
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    logger.performance(this.name, duration, this.context);
    return duration;
  }

  /**
   * End and log with a warning if duration exceeds threshold
   */
  endWithThreshold(thresholdMs: number): number {
    const duration = this.end();
    if (duration > thresholdMs) {
      logger.warn(`${this.name} exceeded threshold`, {
        threshold: thresholdMs,
        actual: duration,
        ...this.context,
      });
    }
    return duration;
  }
}

/**
 * Create a performance logger
 */
export function createPerformanceLogger(name: string, context?: LogContext): PerformanceLogger {
  return new PerformanceLogger(name, context);
}
