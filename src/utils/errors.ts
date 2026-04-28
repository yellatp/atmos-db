import type { AtmosErrorType } from '../types/index';

export class AtmosError extends Error {
  public code: AtmosErrorType;
  public statusCode: number;
  public cause?: unknown;

  constructor(code: AtmosErrorType, message: string, cause?: unknown) {
    super(message);
    this.name = 'AtmosError';
    this.code = code;
    this.cause = cause;
    this.statusCode = AtmosError.mapCodeToStatus(code);
    
    // Set prototype explicitly for built-in extension in TS
    Object.setPrototypeOf(this, AtmosError.prototype);
  }

  private static mapCodeToStatus(code: AtmosErrorType): number {
    switch (code) {
      case 'NOT_FOUND': return 404;
      case 'AUTH_ERROR': return 401;
      case 'DB_ERROR': 
      case 'VECTOR_ERROR':
      case 'STORAGE_ERROR':
      case 'EMBED_ERROR':
        return 500;
      default: return 500;
    }
  }
}
