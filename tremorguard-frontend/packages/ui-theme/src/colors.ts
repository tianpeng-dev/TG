/**
 * TremorGuard 品牌设计系统颜色令牌
 * 基于设计稿 CSS 变量，面向帕金森患者的高可访问性设计
 *
 * 设计原则：
 * - 主色 Teal 传达医疗专业性与安心感
 * - 状态色采用背景 + 文字双色配对，满足色彩非唯一标识规则
 * - 大字号、高对比度，适配老年人视力
 */

export const Colors = {
  // === 主色系 ===
  primary: '#0F766E',
  primaryForeground: '#FFFFFF',
  primaryLight: '#14B8A6',

  // === 语义状态色 ===
  success: '#059669',
  successForeground: '#FFFFFF',
  successLight: '#ECFDF5',

  warning: '#D97706',
  warningForeground: '#FFFFFF',
  warningLight: '#FFFBEB',

  error: '#DC2626',
  errorForeground: '#FFFFFF',
  errorLight: '#FEF2F2',

  info: '#0891B2',
  infoForeground: '#FFFFFF',
  infoLight: '#ECFEFF',

  // === 中性色阶 ===
  neutral50: '#F8F9FB',
  neutral100: '#F1F3F5',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#1A1D23',

  // === 表面/卡片色 ===
  background: '#F8F9FB',
  foreground: '#1A1D23',
  card: '#FFFFFF',
  cardForeground: '#1A1D23',
  muted: '#F1F3F5',
  mutedForeground: '#6B7280',
  popover: '#FFFFFF',
  popoverForeground: '#1A1D23',
  border: '#E5E7EB',
  input: '#E5E7EB',
  ring: '#0F766E',

  // === 消息气泡色 ===
  msgSystem: '#F0FDFA',
  msgUser: '#ECFEFF',
  msgAlert: '#FFFBEB',
  msgConfirmed: '#ECFDF5',

  // === 药效色带（用于时间轴可视化）===
  onPhase: '#34D399',
  transitionPhase: '#FBBF24',
  offPhase: '#F87171',
} as const;

export type ColorToken = keyof typeof Colors;
