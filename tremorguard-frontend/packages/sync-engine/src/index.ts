/**
 * @tremorguard/sync-engine
 * 同步引擎统一导出
 */

// 核心接口
export type {
  SyncStatus,
  SyncState,
  SyncEngine,
  AutoSyncOptions,
  SyncResult,
  ConflictResolver,
  Unsubscribe,
} from './types';

// 错误类型
export {
  SyncError,
  SyncNetworkError,
  SyncConflictError,
  SyncTimeoutError,
  SyncErrorCode,
  ConflictStrategy,
  DEFAULT_AUTO_SYNC_OPTIONS,
} from './types';

// 网络适配器
export type {
  NetworkAdapter,
  PushResult,
  SyncEndpoints,
  HttpClient,
  FetchFn,
} from './network-adapter';
export { DEFAULT_SYNC_ENDPOINTS } from './network-adapter';

// 同步策略
export type {
  DeltaSyncStrategy,
  DeltaSyncConfig,
} from './strategies/delta-sync';
export { DEFAULT_DELTA_SYNC_CONFIG } from './strategies/delta-sync';

// 冲突解决器实现
export {
  ClientWinsResolver,
  ServerWinsResolver,
  LastWriteWinsResolver,
  createConflictResolver,
} from './strategies/conflict-resolution';
