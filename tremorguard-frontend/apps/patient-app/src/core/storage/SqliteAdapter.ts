/**
 * SQLite 平台适配器占位
 *
 * 实现 @tremorguard/storage-core 的 DatabaseAdapter 接口
 * 基于 react-native-sqlite-storage
 *
 * P0 阶段实现：
 * - 数据库打开/关闭
 * - SQL 执行
 * - 事务
 * - 查询
 */
import type { DatabaseAdapter, DatabaseConfig, Transaction, SqlValue } from '@tremorguard/storage-core';

export class SqliteAdapter implements DatabaseAdapter {
  async open(_config: DatabaseConfig): Promise<void> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async close(): Promise<void> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async execute(_sql: string, _params?: readonly SqlValue[]): Promise<void> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async transaction<T>(_work: (tx: Transaction) => Promise<T>): Promise<T> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async query<T>(_sql: string, _params?: readonly SqlValue[]): Promise<readonly T[]> {
    throw new Error('Not implemented - P0 阶段实现');
  }
}
