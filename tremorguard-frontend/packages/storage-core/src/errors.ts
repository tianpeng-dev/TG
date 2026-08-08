/**
 * Storage 错误类型
 */
export abstract class StorageError extends Error {
  abstract readonly code: StorageErrorCode;
  readonly timestamp: number = Date.now();

  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class DatabaseOpenError extends StorageError {
  readonly code = StorageErrorCode.OpenFailed;
}

export class DatabaseQueryError extends StorageError {
  readonly code = StorageErrorCode.QueryFailed;
}

export class MigrationError extends StorageError {
  readonly code = StorageErrorCode.MigrationFailed;
}

export class EncryptionError extends StorageError {
  readonly code = StorageErrorCode.EncryptionFailed;
}

export class TransactionError extends StorageError {
  readonly code = StorageErrorCode.TransactionFailed;
}

export enum StorageErrorCode {
  OpenFailed = 'OPEN_FAILED',
  QueryFailed = 'QUERY_FAILED',
  MigrationFailed = 'MIGRATION_FAILED',
  EncryptionFailed = 'ENCRYPTION_FAILED',
  TransactionFailed = 'TRANSACTION_FAILED',
  NotFound = 'NOT_FOUND',
  Constraint = 'CONSTRAINT',
}
