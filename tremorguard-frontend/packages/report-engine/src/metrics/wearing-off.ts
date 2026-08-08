import type { ReportInput } from '../types';

/**
 * 剂末提前计算接口
 *
 * 剂末提前定义：实际"开期"结束时间早于预期（基于历史用药数据）
 *
 * 算法（待算法团队确认）：
 *   expectedOffTime = medicationTime + standardOnDuration
 *   actualOffTime = detectOffTransition(tremorSeries)
 *   wearingOffAdvanceMin = (expectedOffTime - actualOffTime) in minutes
 */
export interface WearingOffCalculator {
  calculate(input: ReportInput): Promise<number>;
}

/**
 * 默认剂末提前计算实现（占位，待 P0 阶段算法团队确认后补全）
 *
 * 占位逻辑：返回 0（无提前），实际逻辑待算法团队提供
 */
export const defaultWearingOffCalculator: WearingOffCalculator = {
  async calculate(_input: ReportInput): Promise<number> {
    return 0;
  },
};

/**
 * 标准"开期"时长（小时）
 * 默认 2.5h，可根据患者用药方案调整
 */
export const DEFAULT_ON_DURATION_HOURS = 2.5 as const;

/**
 * 过渡期时长（小时）
 */
export const DEFAULT_TRANSITION_DURATION_HOURS = 1.0 as const;
