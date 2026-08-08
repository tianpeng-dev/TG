/**
 * 数据库表结构类型定义
 */

/**
 * 表名常量
 */
export const TABLE_NAMES = {
  tremorLevels: 'tremor_levels',
  medicationEvents: 'medication_events',
  thresholdConfigs: 'threshold_configs',
  clinicReports: 'clinic_reports',
  patientProfiles: 'patient_profiles',
  deviceStatus: 'device_status',
  wristbandBindings: 'wristband_bindings',
  syncQueue: 'sync_queue',
  syncMetadata: 'sync_metadata',
} as const;

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];

/**
 * 表结构描述
 */
export interface TableSchema {
  readonly name: TableName;
  readonly columns: readonly ColumnSchema[];
  readonly indexes?: readonly IndexSchema[];
  readonly primaryKey: string;
}

export interface ColumnSchema {
  readonly name: string;
  readonly type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'BOOLEAN';
  readonly nullable: boolean;
  readonly defaultValue?: string | number | boolean;
  readonly indexed?: boolean;
  readonly unique?: boolean;
}

export interface IndexSchema {
  readonly name: string;
  readonly columns: readonly string[];
  readonly unique?: boolean;
}
