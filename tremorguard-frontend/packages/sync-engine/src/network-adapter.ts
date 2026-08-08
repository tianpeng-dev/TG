import type { SyncDelta, SyncPushRequest, SyncPushResponse, SyncPullRequest, SyncPullResponse } from '@tremorguard/shared-types';
import type { Unsubscribe } from './types';

/**
 * 网络适配器 —— 抽象后端 API 调用
 *
 * 实现方：
 * - RN 端：基于 fetch，注入离线感知（@react-native-community/netinfo）
 * - Web 端：基于 fetch，使用浏览器 online/offline 事件
 * - 测试：使用 mock 实现
 */
export interface NetworkAdapter {
  /**
   * 推送本地变更到云端
   */
  push(deltas: readonly SyncDelta[]): Promise<PushResult>;

  /**
   * 拉取远端变更
   * @param lastSyncAt 上次同步时间戳
   */
  pull(lastSyncAt: string): Promise<readonly SyncDelta[]>;

  /** 检查网络是否可用 */
  isOnline(): Promise<boolean>;

  /** 监听网络连通性变化 */
  onConnectivityChange(listener: (online: boolean) => void): Unsubscribe;
}

/**
 * 推送结果
 */
export interface PushResult {
  /** 服务器接受的条数 */
  readonly accepted: number;
  /** 服务器拒绝的条数 */
  readonly rejected: number;
  /** 冲突条目（需要 ConflictResolver 解决） */
  readonly conflicts: readonly SyncDelta[];
}

/**
 * REST API 端点契约
 */
export interface SyncEndpoints {
  readonly push: string;
  readonly pull: string;
  readonly status: string;
}

export const DEFAULT_SYNC_ENDPOINTS: SyncEndpoints = {
  push: '/api/v1/sync/push',
  pull: '/api/v1/sync/pull',
  status: '/api/v1/sync/status',
} as const;

/**
 * HTTP 客户端接口（便于测试 mock）
 */
export interface HttpClient {
  request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown): Promise<T>;
}

/**
 * Fetch-based HTTP 客户端实现契约（由适配器具体实现）
 */
export type FetchFn = typeof fetch;
