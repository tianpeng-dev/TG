import type { TremorLevelSeries } from '@tremorguard/shared-types';
import type { BLEError } from './errors';

/**
 * BLE 连接状态（状态机）
 *
 * 状态流转：
 *   disconnected → scanning → connecting → connected
 *                ↘ reconnecting → connecting → connected
 *   connected → disconnected（主动断开或心跳超时）
 */
export type BLEConnectionState =
  | { readonly status: 'disconnected'; readonly lastError?: BLEError }
  | { readonly status: 'scanning'; readonly startedAt: number }
  | { readonly status: 'connecting'; readonly deviceAddress: string }
  | {
      readonly status: 'connected';
      readonly deviceAddress: string;
      readonly mtu: number;
      readonly rssi: number;
    }
  | {
      readonly status: 'reconnecting';
      readonly attempt: number;
      readonly nextAttemptAt: number;
    };

/**
 * BLE 管理器接口 —— 由具体平台实现（react-native-ble-plx 适配器）
 *
 * 约束：
 * - 数据延迟 < 10ms（通过 onLatencyViolation 监控）
 * - 自动重连（autoReconnect 默认 true）
 * - 心跳检测（enableHeartbeat，间隔 ≤ 5s）
 */
export interface BLEManager {
  /** 当前连接状态（只读） */
  readonly state: Readonly<BLEConnectionState>;

  /**
   * 扫描腕带设备（按 service UUID 过滤）
   * @param timeoutMs 扫描超时（毫秒）
   */
  scanDevices(timeoutMs: number): AsyncIterable<BLEDevice>;

  /**
   * 连接指定设备，协商 MTU
   */
  connect(deviceAddress: string, options?: ConnectOptions): Promise<void>;

  /** 主动断开 */
  disconnect(): Promise<void>;

  /**
   * 订阅震颤数据流（50Hz 特征值通知）
   * 返回 AsyncIterable，每次 yield 一个数据窗口
   */
  subscribeTremorStream(): AsyncIterable<TremorLevelSeries>;

  /**
   * 启用心跳检测
   * @param intervalMs 心跳间隔（毫秒），≤ 5000
   * 超时未收到心跳响应 → 触发自动重连
   */
  enableHeartbeat(intervalMs: number): void;

  /** 注册状态变更监听 */
  onStateChange(listener: (state: BLEConnectionState) => void): Unsubscribe;

  /**
   * 注册数据延迟监控
   * 约束：< 10ms，超过阈值触发 listener
   * @param listener 回调，参数为实际延迟（ms）
   */
  onLatencyViolation(listener: (latencyMs: number) => void): Unsubscribe;
}

/**
 * 连接选项
 */
export interface ConnectOptions {
  /** MTU 大小，默认 185 */
  readonly mtu?: number;
  /** 是否启用自动重连，默认 true */
  readonly autoReconnect?: boolean;
  /** 最大重连尝试次数，默认 10 */
  readonly maxReconnectAttempts?: number;
  /** 重连退避基数（毫秒），默认 1000，每次翻倍 */
  readonly reconnectBackoffMs?: number;
}

/**
 * BLE 设备信息
 */
export interface BLEDevice {
  readonly address: string;
  readonly name: string;
  readonly rssi: number;
  readonly advertisedServices: readonly string[];
}

/**
 * 取消订阅函数
 */
export type Unsubscribe = () => void;
