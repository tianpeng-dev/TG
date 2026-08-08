/**
 * 阈值配置 —— 用于触发腕带震动提醒与 App 通知
 */
export interface ThresholdConfig {
  readonly patientId: string;
  /** 震颤等级警戒线（≥ 此值触发提醒） */
  readonly severityThreshold: 1 | 2 | 3 | 4;
  /** 持续时长阈值（秒），超过此时长才触发 */
  readonly durationSeconds: number;
  /** 提醒方式 */
  readonly alertChannels: readonly ('wristband_vibration' | 'app_notification' | 'sms')[];
  /** 配置来源：语音设定 / 历史回溯 / 手动输入 */
  readonly setBy: 'voice' | 'history' | 'manual';
  /** 配置生效时间 */
  readonly createdAt: string;
  readonly clientVersion: number;
}
