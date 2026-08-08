/**
 * Report Engine 错误类型
 */
export abstract class ReportError extends Error {
  abstract readonly code: ReportErrorCode;
  readonly timestamp: number = Date.now();

  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}

export class MetricsCalculationError extends ReportError {
  readonly code = ReportErrorCode.MetricsCalculationFailed;
}

export class TranslationError extends ReportError {
  readonly code = ReportErrorCode.TranslationFailed;
}

export class RenderError extends ReportError {
  readonly code = ReportErrorCode.RenderFailed;
}

export enum ReportErrorCode {
  MetricsCalculationFailed = 'METRICS_CALCULATION_FAILED',
  TranslationFailed = 'TRANSLATION_FAILED',
  RenderFailed = 'RENDER_FAILED',
  InvalidInput = 'INVALID_INPUT',
  TemplateNotFound = 'TEMPLATE_NOT_FOUND',
}
