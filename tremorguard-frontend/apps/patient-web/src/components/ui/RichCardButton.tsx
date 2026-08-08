import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type RichCardButtonVariant =
  | 'primary'
  | 'error'
  | 'ghost'
  | 'disabled'
  | 'disabled-secondary';

export interface RichCardButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: RichCardButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

/** 设计稿按钮样式映射（对照 AI 对话首页（桌面端）.html line 321-333, 381-392） */
const VARIANT_STYLES: Record<RichCardButtonVariant, string> = {
  // 主按钮：bg-primary, text-white（设计稿 line 321）
  primary: 'text-white',
  // 警报按钮：bg-error, text-white（设计稿 line 381）
  error: 'text-white',
  // 次要按钮：bg-muted, text-muted-foreground（设计稿 line 327）
  ghost: '',
  disabled: 'cursor-not-allowed opacity-50',
  'disabled-secondary': 'cursor-not-allowed opacity-50',
};

const VARIANT_BG: Record<RichCardButtonVariant, string> = {
  primary: 'var(--tg-primary)',
  error: 'var(--state-error)',
  ghost: 'var(--tg-muted)',
  disabled: 'var(--tg-muted)',
  'disabled-secondary': 'var(--tg-muted)',
};

const VARIANT_COLOR: Record<RichCardButtonVariant, string> = {
  primary: 'white',
  error: 'white',
  ghost: 'var(--tg-muted-foreground)',
  disabled: 'var(--tg-neutral-400)',
  'disabled-secondary': 'var(--tg-neutral-400)',
};

export function RichCardButton({
  variant = 'primary',
  fullWidth = true,
  children,
  type = 'button',
  className = '',
  disabled,
  ...rest
}: RichCardButtonProps) {
  const isDisabled = disabled || variant.startsWith('disabled');

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium tg-pressable ${
        isDisabled ? 'pointer-events-none' : ''
      } ${fullWidth ? 'flex-1' : ''} ${VARIANT_STYLES[variant]} ${className}`}
      style={{
        minHeight: 40,
        padding: '10px 16px',
        fontSize: 'var(--tg-text-sm)',
        fontWeight: 'var(--tg-weight-medium)',
        lineHeight: 1.2,
        background: VARIANT_BG[variant],
        color: VARIANT_COLOR[variant],
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
