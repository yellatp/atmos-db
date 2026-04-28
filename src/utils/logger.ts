type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logger = {
  // Configured via process.env or global context in edge wrappers
  level: 'info' as LogLevel,
  
  _log(level: LogLevel, ...args: unknown[]) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.level);
    const targetIndex = levels.indexOf(level);
    
    if (targetIndex >= currentIndex) {
      const timestamp = new Date().toISOString();
      const prefix = `[AtmosDB] [${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'error': console.error(prefix, ...args); break;
        case 'warn': console.warn(prefix, ...args); break;
        case 'info': console.info(prefix, ...args); break;
        case 'debug': console.log(prefix, ...args); break;
      }
    }
  },

  info(...args: unknown[]) { this._log('info', ...args); },
  warn(...args: unknown[]) { this._log('warn', ...args); },
  error(...args: unknown[]) { this._log('error', ...args); },
  debug(...args: unknown[]) { this._log('debug', ...args); },
};
