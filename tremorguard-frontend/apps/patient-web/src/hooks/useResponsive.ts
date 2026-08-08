/**
 * 响应式布局 Hook
 * 提供多端断点检测与设备类型判定
 *
 * 断点对齐 Tailwind：
 *  - mobile:   < 768px
 *  - tablet:   768px - 1023px
 *  - desktop:  1024px - 1439px
 *  - wide:     >= 1440px
 */
import { useEffect, useState } from 'react';

export type Device = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ResponsiveInfo {
  width: number;
  height: number;
  device: Device;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  /** sidebar 显示宽度（移动端 0，桌面端 240） */
  sidebarWidth: number;
  /** info panel 显示宽度（仅 wide 端显示 320） */
  infoPanelWidth: number;
}

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;
const WIDE_MIN = 1440;

function getInfo(width: number): ResponsiveInfo {
  const isMobile = width < TABLET_MIN;
  const isTablet = width >= TABLET_MIN && width < DESKTOP_MIN;
  const isDesktop = width >= DESKTOP_MIN && width < WIDE_MIN;
  const isWide = width >= WIDE_MIN;

  const device: Device = isMobile
    ? 'mobile'
    : isTablet
      ? 'tablet'
      : isDesktop
        ? 'desktop'
        : 'wide';

  return {
    width,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
    device,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    sidebarWidth: isMobile ? 0 : 240,
    infoPanelWidth: isWide ? 320 : 0,
  };
}

export function useResponsive(): ResponsiveInfo {
  const [info, setInfo] = useState<ResponsiveInfo>(() => {
    if (typeof window === 'undefined') {
      return getInfo(1440);
    }
    return getInfo(window.innerWidth);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setInfo(getInfo(window.innerWidth));
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return info;
}
