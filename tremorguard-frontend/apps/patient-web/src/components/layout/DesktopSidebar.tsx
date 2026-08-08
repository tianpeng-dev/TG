/**
 * 桌面端侧边栏
 * 严格对照设计稿：tremorguard-app/pages/desktop-home.html 第 168-224 行
 */
import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, ReportsIcon, ProfileIcon, WatchIcon } from '../icons/Icons';

const TABS = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'reports', label: '报告', href: '/reports' },
  { key: 'profile', label: '我的', href: '/profile' },
] as const;

export function DesktopSidebar() {
  const location = useLocation();

  const isActive = (href: string): boolean => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className="flex h-screen w-[240px] flex-shrink-0 flex-col"
      style={{ background: 'var(--tg-primary)' }}
      aria-label="主导航"
    >
      {/* Logo: 64px height, gap-3, px-6 */}
      <div className="flex flex-shrink-0 items-center gap-3 px-6" style={{ height: 64 }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 32, height: 32, background: 'var(--tg-primary-light)' }}
        >
          <WatchIcon size={18} color="#fff" />
        </div>
        <span
          className="font-bold tracking-tight text-white"
          style={{ fontSize: 'var(--tg-text-lg)' }}
        >
          TremorGuard
        </span>
      </div>

      {/* Navigation: flex-1, px-3, mt-4 */}
      <nav className="flex-1 px-3" style={{ marginTop: 16 }}>
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <NavLink
              key={tab.key}
              to={tab.href}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={`mt-1 flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                active ? 'text-white' : 'text-white/65 tg-hover-nav'
              }`}
              style={{
                ...(active ? { background: 'var(--tg-primary-light)' } : {}),
                fontSize: 'var(--tg-text-base)',
              }}
            >
              {tab.key === 'home' ? (
                <HomeIcon size={20} filled={active} />
              ) : tab.key === 'reports' ? (
                <ReportsIcon size={20} />
              ) : (
                <ProfileIcon size={20} />
              )}
              <span
                className="font-medium"
                style={{ fontSize: 'var(--tg-text-base)' }}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User section: bottom, border-t, pt-4, gap-3 */}
      <div className="flex-shrink-0 px-4 pb-5">
        <div
          className="border-t pt-4"
          style={{ borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ width: 36, height: 36, background: 'var(--tg-primary-light)' }}
            >
              张
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">张秀兰</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className="rounded-full"
                  style={{ width: 8, height: 8, background: '#4ADE80' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  设备已连接
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}