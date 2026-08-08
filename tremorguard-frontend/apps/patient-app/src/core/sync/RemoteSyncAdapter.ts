/**
 * 远程同步适配器占位
 *
 * 实现 @tremorguard/sync-engine 的 NetworkAdapter 接口
 * 基于 fetch + @react-native-community/netinfo
 *
 * P0 阶段实现：
 * - push/pull HTTP 调用
 * - 在线/离线检测
 * - 网络连通性监听
 */
import type { NetworkAdapter, PushResult } from '@tremorguard/sync-engine';
import type { SyncDelta } from '@tremorguard/shared-types';

export class RemoteSyncAdapter implements NetworkAdapter {
  async push(_deltas: readonly SyncDelta[]): Promise<PushResult> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async pull(_lastSyncAt: string): Promise<readonly SyncDelta[]> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async isOnline(): Promise<boolean> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  onConnectivityChange(_listener: (online: boolean) => void): () => void {
    return () => {};
  }
}
