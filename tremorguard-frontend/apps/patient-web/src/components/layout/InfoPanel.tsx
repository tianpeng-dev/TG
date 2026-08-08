/**
 * 今日概览信息面板（大桌面端右侧 320px）
 *
 * 仅在 >= 1440px 显示，承载：
 *  1. 今日数据小结（震颤 / 用药 / 睡眠 / 步数）
 *  2. 手环状态卡（电量 / 信号 / 心率）
 *  3. 今日用药进度
 *  4. 快捷入口（报告 / 联系医生 / 设置）
 */
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentIcon,
  PhoneIcon,
  PillIcon,
  SettingsIcon,
  WatchIcon,
} from '../icons/Icons';

interface TodaySummary {
  dateLabel: string;
  tremor: { score: string; delta: string; trend: 'down' | 'up' | 'flat' };
  medication: { taken: number; total: number };
  sleep: { hours: string; quality: string };
  steps: string;
}

const TODAY: TodaySummary = {
  dateLabel: '2025 年 7 月 25 日 · 周五',
  tremor: { score: '2.8/10', delta: '较昨日 ↓ 0.3', trend: 'down' },
  medication: { taken: 3, total: 4 },
  sleep: { hours: '7.2h', quality: '良好' },
  steps: '3,248 步',
};

const MEDICATION_SCHEDULE = [
  { time: '08:00', name: '左旋多巴', dosage: '250mg', status: 'taken' as const },
  { time: '12:00', name: '左旋多巴', dosage: '250mg', status: 'taken' as const },
  { time: '14:00', name: '恩他卡朋', dosage: '200mg', status: 'taken' as const },
  { time: '18:00', name: '左旋多巴', dosage: '250mg', status: 'pending' as const },
];

const QUICK_LINKS = [
  {
    key: 'report',
    label: '今日报告',
    desc: '查看完整健康报告',
    icon: <DocumentIcon size={18} />,
    href: '/reports/rpt-20250724',
  },
  {
    key: 'doctor',
    label: '联系医生',
    desc: '预约或致电主治医生',
    icon: <PhoneIcon size={18} />,
    href: '/profile',
  },
  {
    key: 'settings',
    label: '设备与设置',
    desc: '手环 / 通知 / 隐私',
    icon: <SettingsIcon size={18} />,
    href: '/profile',
  },
];

export function InfoPanel() {
  const navigate = useNavigate();

  return (
    <aside
      aria-label="今日概览"
      className="flex h-screen w-[320px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-border p-5"
      style={{
        background: 'var(--tg-card)',
        boxShadow: 'var(--tg-shadow-sm)',
      }}
    >
      {/* 日期 + 标题 */}
      <div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: 'var(--tg-muted-foreground)' }}
        >
          <CalendarIcon size={14} />
          <span>{TODAY.dateLabel}</span>
        </div>
        <h2
          className="mt-1.5 text-lg font-bold"
          style={{ color: 'var(--tg-foreground)' }}
        >
          今日概览
        </h2>
      </div>

      {/* 数据小结 2x2 */}
      <div className="grid grid-cols-2 gap-2.5">
        <SummaryStat
          label="平均震颤"
          value={TODAY.tremor.score}
          sub={TODAY.tremor.delta}
          tone="primary"
        />
        <SummaryStat
          label="按时服药"
          value={`${TODAY.medication.taken}/${TODAY.medication.total}`}
          sub="完成率 75%"
          tone="success"
        />
        <SummaryStat
          label="睡眠时长"
          value={TODAY.sleep.hours}
          sub={`质量：${TODAY.sleep.quality}`}
          tone="info"
        />
        <SummaryStat
          label="今日步数"
          value={TODAY.steps}
          sub="目标 5,000 步"
          tone="muted"
        />
      </div>

      {/* 手环状态卡 */}
      <DeviceStatusCard />

      {/* 用药进度 */}
      <MedicationProgressCard />

      {/* 快捷入口 */}
      <div
        className="overflow-hidden rounded-xl border border-border bg-card"
        style={{ boxShadow: 'var(--tg-shadow-sm)' }}
      >
        {QUICK_LINKS.map((link, index) => (
          <button
            key={link.key}
            type="button"
            onClick={() => navigate(link.href)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left tg-pressable tg-hover-muted ${
              index < QUICK_LINKS.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--tg-msg-system)' }}
            >
              <span style={{ color: 'var(--tg-primary)' }}>{link.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-sm font-semibold"
                style={{ color: 'var(--tg-foreground)' }}
              >
                {link.label}
              </div>
              <div
                className="truncate text-xs"
                style={{ color: 'var(--tg-muted-foreground)' }}
              >
                {link.desc}
              </div>
            </div>
            <ChevronRightIcon size={18} className="text-neutral-400" />
          </button>
        ))}
      </div>
    </aside>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  sub: string;
  tone: 'primary' | 'success' | 'info' | 'muted';
}

function SummaryStat({ label, value, sub, tone }: SummaryStatProps) {
  const colorMap: Record<SummaryStatProps['tone'], string> = {
    primary: 'var(--tg-primary)',
    success: 'var(--state-success)',
    info: 'var(--state-info)',
    muted: 'var(--tg-foreground)',
  };
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'var(--tg-card)',
        boxShadow: 'var(--tg-shadow-sm)',
        border: '1px solid var(--tg-border)',
      }}
    >
      <div
        className="text-xs"
        style={{ color: 'var(--tg-muted-foreground)' }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-lg font-bold"
        style={{ color: colorMap[tone], lineHeight: 1.2 }}
      >
        {value}
      </div>
      <div
        className="mt-0.5 text-xs"
        style={{ color: 'var(--tg-muted-foreground)' }}
      >
        {sub}
      </div>
    </div>
  );
}

function DeviceStatusCard() {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--tg-card)',
        boxShadow: 'var(--tg-shadow-sm)',
        border: '1px solid var(--tg-border)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--tg-msg-system)' }}
          >
            <WatchIcon size={16} />
          </div>
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: 'var(--tg-foreground)' }}
            >
              手环 TG-100
            </div>
            <div
              className="text-xs"
              style={{ color: 'var(--tg-muted-foreground)' }}
            >
              已连接 · 5G 信号良好
            </div>
          </div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            background: 'var(--state-success-light)',
            color: 'var(--state-success)',
          }}
        >
          在线
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniMetric label="电量" value="78%" bar={0.78} barColor="var(--state-success)" />
        <MiniMetric label="心率" value="72" unit="bpm" />
        <MiniMetric label="信号" value="-58" unit="dBm" />
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  unit,
  bar,
  barColor,
}: {
  label: string;
  value: string;
  unit?: string;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div
      className="rounded-lg p-2"
      style={{ background: 'var(--tg-neutral-50)' }}
    >
      <div className="text-xs" style={{ color: 'var(--tg-muted-foreground)' }}>
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span
          className="text-sm font-bold"
          style={{ color: 'var(--tg-foreground)' }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-xs"
            style={{ color: 'var(--tg-muted-foreground)' }}
          >
            {unit}
          </span>
        )}
      </div>
      {bar !== undefined && (
        <div
          className="mt-1.5 h-1 overflow-hidden rounded-full"
          style={{ background: 'var(--tg-neutral-200)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(1, bar)) * 100}%`,
              background: barColor ?? 'var(--tg-primary)',
            }}
          />
        </div>
      )}
    </div>
  );
}

function MedicationProgressCard() {
  const done = MEDICATION_SCHEDULE.filter((m) => m.status === 'taken').length;
  const total = MEDICATION_SCHEDULE.length;
  const ratio = done / total;
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--tg-card)',
        boxShadow: 'var(--tg-shadow-sm)',
        border: '1px solid var(--tg-border)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--state-warning-light)' }}
          >
            <PillIcon size={16} color="var(--state-warning)" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--tg-foreground)' }}
          >
            今日用药
          </span>
        </div>
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--tg-foreground)' }}
        >
          {done} / {total}
        </span>
      </div>
      <div
        className="mb-3 h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--tg-neutral-200)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${ratio * 100}%`,
            background: 'var(--tg-primary)',
          }}
        />
      </div>
      <div className="space-y-2">
        {MEDICATION_SCHEDULE.map((m) => {
          const isTaken = m.status === 'taken';
          return (
            <div
              key={m.time}
              className="flex items-center gap-2.5 text-sm"
            >
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: isTaken
                    ? 'var(--state-success)'
                    : 'var(--tg-neutral-200)',
                  color: isTaken
                    ? 'var(--state-success-foreground)'
                    : 'var(--tg-muted-foreground)',
                }}
              >
                {isTaken ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <ClockIcon size={11} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  style={{
                    color: isTaken
                      ? 'var(--tg-foreground)'
                      : 'var(--tg-muted-foreground)',
                    fontWeight: isTaken ? 500 : 400,
                  }}
                >
                  {m.name} {m.dosage}
                </span>
              </div>
              <span
                className="text-xs tabular-nums"
                style={{ color: 'var(--tg-muted-foreground)' }}
              >
                {m.time}
              </span>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          // 桌面端无独立用药页路由，复用报告页查看看板
          window.location.hash = '#/medication';
        }}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium tg-pressable tg-hover-system"
        style={{
          background: 'var(--tg-msg-system)',
          color: 'var(--tg-primary)',
        }}
      >
        <ChartIcon size={14} />
        查看用药日历
      </button>
    </div>
  );
}
