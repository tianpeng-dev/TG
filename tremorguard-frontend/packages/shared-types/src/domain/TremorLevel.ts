/**
 * 震颤等级（0-4 级，对应 PRD 中的 5 级分类）
 */
export type TremorSeverity = 0 | 1 | 2 | 3 | 4;

/**
 * 单帧震颤测量样本
 */
export interface TremorLevel {
  /** ISO 8601 时间戳 */
  readonly timestamp: string;
  /** 震颤严重度 0-4 */
  readonly severity: TremorSeverity;
  /** 震颤频率（Hz），由算法团队提供 */
  readonly frequencyHz?: number;
  /** 震颤振幅，由算法团队提供 */
  readonly amplitude?: number;
  /** 数据来源：腕带自动采集 or 用户手动标记 */
  readonly source: 'wristband' | 'manual';
}

/**
 * 震颤数据序列 —— 50Hz 采样率下的连续帧
 */
export interface TremorLevelSeries {
  readonly patientId: string;
  readonly startTime: string;
  readonly endTime: string;
  /** 50Hz → 每 20ms 一帧 */
  readonly samples: readonly TremorLevel[];
  readonly samplingRateHz: 50;
}
