/**
 * 间距令牌（来自设计稿 CSS 变量）
 *
 * 4 倍数原则：所有间距为 4 的倍数
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export type SpacingToken = keyof typeof Spacing;

/**
 * 圆角令牌（来自设计稿）
 */
export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

/**
 * 阴影令牌（静态：alpha <= 0.05）
 */
export const Shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  overlay: {
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 48,
    elevation: 16,
  },
} as const;

/**
 * 尺寸令牌
 */
export const Sizes = {
  /** 最小可点击区域 48px（适配震颤用户） */
  minTouchTarget: 48,
  /** 状态栏高度 */
  statusBarHeight: 44,
  /** 顶部导航高度 */
  topNavHeight: 56,
  /** 底部导航高度 */
  bottomNavHeight: 64,
  /** 底部导航桌面端宽度 */
  bottomNavWidthDesktop: 72,
} as const;
