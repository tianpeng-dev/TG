/**
 * 字号令牌（来自设计稿 CSS 变量）
 *
 * 无障碍约束：
 * - 最小正文字号 14px（辅助文字）
 * - 正文 16-18px
 * - 关键数字 ≥ 24px
 * - 行高 1.3-1.7（标题-正文）
 */

export const Typography = {
  /** 辅助文字（14px） */
  xs: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  /** 正文小号（16px） */
  sm: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  /** 正文标准（18px） */
  base: { fontSize: 18, fontWeight: '400' as const, lineHeight: 27 },
  /** 卡片标题（20px） */
  lg: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  /** 页面标题（24px） */
  xl: { fontSize: 24, fontWeight: '700' as const, lineHeight: 31 },
  /** 关键数字（28px） */
  xxl: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  /** 大号标题（32px） */
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 42 },
} as const;

export type TypographyToken = keyof typeof Typography;

/**
 * 字重常量
 */
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * 行高常量
 */
export const LineHeight = {
  tight: 1.3,
  normal: 1.5,
  relaxed: 1.7,
};
