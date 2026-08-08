/**
 * @tremorguard/storage-core
 * 本地数据库抽象层统一导出
 */

// 核心接口
export type {
  DatabaseAdapter,
  DatabaseConfig,
  Transaction,
  SqlValue,
  Repository,
  TremorRepository,
  MedicationRepository,
  ReportRepository,
  PatientRepository,
  Migration,
  MigrationRunner,
} from './types';

// 加密接口
export type {
  EncryptionProvider,
  EncryptionConfig,
} from './encryption';
export { EncryptionAlgorithm, DEFAULT_ENCRYPTION_CONFIG } from './encryption';

// Schema
export { TABLE_NAMES } from './schema/tables';
export type { TableName, TableSchema, ColumnSchema, IndexSchema } from './schema/tables';
export { migration_v1_initial, ALL_MIGRATIONS } from './schema/migrations';

// 错误类型
export {
  StorageError,
  DatabaseOpenError,
  DatabaseQueryError,
  MigrationError,
  EncryptionError,
  TransactionError,
  StorageErrorCode,
} from './errors';
