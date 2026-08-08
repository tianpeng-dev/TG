/**
 * 领域模型 barrel —— 供包内（如 api/sync.ts）跨目录引用
 */
export type {
  TremorSeverity,
  TremorLevel,
  TremorLevelSeries,
} from './TremorLevel';
export type { MedicationEvent } from './MedicationEvent';
export type {
  MedicationStatus,
  MessageType,
  ChatMessage,
  ActionButton,
  MedicationPlan,
} from './MedicationStatus';
export type { ThresholdConfig } from './ThresholdConfig';
export type { ClinicReport, ClinicReportMetrics } from './ClinicReport';
export type { DeviceStatus } from './DeviceStatus';
export type { PatientProfile, MedicationPlanItem } from './PatientProfile';
export type { WristbandBinding } from './WristbandBinding';
