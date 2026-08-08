/**
 * @tremorguard/shared-types
 * 跨端领域模型与 API 契约统一导出
 */

// ====== 领域模型 ======
export type { TremorSeverity, TremorLevel, TremorLevelSeries } from './domain/TremorLevel';
export type { MedicationEvent } from './domain/MedicationEvent';
export type {
  MedicationStatus,
  MessageType,
  ChatMessage,
  ActionButton,
  MedicationPlan,
} from './domain/MedicationStatus';
export type { ThresholdConfig } from './domain/ThresholdConfig';
export type {
  ClinicReport,
  ClinicReportMetrics,
} from './domain/ClinicReport';
export type { DeviceStatus } from './domain/DeviceStatus';
export type {
  PatientProfile,
  MedicationPlanItem,
} from './domain/PatientProfile';
export type { WristbandBinding } from './domain/WristbandBinding';

// ====== API 契约 ======
export type {
  CreatePatientRequest,
  CreatePatientResponse,
  GetPatientRequest,
  GetPatientResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  GetReportRequest,
  GetReportResponse,
  GetDeviceStatusRequest,
  GetDeviceStatusResponse,
  ApiError,
  PaginatedResponse,
} from './api/contracts';

export type {
  SyncEntityType,
  SyncOperation,
  SyncDelta,
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
  SyncPayloadMap,
} from './api/sync';

// ====== 枚举 ======
export { Phase, SyncStatus, BLEConnectionStatus, UserRole, ExportFormat } from './enums';
