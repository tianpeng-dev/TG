/**
 * 平台检测与令牌格式适配
 *
 * RN 端：直接使用 colors.ts / typography.ts 中的对象
 * Web 端：通过 tokens.css 中的 CSS 变量引用
 */

export type Platform = 'react-native' | 'web' | 'test';

/**
 * 运行时平台检测
 *
 * 使用 globalThis + 类型守卫，避免依赖 DOM lib（RN 端 lib 不含 DOM）。
 */
export function detectPlatform(): Platform {
  const g = globalThis as { navigator?: { product?: string }; window?: unknown };
  if (typeof g.navigator !== 'undefined' && g.navigator?.product === 'ReactNative') {
    return 'react-native';
  }
  if (typeof g.window !== 'undefined') {
    return 'web';
  }
  return 'test';
}

/**
 * 当前平台
 */
export const CURRENT_PLATFORM: Platform = detectPlatform();
