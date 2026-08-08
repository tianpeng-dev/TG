/**
 * @tremorguard/report-engine
 * 报告引擎统一导出
 */

// 核心接口
export type {
  ReportInput,
  ReportMetrics,
  MetricsCalculator,
  ConclusionTranslator,
  ReportRenderer,
  ReportGenerator,
} from './types';

// 指标计算器
export type { ControlRateCalculator } from './metrics/control-rate';
export { defaultControlRateCalculator } from './metrics/control-rate';

export type { WearingOffCalculator } from './metrics/wearing-off';
export {
  defaultWearingOffCalculator,
  DEFAULT_ON_DURATION_HOURS,
  DEFAULT_TRANSITION_DURATION_HOURS,
} from './metrics/wearing-off';

// 结论句模板
export type { ConclusionTemplate } from './templates/conclusion-sentences';
export {
  CONTROL_RATE_TEMPLATES,
  WEARING_OFF_TEMPLATES,
  ALL_TEMPLATES,
  fillTemplate,
} from './templates/conclusion-sentences';

// 错误类型
export {
  ReportError,
  MetricsCalculationError,
  TranslationError,
  RenderError,
  ReportErrorCode,
} from './errors';
