import type {
  TremorLevel,
  MedicationEvent,
  ClinicReport,
} from '@tremorguard/shared-types';

/**
 * 报告生成输入
 */
export interface ReportInput {
  readonly tremorSeries: readonly TremorLevel[];
  readonly medicationEvents: readonly MedicationEvent[];
  readonly startDate: string;
  readonly endDate: string;
  /** 震颤警戒线阈值 */
  readonly threshold: number;
}

/**
 * 报告指标
 */
export interface ReportMetrics {
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

/**
 * 指标计算器接口
 *
 * 实现方：report-engine 内部提供默认实现
 * 算法依据：算法团队提供的伪代码（P0 启动前确认）
 */
export interface MetricsCalculator {
  calculate(input: ReportInput): Promise<ReportMetrics>;
}

/**
 * 临床结论句翻译器
 *
 * 将量化指标翻译为患者/医生可读的句子
 */
export interface ConclusionTranslator {
  /**
   * 将 metrics 翻译为临床结论句
   * @param metrics 量化指标
   * @param patientFriendly true=患者可读版，false=医生可读版
   */
  translate(metrics: ReportMetrics, patientFriendly: true): Promise<readonly string[]>;
  translate(metrics: ReportMetrics, patientFriendly: false): Promise<readonly string[]>;
}

/**
 * 报告渲染器
 *
 * 输出格式：
 * - pdf：标准 PDF（就诊报告主格式）
 * - html：HTML 预览（Web 端预览用）
 * - a4-print：A4 打印排版（20mm 边距，灰度图表，医生签字栏）
 */
export interface ReportRenderer {
  render(report: ClinicReport, format: 'pdf' | 'html' | 'a4-print'): Promise<Uint8Array>;
}

/**
 * 报告生成器（高层接口，组合 Calculator + Translator + Renderer）
 */
export interface ReportGenerator {
  generate(input: ReportInput): Promise<ClinicReport>;
}
