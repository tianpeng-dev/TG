/**
 * 顶部导航栏组件
 * 严格对照设计稿：AI 对话首页（桌面端）.html line 230-244
 *
 * 桌面端：h-16, px-8, 标题"对话助手" + 已连接徽章 + 设置按钮(w-9 h-9, neutral-500)
 * 移动端：简化为标题 + 连接点 + 设置按钮
 */
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsIcon } from '../icons/Icons';

export type TopNavVariant = 'home' | 'sub';

export interface TopNavProps {
  title: string;
  variant?: TopNavVariant;
  deviceConnected?: boolean;
  right?: ReactNode;
  onBack?: () => void;
  onSettings?: () => void;
}

export function TopNav({
  title,
  variant = 'sub',
  deviceConnected = true,
  right,
  onBack,
  onSettings,
}: TopNavProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header
      role="navigation"
      aria-label="顶部导航"
      className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-8"
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {variant === 'home' ? (
          <>
            {/* Desktop: title + badge */}
            <h1
              className="hidden text-xl font-bold md:block"
              style={{ color: 'var(--tg-foreground)' }}
            >
              {title}
            </h1>
            <div
              className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 md:flex"
              style={{ background: 'var(--state-success-light)' }}
            >
              <span
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: 'var(--state-success)',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--state-success)' }}
              >
                {deviceConnected ? '已连接' : '未连接'}
              </span>
            </div>

            {/* Mobile: simplified title with connection dot */}
            <div className="flex items-center gap-2 md:hidden">
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{
                  background: deviceConnected
                    ? 'var(--state-success)'
                    : 'var(--tg-neutral-400)',
                }}
                aria-label={deviceConnected ? '设备已连接' : '设备未连接'}
              />
              <span
                className="font-medium"
                style={{
                  fontSize: 'var(--tg-text-base)',
                  color: 'var(--tg-foreground)',
                }}
              >
                {title}
              </span>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            aria-label="返回"
            className="flex h-9 w-9 items-center justify-center rounded-lg tg-pressable"
            style={{ color: 'var(--tg-foreground)' }}
          >
            <ArrowLeftIcon size={20} />
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center">
        {variant === 'home' ? (
          <button
            type="button"
            onClick={onSettings}
            aria-label="设置"
            className="flex h-9 w-9 items-center justify-center rounded-lg tg-pressable"
            style={{
              color: 'var(--tg-neutral-500)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <SettingsIcon size={18} />
          </button>
        ) : (
          right ?? <div className="w-9" />
        )}
      </div>
    </header>
  );
}

function ArrowLeftIcon({ size = 24, ...props }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
