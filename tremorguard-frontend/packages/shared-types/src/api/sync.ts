/**
 * 同步协议契约 —— delta payload 格式
 *
 * 离线优先架构下，网络仅用于同步本地变更到云端 / 拉取远端变更
 */
import type {
  TremorLevel,
  MedicationEvent,
  ClinicReport,
  ThresholdConfig,
  PatientProfile,
} from '../domain';

/**
 * 同步条目类型
 */
export type SyncEntityType =
  | 'tremor'
  | 'medication'
  | 'report'
  | 'threshold'
  | 'patient';

/**
 * 同步操作类型
 */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * 同步 delta —— 描述一次待同步变更
 */
export interface SyncDelta<T = unknown> {
  readonly entityId: string;
  readonly entityType: SyncEntityType;
  readonly operation: SyncOperation;
  readonly payload: T;
  readonly clientTimestamp: string;
  /** 乐观锁版本号 */
  readonly clientVersion: number;
}

/**
 * 同步请求体
 */
export interface SyncPushRequest {
  readonly patientId: string;
  readonly deltas: readonly SyncDelta[];
  readonly lastSyncAt: string;
}

export interface SyncPushResponse {
  readonly accepted: number;
  readonly rejected: number;
  readonly conflicts: readonly SyncDelta[];
  readonly serverTimestamp: string;
}

export interface SyncPullRequest {
  readonly patientId: string;
  readonly lastSyncAt: string;
}

export interface SyncPullResponse {
  readonly deltas: readonly SyncDelta[];
  readonly serverTimestamp: string;
  readonly hasMore: boolean;
}

/**
 * 类型化的 payload 映射
 */
export interface SyncPayloadMap {
  readonly tremor: TremorLevel;
  readonly medication: MedicationEvent;
  readonly report: ClinicReport;
  readonly threshold: ThresholdConfig;
  readonly patient: PatientProfile;
}
