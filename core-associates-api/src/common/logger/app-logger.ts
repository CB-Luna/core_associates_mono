import { LoggerService } from '@nestjs/common';

/**
 * Custom logger that outputs structured JSON in production
 * and normal colorized text in development.
 */
export class AppLogger implements LoggerService {
  private readonly isProduction =
    process.env.NODE_ENV === 'production';

  log(message: string, context?: string) {
    this.emit('log', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.emit('error', message, context, trace);
  }

  warn(message: string, context?: string) {
    this.emit('warn', message, context);
  }

  debug(message: string, context?: string) {
    this.emit('debug', message, context);
  }

  verbose(message: string, context?: string) {
    this.emit('verbose', message, context);
  }

  private emit(
    level: string,
    message: string,
    context?: string,
    trace?: string,
  ) {
    if (this.isProduction) {
      const entry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level,
        context: context || 'Application',
        message,
      };
      if (trace) entry.trace = trace;
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      const timestamp = new Date().toLocaleTimeString();
      const ctx = context ? `[${context}] ` : '';
      const prefix = `${timestamp} ${level.toUpperCase().padEnd(7)} ${ctx}`;
      if (level === 'error') {
        process.stderr.write(`${prefix}${message}\n`);
        if (trace) process.stderr.write(`${trace}\n`);
      } else {
        process.stdout.write(`${prefix}${message}\n`);
      }
    }
  }
}
