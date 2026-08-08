import type {
  PatientProfile,
  TremorLevel,
  MedicationEvent,
  ClinicReport,
} from '@tremorguard/shared-types';

/**
 * SQL 值类型
 */
export type SqlValue = string | number | boolean | Uint8Array | null;

/**
 * 数据库配置
 */
export interface DatabaseConfig {
  readonly name: string;
  readonly version: number;
  /** SQLCipher 加密密钥（启用数据库级加密） */
  readonly encryptionKey?: string;
  readonly location?: 'default' | 'documents';
}

/**
 * 事务接口
 */
export interface Transaction {
  execute(sql: string, params?: readonly SqlValue[]): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * 数据库适配器接口
 *
 * 实现方：
 * - RN 端：react-native-sqlite-storage
 * - Web 端：sql.js（仅测试用）或远程 API 替代
 */
export interface DatabaseAdapter {
  /** 打开/初始化数据库 */
  open(config: DatabaseConfig): Promise<void>;

  /** 关闭数据库 */
  close(): Promise<void>;

  /** 执行单条 SQL（无返回值） */
  execute(sql: string, params?: readonly SqlValue[]): Promise<void>;

  /** 批量事务执行 */
  transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;

  /** 查询 */
  query<T>(sql: string, params?: readonly SqlValue[]): Promise<readonly T[]>;
}

/**
 * 通用 Repository 接口 —— 领域 Repository 继承此接口
 */
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<readonly T[]>;
  save(entity: T): Promise<void>;
  saveBatch(entities: readonly T[]): Promise<void>;
  delete(id: ID): Promise<void>;
  count(): Promise<number>;
}

/**
 * 震颤数据 Repository —— 高频写入优化
 */
export interface TremorRepository extends Repository<TremorLevel, string> {
  findByTimeRange(start: string, end: string): Promise<readonly TremorLevel[]>;
  findLatest(): Promise<TremorLevel | null>;
  /** 删除早于指定时间的数据，返回删除条数 */
  deleteBefore(timestamp: string): Promise<number>;
}

/**
 * 服药事件 Repository
 */
export interface MedicationRepository extends Repository<MedicationEvent, string> {
  findByDate(date: string): Promise<readonly MedicationEvent[]>;
}

/**
 * 就诊报告 Repository
 */
export interface ReportRepository extends Repository<ClinicReport, string> {
  findLatestByPatient(patientId: string): Promise<ClinicReport | null>;
}

/**
 * 患者 Repository
 */
export interface PatientRepository extends Repository<PatientProfile, string> {}

/**
 * 数据库迁移定义
 */
export interface Migration {
  readonly version: number;
  readonly description: string;
  up(db: DatabaseAdapter): Promise<void>;
  down?(db: DatabaseAdapter): Promise<void>;
}

/**
 * 迁移执行器
 */
export interface MigrationRunner {
  migrate(targetVersion?: number): Promise<void>;
  currentVersion(): Promise<number>;
}
