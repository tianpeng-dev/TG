import type { SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number;
}

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true,
  focusable: false,
});

export function WatchIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="6" y="6" width="12" height="12" rx="3" stroke="currentColor" strokeWidth={2} fill="none" />
      <path d="M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M10 18v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function SettingsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} fill="none" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
      />
    </svg>
  );
}

export function AiAvatarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="5" y="8" width="14" height="12" rx="3" stroke="currentColor" strokeWidth={2} fill="none" />
      <circle cx="9.5" cy="13" r="1.5" fill="currentColor" />
      <circle cx="14.5" cy="13" r="1.5" fill="currentColor" />
      <path d="M12 4v4M9 2l3 2 3-2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M9 17h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function PillIcon({ size = 20, color = '#D97706', ...props }: IconProps & { color?: string }) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="3" y="11" width="4" height="8" rx="2" fill={color} />
      <rect x="17" y="11" width="4" height="8" rx="2" fill={color} />
      <rect x="7" y="7" width="10" height="16" rx="5" stroke={color} strokeWidth={2} fill="none" />
      <path d="M7 14h10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function PillSuccessIcon({ size = 20, ...props }: IconProps) {
  return <PillIcon size={size} color="#059669" {...props} />;
}

export function MicIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth={2} fill="none" />
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
      <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function SendIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity={0.15}
      />
    </svg>
  );
}

export function HomeIcon({ size = 24, filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg {...base(size)} {...props}>
        <path
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-4 0a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity={0.15}
        />
      </svg>
    );
  }
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReportsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H7v0h2M9 5v0a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2v0M9 5h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="9" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={2} fill="none" />
      <path d="M4 21v-1a6 6 0 0 1 12 0v1" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="11" fill="#059669" />
      <path d="M7 12l3.5 3.5L17 8" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function ShareIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="16 6 12 2 8 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function WarningIcon({ size = 20, color, ...props }: IconProps & { color?: string }) {
  const c = color ?? '#D97706';
  return (
    <svg {...base(size)} {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="12" y1="9" x2="12" y2="13" stroke={c} strokeWidth={2} strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" />
      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function EyeIcon({ size = 18, color, ...props }: IconProps & { color?: string }) {
  const c = color ?? 'currentColor';
  return (
    <svg {...base(size)} {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth={2} fill="none" />
    </svg>
  );
}

export function PhoneIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function ChartIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={2} fill="none" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function DocumentIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
