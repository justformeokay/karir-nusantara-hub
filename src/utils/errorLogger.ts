// Error logging utility to persist errors to localStorage
export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  source: string;
  message: string;
  details?: unknown;
  stack?: string;
  url?: string;
  statusCode?: number;
}

const MAX_LOGS = 50;

export class ErrorLogger {
  private static readonly STORAGE_KEY = 'app_error_logs';

  static log(level: 'error' | 'warn' | 'info', source: string, message: string, details?: unknown) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      details,
      url: window.location.href,
    };

    if (details instanceof Error) {
      errorLog.stack = details.stack;
      errorLog.details = {
        name: details.name,
        message: details.message,
      };
    }

    // Log to console
    const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[logMethod](`[${source}] ${message}`, details);

    // Save to localStorage
    try {
      const logs = this.getLogs();
      logs.push(errorLog);
      
      // Keep only last MAX_LOGS entries
      if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save error log to localStorage', e);
    }
  }

  static error(source: string, message: string, details?: unknown) {
    this.log('error', source, message, details);
  }

  static warn(source: string, message: string, details?: unknown) {
    this.log('warn', source, message, details);
  }

  static info(source: string, message: string, details?: unknown) {
    this.log('info', source, message, details);
  }

  static getLogs(): ErrorLog[] {
    try {
      const logs = localStorage.getItem(this.STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      console.error('Failed to read error logs from localStorage', e);
      return [];
    }
  }

  static clearLogs() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear error logs', e);
    }
  }

  static getLastError(): ErrorLog | null {
    const logs = this.getLogs();
    return logs.length > 0 ? logs[logs.length - 1] : null;
  }
}
