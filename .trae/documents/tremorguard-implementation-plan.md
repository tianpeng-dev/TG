# TremorGuard MVP 前端页面实施计划

## Summary

基于已完成的 TremorGuard MVP PRD，制定全面的前端页面实施计划，采用 **React Native** 作为技术栈。计划涵盖技术选型、页面架构、组件规范、开发优先级、质量保障和资源分配。本阶段为策略规划，不进行实际代码编写，目标形成可直接移交开发团队的详细技术文档。

## Current State Analysis

- **PRD 文档**：`tremorguard-mvp-prd/tremorguard-mvp-prd.html`（1858 行，14 个模块）
  - 包含 5 个 Mermaid 业务流程图、3 个 ECharts 数据图表
  - 23 个交互原型 Demo（HTML/CSS 手机框），可直接对照实现
  - MVP 核心变更：**就诊报告自动生成 + 临床结论句翻译**（原 v2 提前至 MVP）
- **UX 研究基础**：`tremorguard-ux-analysis/tremorguard-ux-analysis.html`
  - 8 名帕金森患者访谈、14 个量化痛点、6 个心智模型、8 个边缘案例
- **设计规范**（PRD 14.5 节）：
  - 主色：Teal `#0d9488`；状态色：安全 `#d1fae5` / 注意 `#fef3c7` / 危险 `#fee2e2`
  - 最小字号：正文 16px / 关键数字 24px / 等级数字 48px
  - 按钮尺寸：最小 48×48dp，就诊模式退出按钮 72dp 高
  - 圆角：卡片 16px / 按钮 8px / 手机框 36px
- **技术栈决策**：React Native（TypeScript）—— 团队可复用 Web 开发经验，BLE 生态成熟，社区活跃
- **待确认依赖**：
  - 手环固件 BLE 协议文档（需嵌入式团队提供 GATT 服务定义）
  - 报告生成算法伪代码（需算法团队提供指标计算逻辑）

---

## Proposed Changes

### 一、技术选型：三个候选方案对比

#### 1.1 方案对比矩阵

| 维度 | 方案 A：Flutter | **方案 B：React Native（已选）** | 方案 C：原生双端（Swift + Kotlin） |
|------|---------------|-------------------------------|-----------------------------------|
| **开发语言** | Dart | **TypeScript / JavaScript** | Swift (iOS) / Kotlin (Android) |
| **UI 渲染** | Skia 自绘引擎，跨端像素一致 | **原生组件桥接，平台原生外观** | 完全原生组件 |
| **BLE 生态** | flutter_blue_plus | **react-native-ble-plx（成熟稳定，文档丰富）** | CoreBluetooth / Android BLE API |
| **图表能力** | fl_chart + CustomPainter | **react-native-svg + victory-native（大数据量需虚拟化）** | iOS Charts / MPAndroidChart |
| **无障碍支持** | Semantics Widget | **AccessibilityInfo + 桥接原生 TalkBack/VoiceOver** | 直接调用平台 API |
| **冷启动性能** | < 1.5s | **~2s（Hermes 引擎优化后）** | < 1s |
| **包体积** | iOS ~25MB（含 Skia） | **较小（Hermes 精简）** | 最小 |
| **团队学习成本** | 中（Dart 新语言） | **低（Web 团队可快速上手）** | 高（双技能树） |
| **NMPA 合规** | 需自行整理双端一致性证明 | **需整理桥接层证明（较 Flutter 更成熟）** | 平台原生文档模板成熟 |
| **跨平台一致性** | 高（Skia 统一渲染） | **中（平台组件差异需分别适配 iOS/Android）** | 无差异 |
| **长期维护成本** | 低（单代码库） | **低（单代码库）** | 高（三份代码） |
| **医疗 App 案例** | Babylon Health | **Noom、Zocdoc、Amwell** | Apple Health |

#### 1.2 针对 TremorGuard 需求的 React Native 专项评估

| 需求项 | React Native 方案 | 依赖库 |
|--------|------------------|--------|
| BLE 5.0 低功耗同步 | `react-native-ble-plx` 支持广播、连接、MTU 协商、特征值通知（适合 50Hz 数据流） | `react-native-ble-plx` |
| 药效窗口色带时间轴 | `react-native-svg` 绘制 SVG 色带 + 手势；大数据量可用 `react-native-chart-kit` | `react-native-svg`, `react-native-chart-kit` |
| 就诊报告 PDF 生成 | `react-native-html-to-pdf` 将 HTML 报告转为 PDF；或 `rn-fetch-blob` 导出 | `react-native-html-to-pdf` |
| 语音输入（阈值设定） | `@react-native-voice/voice` 语音识别，支持普通话 | `@react-native-voice/voice` |
| 生物识别锁 | `@react-native-community/biometrics` 调用 Face ID / 指纹 | `@react-native-community/biometrics` |
| 就诊锁屏模式 | `BackHandler`（Android）+ `Navigation` 拦截返回；iOS 需原生模块辅助 | 原生模块（Platform Channel） |
| 本地存储 | `react-native-sqlite-storage`（结构化数据）+ `@react-native-async-storage`（配置） | `react-native-sqlite-storage` |
| 加密 | `react-native-keychain`（iOS Keychain / Android Keystore）+ `crypto-js` | `react-native-keychain` |
| 字体/按钮/动态缩放 | `PixelRatio` + `Dimensions` 精确控制；支持系统动态字体（`allowFontScaling`） | 内置 API |
| 色彩非唯一标识 | `View` + `Text` + `Image` 完全可控 | 内置组件 |

#### 1.3 已选方案：React Native

**决策理由：**

1. **团队技能复用**：团队已有 Web 开发经验（TypeScript/React），React Native 的学习曲线远低于 Flutter/Dart，可快速进入开发状态。

2. **BLE 库成熟稳定**：`react-native-ble-plx` 是 React Native 生态中 BLE 的事实标准，文档完善，社区活跃，支持特征值通知（适合 50Hz 数据流订阅）。

3. **原生外观优势**：React Native 使用平台原生组件（iOS 用 UIButton，Android 用 Material Button），对于医疗 App 而言，原生外观更容易获得 NMPA 审核的认可。

4. **图表方案可行**：药效窗口色带图可用 `react-native-svg` 自定义绘制；大数据量场景下可降级为原生图表模块（`react-native-mp-android-chart` / `react-native-ios-charts`）。

5. **包体积更优**：Hermes 引擎大幅精简了 JS 运行时体积，iOS/Android 包体积均小于 Flutter。

**风险提示与缓解**：

| 风险 | 缓解措施 |
|------|----------|
| 图表性能不足（千级数据点 < 30fps） | 降级为原生图表模块嵌入（Platform Channel） |
| 平台组件差异导致 UI 不一致 | iOS/Android 分别做微调适配，核心布局保持一致 |
| JS 引擎计算密集型任务（报告生成） | 报告引擎核心计算移至原生层（TurboModule），UI 层仅负责渲染 |

---

### 二、页面模块拆分与目录结构

#### 2.1 项目目录架构

```
tremorguard-rn/
├── src/
│   ├── App.tsx                          # 入口，主题配置，导航初始化
│   ├── core/                            # 核心基础设施
│   │   ├── ble/
│   │   │   ├── BLEManager.ts            # BLE 连接状态机（react-native-ble-plx）
│   │   │   ├── BLECharacteristics.ts    # GATT 特征值定义（待固件团队提供）
│   │   │   └── SyncService.ts           # 增量同步 + CRC 校验
│   │   ├── storage/
│   │   │   ├── Database.ts              # react-native-sqlite-storage
│   │   │   ├── Preferences.ts           # @react-native-async-storage
│   │   │   └── SecureStore.ts           # react-native-keychain（加密密钥）
│   │   ├── crypto/
│   │   │   └── EncryptionService.ts     # AES-128 链路加密
│   │   ├── report-engine/
│   │   │   ├── MetricsCalculator.ts     # 指标计算（控制率、剂末提前）
│   │   │   ├── ConclusionTranslator.ts  # 临床结论句模板引擎
│   │   │   └── PDFRenderer.ts           # HTML→PDF 渲染
│   │   └── native-modules/              # 原生模块（TurboModule / Fabric）
│   │       └── ReportCalculationModule.ts # 报告计算密集型任务原生加速
│   ├── domain/                          # 领域模型
│   │   ├── models/
│   │   │   ├── TremorLevel.ts           # 震颤等级序列
│   │   │   ├── MedicationEvent.ts       # 服药事件
│   │   │   ├── ThresholdConfig.ts       # 阈值配置
│   │   │   ├── ClinicReport.ts          # 就诊报告
│   │   │   └── DeviceStatus.ts          # 设备状态
│   │   └── repositories/
│   │       ├── TremorRepository.ts
│   │       ├── MedicationRepository.ts
│   │       └── ReportRepository.ts
│   ├── features/                        # 功能模块（按 PRD 对应）
│   │   ├── splash/
│   │   │   └── SplashScreen.tsx
│   │   ├── onboarding/
│   │   │   └── OnboardingScreen.tsx     # 3 步引导
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx      # 首页/今日趋势（B1）
│   │   │   └── components/
│   │   │       ├── MedicationWindowChart.tsx   # 核心：药效色带时间轴
│   │   │       ├── TremorCurveOverlay.tsx      # 震颤曲线叠加
│   │   │       └── RecentMedicationCard.tsx
│   │   ├── report/
│   │   │   ├── ReportPreviewScreen.tsx   # 就诊报告（B2）
│   │   │   └── components/
│   │   │       ├── ClinicalConclusionBox.tsx   # 临床结论句高亮框
│   │   │       ├── MetricsGrid.tsx             # 2×2 指标卡片
│   │   │       └── ReportActions.tsx           # 分享/打印按钮
│   │   ├── clinic-mode/
│   │   │   └── ClinicLockScreen.tsx      # 就诊锁屏模式（B3）
│   │   ├── threshold/
│   │   │   ├── ThresholdHomeScreen.tsx
│   │   │   ├── VoiceThresholdScreen.tsx  # 语音设定（B4-V）
│   │   │   └── HistoryThresholdScreen.tsx # 历史回溯（B4-H）
│   │   ├── history/
│   │   │   ├── HistoryTrendScreen.tsx    # 历史趋势（B5）
│   │   │   └── components/
│   │   │       ├── WeekCompareChart.tsx
│   │   │       └── MonthCompareChart.tsx
│   │   ├── device/
│   │   │   └── DeviceManagerScreen.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       └── DataExportScreen.tsx
│   ├── navigation/                      # 导航路由
│   │   ├── AppNavigator.tsx             # 根导航器（Stack + Tab）
│   │   ├── ClinicModeNavigator.tsx      # 就诊模式隔离导航
│   │   └── routeNames.ts                # 路由常量
│   └── shared/                          # 共享组件
│       ├── components/                  # 原子/分子组件
│       │   ├── AppButton.tsx            # Primary / Secondary / Ghost / Large
│       │   ├── AppCard.tsx
│       │   ├── StatusPanel.tsx          # 绿/黄/红三色状态
│       │   ├── MetricCard.tsx
│       │   ├── ClinicalConclusionBox.tsx
│       │   ├── PillNav.tsx              # 胶囊切换导航
│       │   ├── MedicationBand.tsx       # 药效色带
│       │   └── ProtoFrame.tsx           # 手机框（调试用）
│       ├── theme/
│       │   ├── colors.ts                # 设计令牌：颜色
│       │   ├── typography.ts            # 设计令牌：字体
│       │   └── spacing.ts               # 设计令牌：间距
│       └── utils/
│           ├── accessibility.ts         # 无障碍辅助函数
│           └── haptic.ts                # 触觉反馈（react-native-haptic-feedback）
├── ios/                                 # iOS 原生工程
├── android/                             # Android 原生工程
├── package.json
├── tsconfig.json
└── babel.config.js
```

#### 2.2 核心依赖清单

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.x",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "react-native-ble-plx": "^3.x",
    "react-native-sqlite-storage": "^6.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "react-native-keychain": "^8.x",
    "react-native-svg": "^14.x",
    "react-native-chart-kit": "^6.x",
    "react-native-html-to-pdf": "^0.x",
    "@react-native-voice/voice": "^3.x",
    "@react-native-community/biometrics": "^3.x",
    "react-native-haptic-feedback": "^2.x",
    "crypto-js": "^4.x",
    "date-fns": "^3.x"
  }
}
```

#### 2.3 路由表设计

采用 React Navigation 6.x（Stack + Bottom Tabs 混合）：

| 路由名 | 路径 | 屏幕组件 | PRD 原型 | 说明 |
|--------|------|----------|----------|------|
| `Splash` | `/splash` | SplashScreen | — | 冷启动，Logo + 加载状态 |
| `Onboarding` | `/onboarding` | OnboardingScreen | — | 首次安装，3 步引导 |
| `Dashboard` | `/` | DashboardScreen | B1 | 首页 Tab，药效窗口色带图 |
| `ReportPreview` | `/report` | ReportPreviewScreen | B2 | 就诊报告预览（Stack 全屏） |
| `ClinicLock` | `/clinic-mode` | ClinicLockScreen | B3 | 就诊锁屏（独立 Stack） |
| `ThresholdHome` | `/threshold` | ThresholdHomeScreen | B4-H | 阈值设置首页 |
| `ThresholdVoice` | `/threshold/voice` | VoiceThresholdScreen | B4-V | 语音设定阈值 |
| `ThresholdHistory` | `/threshold/history` | HistoryThresholdScreen | B4-H | 历史回溯设定 |
| `HistoryTrend` | `/history` | HistoryTrendScreen | B5 | 历史趋势 Tab |
| `DeviceManager` | `/device` | DeviceManagerScreen | — | 设备管理（设置内） |
| `Settings` | `/settings` | SettingsScreen | — | 设置 Tab |
| `DataExport` | `/settings/export` | DataExportScreen | — | 数据导出与删除 |

**底部 Tab 导航（3 个主 Tab）**：
- **今日趋势**（`Dashboard`）— 默认 Tab
- **历史**（`HistoryTrend`）
- **我的**（`Settings`）

**就诊锁屏模式的路由隔离**：
- 使用独立 `ClinicModeNavigator`（Stack Navigator）
- 进入时重置导航栈：`navigation.reset({ index: 0, routes: [{ name: 'ClinicLock' }] })`
- Android：`BackHandler.addEventListener('hardwareBackPress', () => true)` 拦截返回键
- iOS：原生模块禁用侧滑返回手势
- 仅保留"退出就诊模式"按钮（高度 ≥ 72dp）
- 退出时二次确认：`Alert.alert('确定要退出就诊模式吗？', [{ text: '取消', style: 'cancel' }, { text: '退出' }])`

---

### 三、组件设计规范

#### 3.1 设计令牌（Design Tokens）

```typescript
// src/shared/theme/colors.ts
export const Colors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#99F6E4',
  accent: '#D97706',

  // 状态色（背景 + 文字配对）
  safe: { bg: '#D1FAE5', text: '#065F46' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  danger: { bg: '#FEE2E2', text: '#991B1B' },

  // 中性色
  ink: '#1A1D21',
  muted: '#5E6573',
  rule: '#DDE1E7',
  background: '#F6F7F9',
  surface: '#FFFFFF',

  // 药效色带
  onPhase: '#34D399',
  transitionPhase: '#FBBF24',
  offPhase: '#F87171',
} as const;

// src/shared/theme/typography.ts
export const Typography = {
  display: { fontSize: 48, fontWeight: '700' as const, lineHeight: 48 },   // 震颤等级
  headline: { fontSize: 24, fontWeight: '600' as const, lineHeight: 29 },  // 关键数字
  title: { fontSize: 18, fontWeight: '700' as const, lineHeight: 25 },     // 卡片标题
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 27 },      // 正文（最小 16px）
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },   // 辅助说明
} as const;

// src/shared/theme/spacing.ts
export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;
```

#### 3.2 核心组件清单

| 组件 | 类型 | 规范要点 |
|------|------|----------|
| `AppButton`（Primary） | 原子 | `minHeight: 56`, `borderRadius: 14`, `backgroundColor: Colors.primary`, 文字白色，按下 `scale(0.97)` + `HapticFeedback.mediumImpact()` |
| `AppButton`（Secondary） | 原子 | `minHeight: 56`, `borderRadius: 14`, `backgroundColor: '#E2E8F0'` |
| `AppButton`（Large / 就诊退出） | 原子 | `minHeight: 72`, `borderRadius: 16`, 按钮文字 18px 加粗 |
| `AppCard` | 分子 | `borderRadius: 16`, `backgroundColor: Colors.surface`, `shadow: { elevation: 2 }` / `shadowOpacity: 0.06`, 内边距 20 |
| `StatusPanel` | 分子 | `borderRadius: 20`, 背景按状态色（safe/warning/danger），文字居中，≥ 48dp 高 |
| `MetricCard` | 分子 | `borderRadius: 12`, 背景 surface，大数字 ≥ 28px 加粗，标签 12px muted |
| `ClinicalConclusionBox` | 分子 | 左侧 `borderLeftWidth: 4`, `borderLeftColor: Colors.primary`, 背景 `#F0FDFA`, 内边距 16, 文字 16px 加粗 |
| `PillNav` | 分子 | `borderRadius: 999`, 胶囊按钮，active 时背景 primary 白色文字 |
| `MedicationBand` | 分子 | 高度 40dp，三段 `flex` 比例（on/transition/off），`borderRadius: 8` |
| `TremorCurveOverlay` | 复杂 | `react-native-svg` 绘制，`Path` + `Line`（警戒线虚线） |

#### 3.3 无障碍实现规范

React Native 使用 `accessibility` props 实现：

```tsx
import { Pressable, View, Text, AccessibilityInfo } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// 服药确认按钮
<Pressable
  onLongPress={handleRecordMedication}
  onPressIn={() => ReactNativeHapticFeedback.trigger('impactMedium')}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="确认服药，长按两秒记录时间"
  accessibilityHint="长按以记录服药事件"
  accessibilityState={{ busy: isRecording }}
  style={({ pressed }) => ({
    width: '100%',
    height: 80, // ≥ 72dp for clinic mode
    backgroundColor: Colors.primary,
    borderRadius: 14,
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.97 : 1 }],
    justifyContent: 'center',
    alignItems: 'center',
  })}
>
  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
    长按确认服药
  </Text>
</Pressable>
```

**色彩非唯一标识规则**：所有状态展示必须同时包含颜色 + 图标 + 文字三种信息：

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Icon name="check-circle" color={Colors.safe.text} size={20} />
  <Text style={{ color: Colors.safe.text, fontSize: 16, marginLeft: 8 }}>
    平稳期
  </Text>
</View>
```

**系统动态字体支持**：
```tsx
<Text allowFontScaling={true} maxFontSizeMultiplier={2.0} style={Typography.body}>
  正文内容
</Text>
```

#### 3.4 图表组件核心实现

`MedicationWindowChart`（药效窗口色带时间轴）基于 `react-native-svg`：

```tsx
import Svg, { Rect, Line, Path, Text as SvgText } from 'react-native-svg';

interface MedicationWindowChartProps {
  levels: TremorLevel[];       // 震颤等级序列
  medicationTime: Date;         // 服药锚点时间
  threshold: number;            // 警戒线
  onDuration: number;           // 药效期时长（默认 2.5h）
}

export const MedicationWindowChart: React.FC<MedicationWindowChartProps> = ({
  levels, medicationTime, threshold, onDuration = 2.5,
}) => {
  const transitionDuration = onDuration + 1.0; // 过渡期结束

  return (
    <Svg viewBox="0 0 300 100" width="100%" height={100}>
      {/* 三段色带 */}
      <Rect x="0" y="0" width={onDuration / 6 * 300} height={40} fill={Colors.onPhase} rx={4} />
      <Rect x={onDuration / 6 * 300} y="0" width={1.0 / 6 * 300} height={40} fill={Colors.transitionPhase} rx={4} />
      <Rect x={transitionDuration / 6 * 300} y="0" width={(6 - transitionDuration) / 6 * 300} height={40} fill={Colors.offPhase} rx={4} />
      {/* 警戒线 */}
      <Line x1="0" y1={50} x2="300" y2={50} stroke={Colors.accent} strokeWidth={1} strokeDasharray="4,4" />
      {/* 震颤曲线 */}
      <Path d={generateCurvePath(levels)} stroke={Colors.primary} strokeWidth={2} fill="none" />
    </Svg>
  );
};
```

**手势交互**：
- 左右滑动切换历史周期：`react-native-gesture-handler` + `react-native-reanimated`
- 捏合缩放：`PinchGestureHandler`
- 点击数据点显示 `Tooltip`：`onPress` 获取坐标 → 渲染 `Modal` Tooltip

---

### 四、开发优先级排序

#### P0：核心闭环（上线前必须完成）

| 优先级 | 模块 | 对应 PRD 原型 | 理由 |
|--------|------|--------------|------|
| P0-1 | **BLE 连接与数据同步** | — | 所有功能基础；50Hz 数据流接收；`react-native-ble-plx` 集成 |
| P0-2 | **首页/今日趋势** | B1 | 核心差异化；药效色带时间轴；用户每日最高频 |
| P0-3 | **就诊报告预览** | B2 | MVP 核心变更；临床结论句翻译；≥1 天数据触发生成 |
| P0-4 | **就诊锁屏模式** | B3 | 与报告配套；全屏锁定 + 退出二次确认；拦截系统返回 |
| P0-5 | **本地数据存储与加密** | — | NMPA 合规；SQLite + Keychain；AES-128 链路加密 |
| P0-6 | **启动引导 + 首次配对** | — | Splash→Onboarding→BLE 配对流程；降低首次门槛 |

#### P1：重要体验（完成 P0 后）

| 优先级 | 模块 | 对应 PRD 原型 | 理由 |
|--------|------|--------------|------|
| P1-1 | **阈值设置（语音 + 历史回溯）** | B4-V, B4-H | 个性化提醒；`@react-native-voice/voice` 语音识别 |
| P1-2 | **历史趋势 7 天 / 30 天对比** | B5 | 中长期趋势识别；叠加对比图 |
| P1-3 | **服药确认同步** | A2/A3 | 手环确认→App 推送→药效窗口刷新 |
| P1-4 | **阈值越界双向提醒** | A5 | 手环越界震动 + App 通知 |
| P1-5 | **就诊报告 PDF 导出 / 分享** | B2 扩展 | `react-native-html-to-pdf`；系统分享面板 |

#### P2：增强完善（P0 + P1 后）

| 优先级 | 模块 | 理由 |
|--------|------|------|
| P2-1 | **数据导出与一键删除** | NMPA 合规；JSON + CSV 格式 |
| P2-2 | **生物识别锁** | `@react-native-community/biometrics` |
| P2-3 | **云端备份（可选）** | 换设备恢复；仅加密摘要 |
| P2-4 | **多语言预留框架** | 未来国际化；i18n 框架预埋 |

---

### 五、质量保障措施

#### 5.1 测试策略

**单元测试**（Jest + React Native Testing Library）：
- 指标计算器：`calculateControlRate()`、`calculateWearingOffAdvance()` 边界值测试
- 药效窗口分段：`splitIntoPhases()` 不同药效持续时间的正确性
- 结论句翻译器：模板填充后输出验证（无占位符残留）
- 增量同步：CRC 校验、断点续传、冲突解决

**组件测试**（React Native Testing Library）：
- P0 页面渲染：`render(<DashboardScreen />)` 验证文字、按钮尺寸
- 交互流程：Splash → Onboarding → Dashboard → Report → ClinicMode → 退出
- 无障碍：`screen.getByRole('button', { name: /确认服药/ })` 验证可访问性标签

**集成测试**（Detox / Appium）：
- BLE 连接：扫描 → 配对 → 服务发现 → 特征值订阅 → 数据接收
- 端到端报告生成：原始数据 → 等级序列 → 指标计算 → 结论句渲染 → PDF 导出
- 离线场景：关闭网络 → 生成报告 → 进入就诊模式 → 导出 PDF

**设备兼容性测试矩阵**：

| 设备 | 系统版本 | 测试重点 |
|------|----------|----------|
| iPhone SE | iOS 15 | 小屏布局，大按钮可读性 |
| iPhone 15 Pro Max | iOS 17 | 图表性能基准，ProMotion 120fps |
| Android 低端机（3 年旧） | Android 10 | 冷启动 ≤ 2s，报告生成 ≤ 3s |
| Android 中端机 | Android 12 | BLE 稳定性，后台同步 |
| Android 旗舰 | Android 13 | 图表流畅度基准 |
| iPad | iPadOS 16+ | 就诊模式大屏展示 |

**患者可用性测试（关键）**：
- 招募 5 名真实帕金森患者（轻/中/重度震颤）
- 任务：佩戴配对 → 查看趋势 → 确认服药 → 生成报告 → 进入就诊模式 → 设定阈值
- 成功指标：服药确认率 ≥ 90%，报告生成成功率 100%，就诊模式进入成功率 100%
- 误触率：所有按钮 < 10%

#### 5.2 无障碍检查清单

| 检查项 | 标准 | 验证方式 |
|--------|------|----------|
| 最小字号 | 正文 ≥ 16px，关键数字 ≥ 24px，等级数字 ≥ 48px | 设计审查 + 设备实测 |
| 对比度 | 正常文字 ≥ 4.5:1，红色警告 ≥ 7:1 | Accessibility Inspector（Xcode）/ Accessibility Scanner（Android Studio） |
| 按钮尺寸 | 可点击区域 ≥ 48×48dp，就诊退出 ≥ 72dp | Layout Inspector |
| 色彩非唯一 | 状态同时用颜色 + 图标 + 文字表达 | 色盲模拟器测试 |
| 防误触 | 服药确认长按 ≥ 2 秒，删除二次确认 | 交互测试 |
| 触觉反馈 | 关键操作伴随震动 | `react-native-haptic-feedback` 实测 |
| 屏幕阅读器 | 页面可通过 TalkBack/VoiceOver 完整朗读 | 视障辅助测试 |
| 动态字体 | 支持系统字体放大 200% 不截断 | 设备设置测试 |

#### 5.3 性能基准

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| App 冷启动 | ≤ 2s | Xcode Instruments / Android Profiler |
| 报告生成（30 天） | ≤ 3s | 中低端设备基准测试 |
| 图表渲染（1000 数据点） | ≥ 55fps | React Native Performance Monitor |
| BLE 同步（7 天数据） | ≤ 30s | 实际手环连接计时 |
| 包体积 | iOS ≤ 20MB，Android ≤ 18MB | `react-native-bundle-visualizer` |

---

### 六、资源分配建议

#### 6.1 团队配置

| 角色 | 人数 | 核心职责 |
|------|------|----------|
| React Native 高级工程师 | 1 人 | 架构设计、BLE 模块、原生模块开发、性能优化 |
| React Native 开发工程师 | 1–2 人 | 页面实现、组件开发、图表定制 |
| UI/UX 设计师 | 1 人 | 组件规范细化、高保真原型、无障碍走查 |
| QA 工程师 | 1 人 | 测试用例、自动化测试、患者可用性测试 |
| 算法/后端顾问（兼职） | 0.5 人 | 报告引擎逻辑对接、指标计算验证 |

#### 6.2 外部依赖

| 资源 | 用途 | 建议 |
|------|------|------|
| 真实患者测试组 | 可用性验证 | 与三甲医院神经内科合作，招募 5–8 名患者 |
| BLE 测试手环 | 开发调试 | 至少 2 台工程样机，支持固件 OTA 更新 |
| NMPA 注册顾问 | 合规文档 | 提前 6 个月介入，审核软件描述文档 |
| Figma 高保真原型 | 开发参照 | 设计师基于 PRD 原型产出可标注设计稿 |

#### 6.3 风险预案

| 风险 | 触发条件 | 缓解措施 |
|------|----------|----------|
| 图表性能不达标 | 千级数据点渲染 < 30fps | 降级为原生图表模块嵌入（`react-native-mp-android-chart` / `react-native-ios-charts`） |
| BLE 库稳定性不足 | 连续 3 次同步失败率 > 5% | 评估切换为平台通道原生 BLE，或引入保守重连策略 |
| 患者可用性测试失败 | 核心任务成功率 < 80% | 暂停新增功能，专项优化交互（增大按钮、简化流程、增加语音引导） |
| 包体积超标 | 超过应用商店限制 | 启用 Hermes Bytecode、移除未使用字体、拆分可选依赖 |

---

### 七、实施前置条件

以下条件应在 P0 开发启动前确认：

1. **手环固件 BLE 协议文档**：GATT 服务 UUID、特征值 UUID、数据包格式（嵌入式团队提供）
2. **报告生成算法伪代码**：指标计算逻辑、结论句模板规则（算法团队提供）
3. **设计系统 Figma 源文件**：基于 PRD 原型，设计师产出高保真可标注设计稿
4. **测试手环样机到位**：至少 1 台可 OTA 的工程机
5. **NMPA 软件文档模板**：注册顾问提供《医疗器械软件描述文档》模板

---

## Assumptions & Decisions

1. **技术栈**：React Native（TypeScript）—— 团队确认执行方案 B
2. **平台范围**：iOS + Android 双端；鸿蒙 NEXT 适配不在 MVP 范围内
3. **文档语言**：中文（开发团队内部沟通），关键术语附英文
4. **PRD 版本**：v1.0 MVP；v2/v3 路线图仅作为架构预留
5. **无障碍要求**：WCAG AA 级；目标用户群体（50+ 岁帕金森患者）的特殊交互需求在组件规范中已明确
6. **时间规划**：本计划为策略文档，按 P0/P1/P2 优先级排序，具体排期由项目管理团队根据实际资源确定

---

## Verification Steps

1. 确认 React Native 开发环境搭建完成（iOS + Android 模拟器可正常运行）
2. 评审目录架构是否符合模块化原则（BLE/Storage/ReportEngine 可独立测试）
3. 路由表覆盖全部 12 个页面，无遗漏
4. 组件清单覆盖所有 PRD 原型所需元素
5. P0 模块不依赖任何 P1/P2 模块（验证模块独立性）
6. 无障碍检查清单 ≥ 8 项，全部可自动化或人工验证
7. 设备兼容性矩阵覆盖主要用户设备类型
