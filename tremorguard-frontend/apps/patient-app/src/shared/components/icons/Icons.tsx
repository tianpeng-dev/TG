/**
 * SVG 图标组件
 * 使用 react-native-svg 实现
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// 首页图标
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="9 22 9 12 15 12 15 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 报告图标
export const ReportIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 个人中心图标
export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={2} />
  </Svg>
);

// 返回箭头
export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#1A1D23' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 右箭头
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = '#9CA3AF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 设置图标
export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#1A1D23' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={1.5}
    />
  </Svg>
);

// 药物图标
export const MedicationIcon: React.FC<IconProps> = ({ size = 24, color = '#D97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="4" height="8" rx="2" fill={color} />
    <Rect x="17" y="11" width="4" height="8" rx="2" fill={color} />
    <Rect x="7" y="7" width="10" height="16" rx="5" stroke={color} strokeWidth={2} />
    <Line x1="7" y1="14" x2="17" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 分享图标
export const ShareIcon: React.FC<IconProps> = ({ size = 24, color = '#9CA3AF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 6 12 2 8 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 语音图标
export const MicIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="2" width="6" height="11" rx="3" stroke={color} strokeWidth={2} />
    <Path d="M5 10a7 7 0 0014 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12" y2="22" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="22" x2="16" y2="22" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 发送图标
export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity={0.15} />
  </Svg>
);

// AI 机器人头像
export const RobotIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="8" width="14" height="12" rx="3" stroke={color} strokeWidth={2} />
    <Circle cx="9.5" cy="13" r="1.5" fill={color} />
    <Circle cx="14.5" cy="13" r="1.5" fill={color} />
    <Path d="M12 4v4M9 2l3 2 3-2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="9" y1="17" x2="15" y2="17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// 手表/设备图标
export const WatchIcon: React.FC<IconProps> = ({ size = 22, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="6" width="12" height="12" rx="3" stroke={color} strokeWidth={2} />
    <Path d="M10 6V4a2 2 0 012-2 2 2 0 012 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 18v2a2 2 0 002 2 2 2 0 002-2v-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

// 邮件图标
export const MailIcon: React.FC<IconProps> = ({ size = 20, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth={2} />
    <Path d="M22 7l-10 7L2 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 消息图标
export const MessageIcon: React.FC<IconProps> = ({ size = 20, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 打印图标
export const PrintIcon: React.FC<IconProps> = ({ size = 20, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 6 2 18 2 18 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="6" y="14" width="12" height="8" rx="1" stroke={color} strokeWidth={2} />
  </Svg>
);

// 加号图标
export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 帮助图标
export const HelpIcon: React.FC<IconProps> = ({ size = 22, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 通知图标
export const BellIcon: React.FC<IconProps> = ({ size = 22, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 设备图标
export const DeviceIcon: React.FC<IconProps> = ({ size = 22, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="1" y="6" width="22" height="12" rx="4" stroke={color} strokeWidth={2} />
    <Line x1="6" y1="10" x2="6" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="10" x2="10" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 照护者图标
export const UsersIcon: React.FC<IconProps> = ({ size = 22, color = '#0F766E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} />
    <Path d="M23 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);