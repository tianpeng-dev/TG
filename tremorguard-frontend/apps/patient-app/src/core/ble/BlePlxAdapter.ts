/**
 * BLE 平台适配器占位
 *
 * 实现 @tremorguard/ble-core 的 BLEManager 接口
 * 基于 react-native-ble-plx
 *
 * P0 阶段实现：
 * - 设备扫描
 * - MTU 协商
 * - 震颤数据流订阅
 * - 心跳协议
 * - 自动重连
 */
import type { BLEManager } from '@tremorguard/ble-core';

export class BlePlxAdapter implements BLEManager {
  // P0 阶段实现
  readonly state = { status: 'disconnected' as const };

  async *scanDevices(_timeoutMs: number): AsyncIterable<never> {
    // P0 阶段实现
    throw new Error('Not implemented - P0 阶段实现');
  }

  async connect(_deviceAddress: string): Promise<void> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async disconnect(): Promise<void> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  async *subscribeTremorStream(): AsyncIterable<never> {
    throw new Error('Not implemented - P0 阶段实现');
  }

  enableHeartbeat(_intervalMs: number): void {
    throw new Error('Not implemented - P0 阶段实现');
  }

  onStateChange(_listener: (state: never) => void): () => void {
    return () => {};
  }

  onLatencyViolation(_listener: (latencyMs: number) => void): () => void {
    return () => {};
  }
}
