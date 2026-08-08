/**
 * BLE 错误类型层级
 */
export abstract class BLEError extends Error {
  abstract readonly code: BLEErrorCode;
  readonly timestamp: number = Date.now();

  constructor(message: string) {
    super(message);
    this.name = 'BLEError';
  }
}

export class BLEScanError extends BLEError {
  readonly code = BLEErrorCode.ScanFailed;
}

export class BLEConnectionTimeoutError extends BLEError {
  readonly code = BLEErrorCode.ConnectionTimeout;
}

export class BLEDeviceNotFoundError extends BLEError {
  readonly code = BLEErrorCode.DeviceNotFound;
}

export class BLESubscriptionError extends BLEError {
  readonly code = BLEErrorCode.SubscriptionFailed;
}

export class BLEHeartbeatTimeoutError extends BLEError {
  readonly code = BLEErrorCode.HeartbeatTimeout;
}

export class BLELatencyExceededError extends BLEError {
  readonly code = BLEErrorCode.LatencyExceeded;
}

export class BLEAuthenticationError extends BLEError {
  readonly code = BLEErrorCode.AuthenticationFailed;
}

/**
 * BLE 错误码
 */
export enum BLEErrorCode {
  ScanFailed = 'SCAN_FAILED',
  ConnectionTimeout = 'CONNECTION_TIMEOUT',
  DeviceNotFound = 'DEVICE_NOT_FOUND',
  SubscriptionFailed = 'SUBSCRIPTION_FAILED',
  HeartbeatTimeout = 'HEARTBEAT_TIMEOUT',
  /** 延迟 > 10ms */
  LatencyExceeded = 'LATENCY_EXCEEDED',
  AuthenticationFailed = 'AUTH_FAILED',
}
