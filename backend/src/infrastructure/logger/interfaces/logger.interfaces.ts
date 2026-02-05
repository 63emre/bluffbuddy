/**
 * ==========================================================
 * LOGGER INTERFACES
 * ==========================================================
 * BluffBuddy Online - Smart Logger Type Definitions
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * COST OPTIMIZATION:
 * - Console logs → Dozzle (free, real-time)
 * - Firestore logs → Batched writes (cost-effective)
 * ==========================================================
 */

/**
 * Log severity levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Single log entry structure
 */
export interface ILogEntry {
  /** ISO timestamp */
  timestamp: string;

  /** Log severity level */
  level: LogLevel;

  /** Log message */
  message: string;

  /** Service/module that generated the log */
  context?: string;

  /** Associated match ID (from AsyncLocalStorage) */
  matchId?: string;

  /** Associated user ID (from AsyncLocalStorage) */
  userId?: string;

  /** Request correlation ID (from AsyncLocalStorage) */
  requestId?: string;

  /** Socket connection ID */
  socketId?: string;

  /** Additional metadata */
  meta?: Record<string, unknown>;

  /** Error stack trace (for error/fatal levels) */
  stack?: string;

  /** Duration in ms (for performance logs) */
  durationMs?: number;
}

/**
 * Batched log document structure for Firestore
 * ONE document per batch = ONE write operation
 */
export interface ILogBatch {
  /** Unique batch identifier */
  batchId: string;

  /** Batch creation timestamp */
  timestamp: string;

  /** Environment (development/staging/production) */
  environment: string;

  /** Server instance ID (for multi-instance deployments) */
  instanceId: string;

  /** Number of logs in this batch */
  count: number;

  /** Array of log entries */
  logs: ILogEntry[];

  /** First log timestamp in batch */
  firstLogAt: string;

  /** Last log timestamp in batch */
  lastLogAt: string;

  /** Log level summary */
  levelCounts: {
    debug: number;
    info: number;
    warn: number;
    error: number;
    fatal: number;
  };
}

/**
 * Buffer configuration for batching
 */
export interface ILogBufferConfig {
  /** Max entries before auto-flush (default: 50) */
  maxSize: number;

  /** Max time before auto-flush in ms (default: 60000) */
  flushIntervalMs: number;

  /** Minimum log level to buffer (default: 'info') */
  minLevel: LogLevel;

  /** Whether to force flush errors immediately */
  flushErrorsImmediately: boolean;
}

/**
 * AsyncLocalStorage context structure
 */
export interface ILogContext {
  /** Current request correlation ID */
  requestId?: string;

  /** Current user ID (from auth) */
  userId?: string;

  /** Current match/room ID (from game) */
  matchId?: string;

  /** Current socket connection ID */
  socketId?: string;

  /** Request start time (for duration calculation) */
  startTime?: number;

  /** Additional context data */
  extra?: Record<string, unknown>;
}

/**
 * Smart Logger Service Interface
 */
export interface ISmartLoggerService {
  /**
   * Log debug message (development only)
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>,
  ): void;

  /**
   * Log fatal/critical error
   */
  fatal(
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>,
  ): void;

  /**
   * Create child logger with context
   */
  child(context: string): ISmartLoggerService;

  /**
   * Flush pending logs immediately
   */
  flush(): Promise<void>;

  /**
   * Get current buffer size
   */
  getBufferSize(): number;
}

/**
 * Log Transport Interface (for custom transports)
 */
export interface ILogTransport {
  /** Transport name */
  name: string;

  /** Minimum level to process */
  level: LogLevel;

  /**
   * Write a log entry
   */
  write(entry: ILogEntry): void;

  /**
   * Flush any buffered logs
   */
  flush(): Promise<void>;

  /**
   * Close transport (cleanup)
   */
  close(): Promise<void>;
}

/**
 * CLS Context Service Interface
 */
export interface IClsContextService {
  /**
   * Run callback with new context
   */
  run<T>(context: Partial<ILogContext>, callback: () => T): T;

  /**
   * Get current context
   */
  getContext(): ILogContext | undefined;

  /**
   * Set context value
   */
  set<K extends keyof ILogContext>(key: K, value: ILogContext[K]): void;

  /**
   * Get context value
   */
  get<K extends keyof ILogContext>(key: K): ILogContext[K] | undefined;

  /**
   * Get request ID (generates if not exists)
   */
  getRequestId(): string;
}
