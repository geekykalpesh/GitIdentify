import { LogEntry } from '../../types';

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  /**
   * Redacts sensitive information from log messages
   * Ensures private SSH keys, tokens, and passwords are NEVER logged.
   */
  public sanitize(message: string): string {
    if (!message) return '';

    return message
      // Redact Private Key blocks
      .replace(/-----BEGIN[A-Z0-9\s]+PRIVATE KEY-----[\s\S]*?-----END[A-Z0-9\s]+PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]')
      .replace(/PRIVATE KEY:[\s\S]*?(\n|$)/gi, 'PRIVATE KEY: [REDACTED]\n')
      // Redact GitHub tokens (ghp_, gho_, ghu_, ghs_, ghr_, github_pat_)
      .replace(/(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{16,255}/g, '[REDACTED_TOKEN]')
      // Redact Bearer tokens
      .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]')
      // Redact generic passwords or secret parameters in URLs or JSON
      .replace(/(password|token|secret|api_key|access_token)=[^&\s]+/gi, '$1=[REDACTED]');
  }

  public log(level: LogEntry['level'], message: string, category: string = 'App'): LogEntry {
    const sanitizedMsg = this.sanitize(message);
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level,
      message: sanitizedMsg,
      category,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notifyListeners();
    return entry;
  }

  public info(message: string, category?: string) {
    return this.log('info', message, category);
  }

  public warn(message: string, category?: string) {
    return this.log('warn', message, category);
  }

  public error(message: string, category?: string) {
    return this.log('error', message, category);
  }

  public debug(message: string, category?: string) {
    return this.log('debug', message, category);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  public subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const current = this.getLogs();
    this.listeners.forEach((l) => l(current));
  }
}

export const logger = new LoggerService();
