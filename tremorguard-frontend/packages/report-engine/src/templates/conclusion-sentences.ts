import type { ReportMetrics } from '../types';

/**
 * 结论句模板
 *
 * 患者可读版（patientFriendly=true）：使用日常语言，避免医学术语
 * 医生可读版（patientFriendly=false）：使用临床术语，提供量化数据
 */

export interface ConclusionTemplate {
  readonly id: string;
  readonly condition: (metrics: ReportMetrics) => boolean;
  readonly patientFriendly: string;
  readonly doctor: string;
}

/**
 * 控制率相关结论模板
 */
export const CONTROL_RATE_TEMPLATES: readonly ConclusionTemplate[] = [
  {
    id: 'control_good',
    condition: (m) => m.controlRate >= 0.8,
    patientFriendly: '最近一段时间，您的震颤控制得不错，大部分时间都保持在平稳状态。',
    doctor: '控制率 {controlRate}%，达到良好控制标准（≥80%）。',
  },
  {
    id: 'control_moderate',
    condition: (m) => m.controlRate >= 0.5 && m.controlRate < 0.8,
    patientFriendly:
      '您的震颤控制有波动，部分时间出现明显震颤，建议就诊时告知医生。',
    doctor: '控制率 {controlRate}%，控制欠佳，存在剂末现象或剂量不足可能。',
  },
  {
    id: 'control_poor',
    condition: (m) => m.controlRate < 0.5,
    patientFriendly:
      '您的震颤控制不理想，超过一半时间出现明显震颤，请尽快就诊调整用药。',
    doctor: '控制率 {controlRate}%，控制差，建议调整用药方案。',
  },
] as const;

/**
 * 剂末提前相关结论模板
 */
export const WEARING_OFF_TEMPLATES: readonly ConclusionTemplate[] = [
  {
    id: 'wearing_off_none',
    condition: (m) => m.wearingOffAdvanceMin < 15,
    patientFriendly: '药效持续时间正常，没有提前失效的情况。',
    doctor: '未见明显剂末提前（<15 分钟）。',
  },
  {
    id: 'wearing_off_mild',
    condition: (m) => m.wearingOffAdvanceMin >= 15 && m.wearingOffAdvanceMin < 30,
    patientFriendly:
      '药效比预期提前 {wearingOffAdvanceMin} 分钟消退，建议关注服药时间。',
    doctor: '剂末提前 {wearingOffAdvanceMin} 分钟，轻度，可考虑缩短给药间隔。',
  },
  {
    id: 'wearing_off_severe',
    condition: (m) => m.wearingOffAdvanceMin >= 30,
    patientFriendly:
      '药效明显提前失效（提前 {wearingOffAdvanceMin} 分钟），请就诊时告知医生。',
    doctor: '剂末提前 {wearingOffAdvanceMin} 分钟，明显，建议调整给药方案。',
  },
] as const;

/**
 * 模板变量替换
 */
export function fillTemplate(
  template: string,
  metrics: ReportMetrics,
): string {
  return template
    .replace('{controlRate}', `${Math.round(metrics.controlRate * 100)}`)
    .replace('{wearingOffAdvanceMin}', `${metrics.wearingOffAdvanceMin}`);
}

/**
 * 所有模板集合
 */
export const ALL_TEMPLATES: readonly ConclusionTemplate[] = [
  ...CONTROL_RATE_TEMPLATES,
  ...WEARING_OFF_TEMPLATES,
] as const;
