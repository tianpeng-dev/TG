/**
 * BLE 数据包结构定义
 */

/**
 * 震颤数据包（来自腕带的原始数据包）
 * 50Hz 采样 → 每包 N 帧（具体由 MTU 决定）
 */
export interface TremorDataPacket {
  /** 包序号（用于丢包检测） */
  readonly sequence: number;
  /** 起始时间戳（腕带本地时钟，毫秒） */
  readonly startTimestamp: number;
  /** 帧数 */
  readonly frameCount: number;
  /** 原始字节数据（加速度 + 陀螺仪） */
  readonly rawBytes: Uint8Array;
  /** CRC 校验值 */
  readonly crc: number;
}

/**
 * 心跳请求包
 */
export interface HeartbeatRequest {
  readonly sequence: number;
  readonly clientTimestamp: number;
}

/**
 * 心跳响应包
 */
export interface HeartbeatResponse {
  readonly sequence: number;
  readonly clientTimestamp: number;
  readonly serverTimestamp: number;
}

/**
 * 服药确认包
 */
export interface MedicationConfirmPacket {
  readonly patientId: string;
  readonly timestamp: number;
  readonly medicationName: string;
  readonly dosageMg: number;
}

/**
 * 解析震颤数据包（接口契约，具体实现由适配器完成）
 */
export interface TremorPacketParser {
  parse(packet: TremorDataPacket): Promise<readonly ParsedTremorFrame[]>;
}

export interface ParsedTremorFrame {
  readonly timestamp: number;
  readonly accelX: number;
  readonly accelY: number;
  readonly accelZ: number;
  readonly gyroX: number;
  readonly gyroY: number;
  readonly gyroZ: number;
}
