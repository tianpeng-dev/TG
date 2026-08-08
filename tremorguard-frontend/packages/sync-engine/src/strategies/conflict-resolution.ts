import type { SyncDelta } from '@tremorguard/shared-types';
import type { ConflictResolver } from '../types';
import { ConflictStrategy } from '../types';

/**
 * 客户端优先冲突解决器
 */
export class ClientWinsResolver implements ConflictResolver {
  async resolve<T>(local: SyncDelta<T>, _remote: SyncDelta<T>): Promise<SyncDelta<T>> {
    return local;
  }
}

/**
 * 服务端优先冲突解决器
 */
export class ServerWinsResolver implements ConflictResolver {
  async resolve<T>(_local: SyncDelta<T>, remote: SyncDelta<T>): Promise<SyncDelta<T>> {
    return remote;
  }
}

/**
 * 最后写入优先冲突解决器（基于时间戳）
 */
export class LastWriteWinsResolver implements ConflictResolver {
  async resolve<T>(local: SyncDelta<T>, remote: SyncDelta<T>): Promise<SyncDelta<T>> {
    return local.clientTimestamp >= remote.clientTimestamp ? local : remote;
  }
}

/**
 * 冲突解决器工厂
 */
export function createConflictResolver(strategy: ConflictStrategy): ConflictResolver {
  switch (strategy) {
    case ConflictStrategy.ClientWins:
      return new ClientWinsResolver();
    case ConflictStrategy.ServerWins:
      return new ServerWinsResolver();
    case ConflictStrategy.LastWriteWins:
      return new LastWriteWinsResolver();
    case ConflictStrategy.Manual:
      throw new Error('Manual strategy requires custom resolver implementation');
  }
}
