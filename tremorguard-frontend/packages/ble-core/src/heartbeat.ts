/**
 * 心跳协议类型定义
 */

/**
 * 心跳配置
 */
export interface HeartbeatConfig {
  /** 心跳间隔（毫秒），默认 3000 */
  readonly intervalMs: number;
  /** 心跳超时（毫秒），默认 5000 */
  readonly timeoutMs: number;
  /** 最大丢失次数，超过触发重连，默认 2 */
  readonly maxMissed: number;
}

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  intervalMs: 3000,
  timeoutMs: 5000,
  maxMissed: 2,
} as const;

/**
 * 心跳事件
 */
export interface HeartbeatEvent {
  readonly type: 'beat' | 'missed' | 'timeout';
  readonly sequence: number;
  /** 本次心跳往返延迟（毫秒） */
  readonly latencyMs: number;
  readonly timestamp: number;
}

/**
 * 心跳事件监听器
 */
export type HeartbeatEventListener = (event: HeartbeatEvent) => void;
