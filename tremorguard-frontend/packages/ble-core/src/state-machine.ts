import type { BLEConnectionState } from './types';

/**
 * BLE 连接状态机类型守卫
 */

export function isDisconnected(
  state: BLEConnectionState,
): state is Extract<BLEConnectionState, { status: 'disconnected' }> {
  return state.status === 'disconnected';
}

export function isScanning(
  state: BLEConnectionState,
): state is Extract<BLEConnectionState, { status: 'scanning' }> {
  return state.status === 'scanning';
}

export function isConnecting(
  state: BLEConnectionState,
): state is Extract<BLEConnectionState, { status: 'connecting' }> {
  return state.status === 'connecting';
}

export function isConnected(
  state: BLEConnectionState,
): state is Extract<BLEConnectionState, { status: 'connected' }> {
  return state.status === 'connected';
}

export function isReconnecting(
  state: BLEConnectionState,
): state is Extract<BLEConnectionState, { status: 'reconnecting' }> {
  return state.status === 'reconnecting';
}

/**
 * 是否处于活跃连接状态（已连接或重连中）
 */
export function isActive(state: BLEConnectionState): boolean {
  return state.status === 'connected' || state.status === 'reconnecting';
}

/**
 * 是否处于过渡状态（扫描/连接/重连中）
 */
export function isTransitioning(state: BLEConnectionState): boolean {
  return (
    state.status === 'scanning' ||
    state.status === 'connecting' ||
    state.status === 'reconnecting'
  );
}
