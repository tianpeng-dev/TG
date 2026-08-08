import type { SyncDelta } from '@tremorguard/shared-types';

/**
 * 增量同步策略接口
 *
 * 增量同步：仅同步自上次同步以来的变更
 */
export interface DeltaSyncStrategy {
  /**
   * 计算需要推送的本地变更
   */
  computeLocalDeltas(lastSyncAt: string): Promise<readonly SyncDelta[]>;

  /**
   * 应用从远端拉取的变更到本地
   */
  applyRemoteDeltas(deltas: readonly SyncDelta[]): Promise<void>;

  /**
   * 获取上次同步时间戳
   */
  getLastSyncAt(): Promise<string | null>;

  /**
   * 更新上次同步时间戳
   */
  setLastSyncAt(timestamp: string): Promise<void>;
}

/**
 * 增量同步配置
 */
export interface DeltaSyncConfig {
  /** 单次推送的最大条数（避免 payload 过大） */
  readonly batchSize: number;
  /** 单次拉取的最大条数 */
  readonly pullBatchSize: number;
  /** 是否启用压缩（gzip） */
  readonly enableCompression: boolean;
}

export const DEFAULT_DELTA_SYNC_CONFIG: DeltaSyncConfig = {
  batchSize: 100,
  pullBatchSize: 500,
  enableCompression: true,
} as const;
