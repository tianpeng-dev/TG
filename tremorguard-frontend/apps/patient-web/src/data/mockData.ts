export type ChatMessageKind =
  | 'ai-text'
  | 'ai-summary'
  | 'user-text'
  | 'medication-card'
  | 'alert-card'
  | 'report-card';

export interface MedicationCardAction {
  label: string;
  variant: 'success' | 'warning' | 'ghost' | 'outline' | 'primary' | 'disabled' | 'disabled-secondary' | 'disabled-outline';
  action?: 'confirm-medication' | 'notify-caregiver' | 'view-report' | 'share-report' | 'view-data' | 'snooze';
}

export interface ReportStat {
  value: string;
  label: string;
  color?: string;
}

export interface ChatMessage {
  id: string;
  kind: ChatMessageKind;
  time: string;
  text?: string;
  summaryTitle?: string;
  summaryTag?: string;
  summaryBody?: string;
  summaryFooter?: string;
  medicationTitle?: string;
  medicationBody?: string;
  medicationMeta?: string;
  medicationIconColor?: 'warning' | 'success';
  alertTitle?: string;
  alertBody?: string;
  alertList?: string[];
  alertSuccessBody?: string;
  alertHandled?: boolean;
  reportTitle?: string;
  reportDate?: string;
  reportStats?: ReportStat[];
  actions?: MedicationCardAction[];
  medicationConfirmed?: boolean;
  confirmedTime?: string;
  confirmedText?: string;
}

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    kind: 'ai-summary',
    time: '08:00',
    summaryTitle: '早安问候',
    summaryTag: '每日摘要',
    summaryBody:
      '早上好，张奶奶！今天天气晴朗，气温 22-28°C。昨晚睡眠质量良好（7.2小时深睡占比 35%）。早上静止性震颤评估得分 2.1/10，相比昨天略有改善。',
    summaryFooter: '今日提醒：上午10:00服用左旋多巴，下午进行15分钟手指灵活性练习。',
  },
  {
    id: 'msg-2',
    kind: 'user-text',
    time: '08:05',
    text: '今天感觉怎么样？',
  },
  {
    id: 'msg-3',
    kind: 'medication-card',
    time: '12:00',
    medicationTitle: '用药提醒',
    medicationBody:
      '张奶奶，现在到了服用美多芭（左旋多巴）的时间。剂量：1片（250mg），饭后30分钟服用。',
    medicationMeta: '距上次服药已 4 小时',
    medicationIconColor: 'warning',
    actions: [
      { label: '已服药', variant: 'primary', action: 'confirm-medication' },
      { label: '稍后提醒', variant: 'ghost', action: 'snooze' },
    ],
  },
  {
    id: 'msg-4',
    kind: 'alert-card',
    time: '14:32',
    alertTitle: '异常震颤警报',
    alertBody:
      '检测到您过去 30 分钟内静止性震颤频率升高（由 4.2Hz 升至 7.8Hz），幅度增加约 45%。可能的原因：',
    alertList: ['药物浓度下降（接近下次服药时间）', '情绪波动或压力增加', '过度疲劳'],
    actions: [
      { label: '我已注意到了', variant: 'primary', action: 'confirm-medication' },
      { label: '通知照护者', variant: 'ghost', action: 'notify-caregiver' },
    ],
  },
  {
    id: 'msg-5',
    kind: 'report-card',
    time: '20:00',
    reportTitle: '每日健康报告',
    reportDate: '2025年7月25日',
    text: '今日整体状况良好。震颤控制在合理范围内，下午出现一次短暂加剧（已记录）。建议明天继续保持规律作息和用药。',
    reportStats: [
      { value: '2.8', label: '平均震颤得分', color: 'var(--tg-primary)' },
      { value: '3/3', label: '按时服药', color: 'var(--state-success)' },
      { value: '7.2h', label: '睡眠时长', color: 'var(--state-info)' },
    ],
    actions: [
      { label: '查看完整报告', variant: 'primary', action: 'view-report' },
      { label: '分享给家人', variant: 'ghost', action: 'share-report' },
    ],
  },
];

export const QUICK_ACTIONS = [
  '查看今日报告',
  '用药记录',
  '最近一周趋势',
  '联系医生',
] as const;