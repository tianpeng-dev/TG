/**
 * TremorGuard Patient Web - 应用根组件
 * 严格对照设计稿：tremorguard-app/pages/AI 对话首页（桌面端）.html
 *
 * 响应式布局（基于 useResponsive 断点）：
 *  - 移动端  (< 768px)：底部 Tab 导航 + 全屏主内容
 *  - 桌面端  (768-1439px)：左侧 240px 侧边栏 + 主对话区
 *  - 大屏端  (>= 1440px)：左侧 240px 侧边栏 + 主对话区 + 右侧 320px 今日概览
 *
 * 大屏端使用 flex 布局：sidebar | main | infoPanel
 * 避免 position: fixed 带来的视口差异/包含块问题
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { BottomNav } from './components/layout/BottomNav';
import { InfoPanel } from './components/layout/InfoPanel';
import { HomePage } from './pages/Home/HomePage';
import { useResponsive } from './hooks/useResponsive';

export default function App() {
  const responsive = useResponsive();

  return (
    <div
      className="flex min-h-screen w-full"
      style={{ background: 'var(--tg-background)' }}
    >
      {/* 桌面端/大屏端左侧侧边栏 */}
      {!responsive.isMobile && <DesktopSidebar />}

      {/* 主内容区：占据剩余空间 */}
      <main
        className="flex min-h-screen min-w-0 flex-1 flex-col"
        style={{
          paddingBottom: responsive.isMobile ? 'var(--tg-tabbar-height)' : 0,
          transition: 'padding var(--tg-duration-normal) var(--tg-ease-out)',
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<HomePage />} />
          <Route path="/reports/:id" element={<HomePage />} />
          <Route path="/medication" element={<HomePage />} />
          <Route path="/profile" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 大屏端右侧今日概览 */}
      {responsive.isWide && <InfoPanel />}

      {/* 移动端底部 Tab 导航 */}
      {responsive.isMobile && <BottomNav />}
    </div>
  );
}
