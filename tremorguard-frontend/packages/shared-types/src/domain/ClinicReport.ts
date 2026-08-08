import type { TremorLevelSeries } from './TremorLevel';
import type { MedicationEvent } from './MedicationEvent';

/**
 * 就诊报告 —— MVP 核心产物
 */
export interface ClinicReport {
  readonly id: string;
  readonly patientId: string;
  readonly startDate: string;
  readonly endDate: string;
  /** 报告生成时间 */
  readonly generatedAt: string;
  /** 报告指标 */
  readonly metrics: ClinicReportMetrics;
  /** 临床结论句（患者可读版本） */
  readonly patientFriendlyConclusions: readonly string[];
  /** 临床结论句（医生可读版本） */
  readonly doctorConclusions: readonly string[];
  /** 原始数据快照（用于审计） */
  readonly dataSnapshot: {
    readonly tremorSeries: TremorLevelSeries;
    readonly medicationEvents: readonly MedicationEvent[];
  };
  /** 报告版本号 */
  readonly reportVersion: number;
}

/**
 * 就诊报告核心指标
 */
export interface ClinicReportMetrics {
  /** 控制率 0-1 */
  readonly controlRate: number;
  /** 剂末提前分钟数 */
  readonly wearingOffAdvanceMin: number;
  /** 开期总时长（小时） */
  readonly onPhaseHours: number;
  /** 关期总时长（小时） */
  readonly offPhaseHours: number;
  /** 异动次数（v2） */
  readonly dyskinesiaEpisodes?: number;
}
