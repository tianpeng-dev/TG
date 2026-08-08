/**
 * 设备状态
 */
export interface DeviceStatus {
  readonly deviceId: string;
  readonly patientId?: string;
  /** 电池电量百分比 0-100 */
  readonly batteryLevel: number;
  /** 充电状态 */
  readonly charging: boolean;
  /** 固件版本 */
  readonly firmwareVersion: string;
  /** 硬件版本 */
  readonly hardwareVersion: string;
  /** 最后同步时间 */
  readonly lastSyncedAt?: string;
  /** 设备状态 */
  readonly status: 'online' | 'offline' | 'error' | 'maintenance';
  /** 错误信息 */
  readonly lastError?: string;
  /** 信号强度（RSSI, dBm） */
  readonly rssi?: number;
}
