/**
 * @tremorguard/ble-core
 * BLE 服务抽象层统一导出
 */

// 核心接口
export type {
  BLEManager,
  BLEConnectionState,
  ConnectOptions,
  BLEDevice,
  Unsubscribe,
} from './types';

// 错误类型
export {
  BLEError,
  BLEScanError,
  BLEConnectionTimeoutError,
  BLEDeviceNotFoundError,
  BLESubscriptionError,
  BLEHeartbeatTimeoutError,
  BLELatencyExceededError,
  BLEAuthenticationError,
  BLEErrorCode,
} from './errors';

// 心跳协议
export type {
  HeartbeatConfig,
  HeartbeatEvent,
  HeartbeatEventListener,
} from './heartbeat';
export { DEFAULT_HEARTBEAT_CONFIG } from './heartbeat';

// 状态机守卫
export {
  isDisconnected,
  isScanning,
  isConnecting,
  isConnected,
  isReconnecting,
  isActive,
  isTransitioning,
} from './state-machine';

// GATT Profile
export {
  TREMORGUARD_SERVICE_UUID,
  TREMOR_STREAM_CHARACTERISTIC_UUID,
  HEARTBEAT_CHARACTERISTIC_UUID,
  MEDICATION_CONFIRM_CHARACTERISTIC_UUID,
  DEVICE_INFO_CHARACTERISTIC_UUID,
  TREMORGUARD_GATT_PROFILE,
} from './protocol/gatt-profile';
export type {
  GattServiceDescriptor,
  GattCharacteristicDescriptor,
} from './protocol/gatt-profile';

// 数据包结构
export type {
  TremorDataPacket,
  HeartbeatRequest,
  HeartbeatResponse,
  MedicationConfirmPacket,
  TremorPacketParser,
  ParsedTremorFrame,
} from './protocol/packet-schema';
