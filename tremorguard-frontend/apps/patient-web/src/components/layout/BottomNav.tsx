/**
 * 底部导航组件（仅移动端）
 * 对照设计稿：tremorguard-app/pages/home.html
 *
 * 移动端：底部固定导航
 * 桌面端：使用 DesktopSidebar 替代
 */
import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, ProfileIcon, ReportsIcon } from '../icons/Icons';

type TabKey = 'home' | 'reports' | 'profile';

interface TabConfig {
  key: TabKey;
  label: string;
  href: string;
}

const TABS: readonly TabConfig[] = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'reports', label: '报告', href: '/reports' },
  { key: 'profile', label: '我的', href: '/profile' },
] as const;

export function BottomNav() {
  const location = useLocation();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-border bg-card px-0 pb-[env(safe-area-inset-bottom,0)] md:hidden"
      role="navigation"
      aria-label="底部导航"
      style={{ height: 'var(--tg-tabbar-height)' }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <NavLink
            key={tab.key}
            to={tab.href}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center border-none bg-transparent tg-pressable ${
              active ? 'text-primary' : 'text-muted-foreground'
            }`}
            style={{ padding: '4px 0', gap: 4 }}
          >
            {tab.key === 'home' ? (
              <HomeIcon size={24} filled={active} />
            ) : tab.key === 'reports' ? (
              <ReportsIcon size={24} />
            ) : (
              <ProfileIcon size={24} />
            )}
            <span
              className="max-w-full overflow-hidden whitespace-nowrap font-medium"
              style={{ fontSize: 'var(--tg-text-xs)', textOverflow: 'ellipsis' }}
            >
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}