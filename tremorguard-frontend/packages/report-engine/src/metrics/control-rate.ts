import type { ReportInput, ReportMetrics } from '../types';

/**
 * 控制率计算接口
 *
 * 控制率定义：震颤等级 ≤ 阈值的时间占比
 *
 * 算法（待算法团队确认伪代码）：
 *   controlRate = sum(severity <= threshold ? duration : 0) / totalDuration
 */
export interface ControlRateCalculator {
  calculate(input: ReportInput): Promise<number>;
}

/**
 * 默认控制率计算实现（占位，待 P0 阶段算法团队确认后补全）
 */
export const defaultControlRateCalculator: ControlRateCalculator = {
  async calculate(input: ReportInput): Promise<number> {
    const { tremorSeries, threshold } = input;
    if (tremorSeries.length === 0) return 0;

    const controlled = tremorSeries.filter((s) => s.severity <= threshold).length;
    return controlled / tremorSeries.length;
  },
};
