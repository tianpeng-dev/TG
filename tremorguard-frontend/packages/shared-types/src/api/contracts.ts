import type { PatientProfile } from '../domain/PatientProfile';
import type { ClinicReport } from '../domain/ClinicReport';
import type { DeviceStatus } from '../domain/DeviceStatus';

/**
 * REST API 请求/响应契约
 */

// ====== 患者相关 ======

export interface CreatePatientRequest {
  readonly name: string;
  readonly gender: PatientProfile['gender'];
  readonly birthDate: string;
  readonly phone?: string;
}

export interface CreatePatientResponse {
  readonly patient: PatientProfile;
}

export interface GetPatientRequest {
  readonly patientId: string;
}

export interface GetPatientResponse {
  readonly patient: PatientProfile;
}

// ====== 报告相关 ======

export interface GenerateReportRequest {
  readonly patientId: string;
  readonly startDate: string;
  readonly endDate: string;
}

export interface GenerateReportResponse {
  readonly report: ClinicReport;
}

export interface GetReportRequest {
  readonly reportId: string;
}

export interface GetReportResponse {
  readonly report: ClinicReport;
}

// ====== 设备相关 ======

export interface GetDeviceStatusRequest {
  readonly deviceId: string;
}

export interface GetDeviceStatusResponse {
  readonly status: DeviceStatus;
}

// ====== 通用 ======

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
