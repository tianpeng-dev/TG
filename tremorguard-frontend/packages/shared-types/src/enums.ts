/**
 * 共享枚举
 */

/** 药效阶段 */
export enum Phase {
  On = 'ON',           // 药效期
  Transition = 'TRANSITION', // 过渡期
  Off = 'OFF',         // 剂末期
}

/** 数据同步状态 */
export enum SyncStatus {
  Idle = 'IDLE',
  Pending = 'PENDING',
  Syncing = 'SYNCING',
  Offline = 'OFFLINE',
  Error = 'ERROR',
}

/** BLE 连接状态 */
export enum BLEConnectionStatus {
  Disconnected = 'DISCONNECTED',
  Scanning = 'SCANNING',
  Connecting = 'CONNECTING',
  Connected = 'CONNECTED',
  Reconnecting = 'RECONNECTING',
}

/** 用户角色 */
export enum UserRole {
  Patient = 'PATIENT',
  Doctor = 'DOCTOR',
  Admin = 'ADMIN',
  Caregiver = 'CAREGIVER',
}

/** 数据导出格式 */
export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  PDF = 'PDF',
  A4Print = 'A4_PRINT',
}
