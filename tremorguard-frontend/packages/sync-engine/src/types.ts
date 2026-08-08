import type { SyncDelta } from '@tremorguard/shared-types';

/**
 * 同步状态
 */
export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'offline' | 'error';

export interface SyncState {
  readonly status: SyncStatus;
  readonly lastSyncAt?: string;
  readonly pendingChanges: number;
  readonly failedAttempts: number;
  readonly lastError?: SyncError;
}

/**
 * 同步引擎接口
 *
 * 离线优先架构中，SyncEngine 负责将本地变更推送到云端，并拉取远端变更合并到本地
 */
export interface SyncEngine {
  /** 当前同步状态（只读） */
  readonly state: Readonly<SyncState>;

  /**
   * 启动一次同步（push 本地变更 + pull 远端变更）
   */
  sync(): Promise<SyncResult>;

  /** 注册状态变更监听 */
  onStateChange(listener: (state: SyncState) => void): Unsubscribe;

  /**
   * 网络恢复时自动触发同步
   */
  enableAutoSync(options?: AutoSyncOptions): void;

  /** 销毁引擎，清理监听器与定时器 */
  dispose(): void;
}

/**
 * 自动同步配置
 */
export interface AutoSyncOptions {
  /** 防抖时间（毫秒），默认 5000 */
  readonly debounceMs: number;
  /** 最大重试次数，默认 5 */
  readonly maxRetries: number;
  /** 退避乘数，默认 2（指数退避） */
  readonly backoffMultiplier: number;
}

export const DEFAULT_AUTO_SYNC_OPTIONS: AutoSyncOptions = {
  debounceMs: 5000,
  maxRetries: 5,
  backoffMultiplier: 2,
} as const;

/**
 * 同步结果
 */
export interface SyncResult {
  /** 推送成功的条数 */
  readonly pushed: number;
  /** 拉取的条数 */
  readonly pulled: number;
  /** 冲突数量 */
  readonly conflicts: number;
  /** 总耗时（毫秒） */
  readonly durationMs: number;
  readonly success: boolean;
}

/**
 * 冲突解决策略接口
 */
export interface ConflictResolver {
  resolve<T>(local: SyncDelta<T>, remote: SyncDelta<T>): Promise<SyncDelta<T>>;
}

/**
 * 冲突解决策略枚举
 */
export enum ConflictStrategy {
  ClientWins = 'CLIENT_WINS',
  ServerWins = 'SERVER_WINS',
  LastWriteWins = 'LAST_WRITE_WINS',
  Manual = 'MANUAL',
}

/**
 * 同步错误
 */
export abstract class SyncError extends Error {
  abstract readonly code: SyncErrorCode;
  readonly timestamp: number = Date.now();

  constructor(message: string) {
    super(message);
    this.name = 'SyncError';
  }
}

export class SyncNetworkError extends SyncError {
  readonly code = SyncErrorCode.NetworkError;
}

export class SyncConflictError extends SyncError {
  readonly code = SyncErrorCode.Conflict;
}

export class SyncTimeoutError extends SyncError {
  readonly code = SyncErrorCode.Timeout;
}

export enum SyncErrorCode {
  NetworkError = 'NETWORK_ERROR',
  Conflict = 'CONFLICT',
  Timeout = 'TIMEOUT',
  Authentication = 'AUTHENTICATION',
  ServerError = 'SERVER_ERROR',
  PayloadTooLarge = 'PAYLOAD_TOO_LARGE',
}

export type Unsubscribe = () => void;
