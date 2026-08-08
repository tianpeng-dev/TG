# TremorGuard 前端 Monorepo 脚手架初始化计划

## Summary

为 TremorGuard（帕金森病震颤监测智能腕带，二类医疗器械）搭建前端 monorepo 脚手架，支撑三类客户端（患者端 React Native App、医生端 Web 仪表盘、管理后台 Web），建立共享技术栈与版本锁定，定义三大核心模块接口（BLE 服务、本地数据库、同步引擎），并提供初始化验证检查脚本。本阶段仅完成基础设施搭建，**不包含任何页面开发**。

技术基座：**pnpm workspaces + Turborepo**，Web 端统一使用 **Vite + React Router**，共享包采用**细粒度独立包**拆分。

---

## Current State Analysis

### 既有产物
- `/Users/peng/Documents/trae_projects/TremorGuard/` 下当前仅有设计/文档资产，**无任何代码工程**：
  - `tremorguard-mvp-prd/`、`tremorguard-investment-prd/`、`tremorguard-drd/`、`tremorguard-ux-analysis/` — HTML 自包含文档
  - `tremorguard-app/` — 静态 HTML 高保真原型（手机框 + 桌面端预览）
  - `.trae/documents/tremorguard-implementation-plan.md` — 已有的 RN 单端实施计划（仅覆盖患者端，未规划 monorepo）
- 既无 `package.json`、`pnpm-workspace.yaml`、`tsconfig.json`、`turbo.json`，也无任何 RN 或 Web 工程目录

### 既有约定（来自项目记忆）
- 技术栈：React Native + TypeScript（PRD 已锁定）
- 目录约定：`src/core/`（BLE/存储/加密/报告引擎）+ `src/features/`（8 功能模块）+ `src/shared/`（组件/主题/工具）
- 设计令牌：主色 `#0D9488`，状态色 safe/warning/danger 配对，最小字号 16px，按钮 ≥48dp
- 离线优先：本地 SQLite 持久化，网络仅用于同步
- 关键约束：BLE 延迟 <10ms，自动重连 + 心跳检测；50Hz 数据流；AES-128 链路加密
- 领域模型（已在 PRD/DRD 中定义）：TremorLevel、MedicationEvent、ThresholdConfig、ClinicReport、DeviceStatus、PatientProfile、WristbandBinding

### 与既有实施计划的关系
- 既有 `tremorguard-implementation-plan.md` 仅规划了单端 RN 目录（`tremorguard-rn/`），未覆盖医生端/管理后台
- 本计划**升级为 monorepo 结构**，原 `tremorguard-rn/src/core/` 下的 BLE/Storage/Report 等模块**抽取为独立共享包**，便于跨端复用与独立测试
- 本计划仅产出**脚手架与接口定义**，不实现具体业务逻辑；后续 P0 开发将在本脚手架上展开

---

## Proposed Changes

### 一、Monorepo 顶层目录结构

新建根目录 `tremorguard-frontend/`（与既有文档目录平级）：

```
tremorguard-frontend/
├── apps/                                # 三类客户端
│   ├── patient-app/                     # 患者端 React Native App
│   ├── doctor-dashboard/                # 医生端 Web 仪表盘（Vite）
│   └── admin-console/                   # 管理后台 Web（Vite）
├── packages/                            # 细粒度共享包
│   ├── shared-types/                    # 跨端领域模型与 API 契约
│   ├── ble-core/                        # BLE 服务抽象（仅 RN 用，独立测试）
│   ├── storage-core/                    # SQLite 本地持久化抽象
│   ├── sync-engine/                     # 同步引擎（增量/冲突解决）
│   ├── report-engine/                   # 报告引擎（指标计算 + 结论翻译）
│   ├── ui-theme/                        # 共享设计令牌（颜色/字号/间距）
│   └── config/                          # 共享构建配置（tsconfig/eslint/prettier）
├── tools/
│   └── verify-scaffold.ts               # 初始化验证检查脚本
├── .changeset/                          # 版本管理配置（预留）
├── .github/
│   └── workflows/ci.yml                 # CI 流水线（lint + type-check + build）
├── package.json                         # 根 package.json（devDeps + scripts）
├── pnpm-workspace.yaml                  # pnpm 工作区声明
├── turbo.json                           # Turborepo 构建编排
├── tsconfig.base.json                   # 共享 TS 基础配置
├── .npmrc                               # pnpm 配置（hoist-pattern for RN）
├── .nvmrc                               # Node 版本锁定 18.x
├── .editorconfig
├── .gitignore
├── .prettierrc.js
└── README.md
```

### 二、根级配置文件

#### 2.1 `package.json`（根）

**职责**：声明 monorepo 元信息、devDependencies（构建工具链）、跨包 scripts（通过 Turborepo 编排）。

```jsonc
{
  "name": "tremorguard-frontend",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.7.0",
  "engines": {
    "node": ">=18.18.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "verify": "tsx tools/verify-scaffold.ts",
    "clean": "turbo run clean && rm -rf node_modules",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "build": "turbo run build",
    "dev": "turbo run dev --parallel"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "prettier": "^3.3.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/parser": "^7.10.0",
    "@typescript-eslint/eslint-plugin": "^7.10.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

**版本锁定说明**：
- Node 18.18+（LTS，支持 React Native 0.72+ 的 Hermes 要求）
- TypeScript 5.4+（满足 5.0+ 约束，并支持最新 `satisfies` 与 const type parameter）
- Turborepo 2.0（新版缓存策略更优）
- pnpm 9.7（与 Turborepo 2.0 兼容性最佳）

#### 2.2 `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### 2.3 `.npmrc`（RN 兼容关键配置）

```ini
# React Native 在 pnpm 严格 node_modules 下需 hoist 特定依赖
node-linker=hoisted
public-hoist-pattern[]=*react-native*
public-hoist-pattern[]=*metro*
public-hoist-pattern[]=*@react-native*
public-hoist-pattern[]=*@babel/*
# 避免 pnpm peer 警告阻断安装
strict-peer-dependencies=false
auto-install-peers=true
```

#### 2.4 `turbo.json`

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.base.json", ".npmrc"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".expo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": [],
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

#### 2.5 `tsconfig.base.json`（共享 TS 基础）

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

#### 2.6 `.nvmrc`

```
18.18.0
```

---

### 三、共享包结构（7 个独立 package）

#### 3.1 `packages/shared-types/` — 跨端领域模型

**职责**：定义所有领域实体、值对象、API 请求/响应契约。零运行时依赖，纯类型包，跨端共享。

```
packages/shared-types/
├── src/
│   ├── index.ts                    # 统一导出
│   ├── domain/
│   │   ├── TremorLevel.ts          # 震颤等级序列（5 级：0-4）
│   │   ├── MedicationEvent.ts      # 服药事件
│   │   ├── ThresholdConfig.ts      # 阈值配置
│   │   ├── ClinicReport.ts         # 就诊报告
│   │   ├── DeviceStatus.ts         # 设备状态
│   │   ├── PatientProfile.ts       # 患者档案
│   │   └── WristbandBinding.ts     # 腕带绑定关系（含解绑/重绑生命周期）
│   ├── api/
│   │   ├── contracts.ts            # REST API 请求/响应契约
│   │   └── sync.ts                 # 同步协议契约（delta payload）
│   └── enums.ts                    # 枚举（Phase/Severity/SyncStatus 等）
├── package.json
├── tsconfig.json
└── README.md
```

**`package.json`**：
```jsonc
{
  "name": "@tremorguard/shared-types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist node_modules"
  }
}
```

**核心类型示例**（`src/domain/TremorLevel.ts`）：
```typescript
export type TremorSeverity = 0 | 1 | 2 | 3 | 4;

export interface TremorLevel {
  readonly timestamp: string;        // ISO 8601
  readonly severity: TremorSeverity; // 0-4 级
  readonly frequencyHz?: number;     // 频率（算法团队提供）
  readonly amplitude?: number;       // 振幅
  readonly source: 'wristband' | 'manual';
}

export interface TremorLevelSeries {
  readonly patientId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly samples: readonly TremorLevel[]; // 50Hz → 每 20ms 一帧
  readonly samplingRateHz: 50;
}
```

#### 3.2 `packages/ble-core/` — BLE 服务抽象（**核心接口定义 1**）

**职责**：抽象 BLE 连接状态机、特征值订阅、自动重连、心跳检测。仅 patient-app 实际接入，但独立成包便于单元测试与 mock。

```
packages/ble-core/
├── src/
│   ├── index.ts
│   ├── types.ts                    # 核心接口定义（BLEManager / Connection / Characteristic）
│   ├── errors.ts                   # BLEError 类型层级
│   ├── protocol/
│   │   ├── gatt-profile.ts         # GATT 服务/特征值 UUID 占位（待固件团队补全）
│   │   └── packet-schema.ts        # 数据包结构定义
│   ├── state-machine.ts            # 连接状态机类型（Disconnected/Scanning/Connecting/Connected/Reconnecting）
│   └── heartbeat.ts                # 心跳协议类型定义
├── package.json
├── tsconfig.json
└── README.md
```

**核心接口定义**（`src/types.ts`）：

```typescript
import type { TremorLevelSeries } from '@tremorguard/shared-types';

/**
 * BLE 连接状态
 */
export type BLEConnectionState =
  | { status: 'disconnected'; lastError?: BLEError }
  | { status: 'scanning'; startedAt: number }
  | { status: 'connecting'; deviceAddress: string }
  | { status: 'connected'; deviceAddress: string; mtu: number; rssi: number }
  | { status: 'reconnecting'; attempt: number; nextAttemptAt: number };

/**
 * BLE 管理器接口 —— 由具体平台实现（react-native-ble-plx 适配器）
 */
export interface BLEManager {
  /** 当前连接状态（只读流） */
  readonly state: Readonly<BLEConnectionState>;

  /** 扫描腕带设备（filter by service UUID） */
  scanDevices(timeoutMs: number): AsyncIterable<BLEDevice>;

  /** 连接指定设备，协商 MTU */
  connect(deviceAddress: string, options?: ConnectOptions): Promise<void>;

  /** 主动断开 */
  disconnect(): Promise<void>;

  /** 订阅震颤数据流（50Hz 特征值通知） */
  subscribeTremorStream(): AsyncIterable<TremorLevelSeries>;

  /** 启用心跳检测（间隔 ≤ 5s，超时触发重连） */
  enableHeartbeat(intervalMs: number): void;

  /** 注册状态变更监听 */
  onStateChange(listener: (state: BLEConnectionState) => void): Unsubscribe;

  /** 注册数据延迟监控（约束：< 10ms） */
  onLatencyViolation(listener: (latencyMs: number) => void): Unsubscribe;
}

export interface ConnectOptions {
  readonly mtu?: number;             // 默认 185
  readonly autoReconnect?: boolean;  // 默认 true
  readonly maxReconnectAttempts?: number; // 默认 10
}

export interface BLEDevice {
  readonly address: string;
  readonly name: string;
  readonly rssi: number;
  readonly advertisedServices: readonly string[];
}

export type Unsubscribe = () => void;

export abstract class BLEError extends Error {
  abstract readonly code: BLEErrorCode;
  readonly timestamp: number = Date.now();
}
export enum BLEErrorCode {
  ScanFailed = 'SCAN_FAILED',
  ConnectionTimeout = 'CONNECTION_TIMEOUT',
  DeviceNotFound = 'DEVICE_NOT_FOUND',
  SubscriptionFailed = 'SUBSCRIPTION_FAILED',
  HeartbeatTimeout = 'HEARTBEAT_TIMEOUT',
  LatencyExceeded = 'LATENCY_EXCEEDED', // > 10ms
  AuthenticationFailed = 'AUTH_FAILED',
}
```

**心跳协议类型**（`src/heartbeat.ts`）：
```typescript
export interface HeartbeatConfig {
  readonly intervalMs: number;       // 默认 3000
  readonly timeoutMs: number;        // 默认 5000
  readonly maxMissed: number;        // 默认 2，超过触发重连
}

export interface HeartbeatEvent {
  readonly type: 'beat' | 'missed' | 'timeout';
  readonly sequence: number;
  readonly latencyMs: number;
}
```

#### 3.3 `packages/storage-core/` — 本地数据库抽象（**核心接口定义 2**）

**职责**：定义 SQLite 适配器接口、Repository 模式、迁移机制、加密 Provider。离线优先架构核心。

```
packages/storage-core/
├── src/
│   ├── index.ts
│   ├── types.ts                    # DatabaseAdapter / Repository / Migration 接口
│   ├── schema/
│   │   ├── migrations.ts           # 迁移定义（v0 → v1）
│   │   └── tables.ts               # 表结构类型
│   ├── encryption.ts               # EncryptionProvider 接口（AES-128）
│   └── errors.ts
├── package.json
├── tsconfig.json
└── README.md
```

**核心接口定义**（`src/types.ts`）：

```typescript
import type { PatientProfile, TremorLevel, MedicationEvent, ClinicReport } from '@tremorguard/shared-types';

/**
 * 数据库适配器接口 —— 由 RN 端用 react-native-sqlite-storage 实现
 * Web 端（医生/管理后台）使用 sql.js 或远程 API 替代实现
 */
export interface DatabaseAdapter {
  /** 打开/初始化数据库 */
  open(config: DatabaseConfig): Promise<void>;

  /** 关闭数据库 */
  close(): Promise<void>;

  /** 执行单条 SQL（无返回值） */
  execute(sql: string, params?: readonly SqlValue[]): Promise<void>;

  /** 批量事务执行 */
  transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;

  /** 查询 */
  query<T>(sql: string, params?: readonly SqlValue[]): Promise<readonly T[]>;
}

export interface DatabaseConfig {
  readonly name: string;
  readonly version: number;
  readonly encryptionKey?: string;  // 启用 SQLCipher
  readonly location?: 'default' | 'documents';
}

export interface Transaction {
  execute(sql: string, params?: readonly SqlValue[]): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export type SqlValue = string | number | boolean | Uint8Array | null;

/**
 * 通用 Repository 接口 —— 领域 Repository 继承此接口
 */
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<readonly T[]>;
  save(entity: T): Promise<void>;
  saveBatch(entities: readonly T[]): Promise<void>;
  delete(id: ID): Promise<void>;
  count(): Promise<number>;
}

/** 震颤数据 Repository —— 高频写入优化 */
export interface TremorRepository extends Repository<TremorLevel, string> {
  findByTimeRange(start: string, end: string): Promise<readonly TremorLevel[]>;
  findLatest(): Promise<TremorLevel | null>;
  deleteBefore(timestamp: string): Promise<number>; // 返回删除条数
}

export interface MedicationRepository extends Repository<MedicationEvent, string> {
  findByDate(date: string): Promise<readonly MedicationEvent[]>;
}

export interface ReportRepository extends Repository<ClinicReport, string> {
  findLatestByPatient(patientId: string): Promise<ClinicReport | null>;
}

export interface PatientRepository extends Repository<PatientProfile, string> {}

/**
 * 迁移机制
 */
export interface Migration {
  readonly version: number;
  readonly description: string;
  up(db: DatabaseAdapter): Promise<void>;
  down?(db: DatabaseAdapter): Promise<void>;
}

export interface MigrationRunner {
  migrate(targetVersion?: number): Promise<void>;
  currentVersion(): Promise<number>;
}
```

**加密 Provider 接口**（`src/encryption.ts`）：

```typescript
export interface EncryptionProvider {
  /** 生成新密钥（存入 Keychain/Keystore） */
  generateKey(): Promise<string>;

  /** 加密 */
  encrypt(plaintext: Uint8Array, key: string): Promise<Uint8Array>;

  /** 解密 */
  decrypt(ciphertext: Uint8Array, key: string): Promise<Uint8Array>;

  /** 计算哈希（用于同步 CRC 校验） */
  hash(data: Uint8Array): Promise<string>;
}
```

#### 3.4 `packages/sync-engine/` — 同步引擎（**核心接口定义 3**）

**职责**：定义增量同步、冲突解决、断点续传、网络适配器抽象。**离线优先架构中，网络仅用于同步**。

```
packages/sync-engine/
├── src/
│   ├── index.ts
│   ├── types.ts                    # SyncEngine / SyncState / ConflictResolver 接口
│   ├── network-adapter.ts          # NetworkAdapter 抽象（具体实现由后端 API 适配）
│   ├── strategies/
│   │   ├── delta-sync.ts           # 增量同步策略类型
│   │   └── conflict-resolution.ts  # 冲突解决策略类型
│   └── errors.ts
├── package.json
├── tsconfig.json
└── README.md
```

**核心接口定义**（`src/types.ts`）：

```typescript
import type { Repository } from '@tremorguard/storage-core';

export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'offline' | 'error';

export interface SyncState {
  readonly status: SyncStatus;
  readonly lastSyncAt?: string;
  readonly pendingChanges: number;
  readonly failedAttempts: number;
  readonly lastError?: SyncError;
}

export interface SyncEngine {
  readonly state: Readonly<SyncState>;

  /** 启动一次同步（push 本地变更 + pull 远端变更） */
  sync(): Promise<SyncResult>;

  /** 注册状态变更监听 */
  onStateChange(listener: (state: SyncState) => void): Unsubscribe;

  /** 网络恢复时自动触发 */
  enableAutoSync(options?: AutoSyncOptions): void;

  /** 销毁引擎 */
  dispose(): void;
}

export interface AutoSyncOptions {
  readonly debounceMs: number;       // 默认 5000
  readonly maxRetries: number;       // 默认 5
  readonly backoffMultiplier: number;// 默认 2
}

export interface SyncResult {
  readonly pushed: number;
  readonly pulled: number;
  readonly conflicts: number;
  readonly durationMs: number;
  readonly success: boolean;
}

/**
 * 同步条目 —— 描述一次待同步变更
 */
export interface SyncDelta<T = unknown> {
  readonly entityId: string;
  readonly entityType: 'tremor' | 'medication' | 'report' | 'threshold' | 'patient';
  readonly operation: 'create' | 'update' | 'delete';
  readonly payload: T;
  readonly clientTimestamp: string;
  readonly clientVersion: number;    // 乐观锁版本号
}

/**
 * 冲突解决策略接口
 */
export interface ConflictResolver {
  resolve<T>(local: SyncDelta<T>, remote: SyncDelta<T>): Promise<SyncDelta<T>>;
}

export enum ConflictStrategy {
  ClientWins = 'CLIENT_WINS',
  ServerWins = 'SERVER_WINS',
  LastWriteWins = 'LAST_WRITE_WINS',
  Manual = 'MANUAL',
}

/**
 * 网络适配器 —— 抽象后端 API 调用
 * 实现方：packages/sync-engine 内置 fetch-based 实现；
 * 测试时可 mock；RN 端可注入离线感知的 fetch
 */
export interface NetworkAdapter {
  push(deltas: readonly SyncDelta[]): Promise<PushResult>;
  pull(lastSyncAt: string): Promise<readonly SyncDelta[]>;
  isOnline(): Promise<boolean>;
  onConnectivityChange(listener: (online: boolean) => void): Unsubscribe;
}

export interface PushResult {
  readonly accepted: number;
  readonly rejected: number;
  readonly conflicts: readonly SyncDelta[];
}

export type Unsubscribe = () => void;
```

#### 3.5 `packages/report-engine/` — 报告引擎

**职责**：指标计算（控制率、剂末提前、开/关期时长）、临床结论句模板翻译。跨端共享（RN 生成报告、Web 端预览报告）。

```
packages/report-engine/
├── src/
│   ├── index.ts
│   ├── types.ts                    # MetricsCalculator / ConclusionTranslator 接口
│   ├── metrics/
│   │   ├── control-rate.ts         # 控制率计算（接口定义）
│   │   └── wearing-off.ts          # 剂末提前计算（接口定义）
│   ├── templates/
│   │   └── conclusion-sentences.ts # 结论句模板定义
│   └── errors.ts
├── package.json
├── tsconfig.json
└── README.md
```

**核心接口定义**（`src/types.ts`）：

```typescript
import type { TremorLevel, MedicationEvent, ClinicReport } from '@tremorguard/shared-types';

export interface ReportInput {
  readonly tremorSeries: readonly TremorLevel[];
  readonly medicationEvents: readonly MedicationEvent[];
  readonly startDate: string;
  readonly endDate: string;
  readonly threshold: number;
}

export interface ReportMetrics {
  readonly controlRate: number;          // 控制率 0-1
  readonly wearingOffAdvanceMin: number; // 剂末提前分钟数
  readonly onPhaseHours: number;         // 开期总时长
  readonly offPhaseHours: number;        // 关期总时长
  readonly dyskinesiaEpisodes?: number;  // 异动次数（v2）
}

export interface MetricsCalculator {
  calculate(input: ReportInput): Promise<ReportMetrics>;
}

export interface ConclusionTranslator {
  /** 将 metrics 翻译为患者可读的临床结论句 */
  translate(metrics: ReportMetrics, patientFriendly: true): Promise<string[]>;

  /** 将 metrics 翻译为医生可读的临床结论句 */
  translate(metrics: ReportMetrics, patientFriendly: false): Promise<string[]>;
}

export interface ReportRenderer {
  render(report: ClinicReport, format: 'pdf' | 'html' | 'a4-print'): Promise<Uint8Array>;
}
```

#### 3.6 `packages/ui-theme/` — 共享设计令牌

**职责**：从 PRD 14.5 节抽取颜色/字号/间距令牌，跨端共享（RN 用 `react-native` 样式对象，Web 用 CSS 变量）。

```
packages/ui-theme/
├── src/
│   ├── index.ts
│   ├── colors.ts                    # Colors 令牌（PRD 定义）
│   ├── typography.ts                # Typography 令牌
│   ├── spacing.ts                   # Spacing 令牌
│   ├── tokens.css                   # Web 端 CSS 变量导出
│   └── platform.ts                  # 平台检测 + 令牌格式适配
├── package.json
├── tsconfig.json
└── README.md
```

**`src/colors.ts`**（沿用既有设计令牌）：
```typescript
export const Colors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#99F6E4',
  accent: '#d97706',
  safe: { bg: '#D1FAE5', text: '#065F46' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  danger: { bg: '#FEE2E2', text: '#991B1B' },
  ink: '#1A1D21',
  muted: '#5E6573',
  rule: '#DDE1E7',
  background: '#F6F7F9',
  surface: '#FFFFFF',
  onPhase: '#34D399',
  transitionPhase: '#FBBF24',
  offPhase: '#F87171',
} as const;
```

#### 3.7 `packages/config/` — 共享构建配置

**职责**：导出共享的 `tsconfig`、`.eslintrc`、`.prettierrc` 配置，避免各包重复。

```
packages/config/
├── tsconfig/
│   ├── base.json
│   ├── react-native.json           # RN 包 extends
│   ├── react-web.json              # Web 包 extends
│   └── library.json                # 共享包 extends
├── eslint/
│   └── base.js
├── package.json
└── README.md
```

---

### 四、应用目录结构（apps/）

> **本阶段仅创建脚手架与入口文件，不开发任何业务页面。** 每个 app 内仅含：入口文件（空壳）、导航/路由占位、依赖声明、TS 配置。

#### 4.1 `apps/patient-app/` — 患者端 React Native

```
apps/patient-app/
├── src/
│   ├── App.tsx                      # 入口空壳（仅返回占位 View）
│   ├── navigation/
│   │   └── AppNavigator.tsx         # 导航占位（待 P0 实现）
│   ├── core/                        # 平台适配层（接入共享包）
│   │   ├── ble/
│   │   │   └── BlePlxAdapter.ts     # BLEManager 接口的 react-native-ble-plx 实现（占位）
│   │   ├── storage/
│   │   │   └── SqliteAdapter.ts     # DatabaseAdapter 接口的 sqlite-storage 实现（占位）
│   │   └── sync/
│   │       └── RemoteSyncAdapter.ts # NetworkAdapter 接口实现（占位）
│   └── features/                    # 8 功能模块占位目录（空）
├── ios/                             # RN iOS 原生工程（react-native CLI 生成）
├── android/                         # RN Android 原生工程
├── app.json
├── babel.config.js
├── metro.config.js                  # monorepo 兼容配置（watchFolders 指向根）
├── index.js
├── package.json
├── tsconfig.json
└── README.md
```

**`package.json`**（关键依赖）：
```jsonc
{
  "name": "@tremorguard/patient-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "react-native start",
    "build:android": "react-native run-android",
    "build:ios": "react-native run-ios",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf node_modules ios/Pods android/build"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.4",
    "react-native-ble-plx": "^3.0.0",
    "react-native-sqlite-storage": "^6.0.1",
    "react-native-keychain": "^8.1.3",
    "react-native-svg": "^14.1.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@tremorguard/shared-types": "workspace:*",
    "@tremorguard/ble-core": "workspace:*",
    "@tremorguard/storage-core": "workspace:*",
    "@tremorguard/sync-engine": "workspace:*",
    "@tremorguard/report-engine": "workspace:*",
    "@tremorguard/ui-theme": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.4.0",
    "metro-react-native-babel-preset": "^0.77.0"
  }
}
```

**`metro.config.js`**（monorepo 兼容关键配置）：
```javascript
const { getDefaultConfig } = require('metro-config');
const path = require('path');

module.exports = (async () => {
  const { resolver } = await getDefaultConfig();
  return {
    resolver: {
      ...resolver,
      nodeModulesPaths: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '../../node_modules'),
      ],
    },
    watchFolders: [path.resolve(__dirname, '../..')],
  };
})();
```

#### 4.2 `apps/doctor-dashboard/` — 医生端 Web（Vite）

```
apps/doctor-dashboard/
├── src/
│   ├── main.tsx                     # Vite 入口
│   ├── App.tsx                      # 应用根组件（空壳）
│   ├── router.tsx                   # React Router 路由定义（仅占位 / 路由）
│   ├── api/                         # API 调用层（注入 sync-engine 的 NetworkAdapter）
│   └── pages/                       # 页面目录（空，仅含占位 Home）
│       └── Home.tsx
├── public/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

**`package.json`**：
```jsonc
{
  "name": "@tremorguard/doctor-dashboard",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@tremorguard/shared-types": "workspace:*",
    "@tremorguard/report-engine": "workspace:*",
    "@tremorguard/ui-theme": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0",
    "typescript": "^5.4.0"
  }
}
```

#### 4.3 `apps/admin-console/` — 管理后台 Web（Vite）

结构与医生端一致，依赖略简（不需要 report-engine），仅含 shared-types + ui-theme：

```jsonc
{
  "name": "@tremorguard/admin-console",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { /* 同 doctor-dashboard */ },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@tremorguard/shared-types": "workspace:*",
    "@tremorguard/ui-theme": "workspace:*"
  },
  "devDependencies": { /* 同 doctor-dashboard */ }
}
```

---

### 五、初始化验证检查脚本

#### 5.1 `tools/verify-scaffold.ts`

**职责**：作为 `pnpm verify` 的执行入口，对脚手架完整性进行端到端检查。失败时非 0 退出。

```typescript
/**
 * TremorGuard Frontend Monorepo — 初始化验证脚本
 * 运行：pnpm verify
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

type CheckResult = { name: string; passed: boolean; detail?: string };
const results: CheckResult[] = [];

function check(name: string, fn: () => void | string) {
  try {
    const detail = fn();
    results.push({ name, passed: true, detail: typeof detail === 'string' ? detail : undefined });
  } catch (e) {
    results.push({ name, passed: false, detail: (e as Error).message });
  }
}

const ROOT = resolve(__dirname, '..');

// 1. 检查根配置文件齐全
check('根配置文件齐全', () => {
  const required = ['package.json', 'pnpm-workspace.yaml', 'turbo.json', 'tsconfig.base.json', '.npmrc', '.nvmrc'];
  const missing = required.filter(f => !existsSync(join(ROOT, f)));
  if (missing.length) throw new Error(`缺失：${missing.join(', ')}`);
});

// 2. 检查 workspace 声明与实际目录一致
check('pnpm-workspace 声明的包目录均存在', () => {
  const expectedPackages = [
    'packages/shared-types', 'packages/ble-core', 'packages/storage-core',
    'packages/sync-engine', 'packages/report-engine', 'packages/ui-theme', 'packages/config',
  ];
  const expectedApps = ['apps/patient-app', 'apps/doctor-dashboard', 'apps/admin-console'];
  const missing = [...expectedPackages, ...expectedApps].filter(p => !existsSync(join(ROOT, p)));
  if (missing.length) throw new Error(`缺失目录：${missing.join(', ')}`);
});

// 3. 检查每个 package 都有合法的 package.json
check('所有 package 拥有合法 package.json', () => {
  const pkgs = readdirSync(join(ROOT, 'packages')).map(p => `packages/${p}`);
  const apps = readdirSync(join(ROOT, 'apps')).map(a => `apps/${a}`);
  for (const dir of [...pkgs, ...apps]) {
    const pkgPath = join(ROOT, dir, 'package.json');
    if (!existsSync(pkgPath)) throw new Error(`${dir} 缺 package.json`);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (!pkg.name?.startsWith('@tremorguard/')) throw new Error(`${dir} name 不合规：${pkg.name}`);
    if (!pkg.version) throw new Error(`${dir} 缺 version`);
  }
});

// 4. 检查 workspace 依赖使用 workspace:* 协议
check('跨包依赖使用 workspace:* 协议', () => {
  const patientPkg = JSON.parse(readFileSync(join(ROOT, 'apps/patient-app/package.json'), 'utf-8'));
  const deps = patientPkg.dependencies || {};
  const tremorguardDeps = Object.entries(deps).filter(([k]) => k.startsWith('@tremorguard/'));
  const nonWorkspace = tremorguardDeps.filter(([, v]) => v !== 'workspace:*');
  if (nonWorkspaceDeps(nonWorkspace)) throw new Error(`未使用 workspace:* ：${nonWorkspace.map(([k]) => k).join(', ')}`);
});

function nonWorkspaceDeps(deps: [string, string][]) { return deps.length > 0; }

// 5. 检查核心接口定义文件存在
check('三大核心接口定义文件存在', () => {
  const files = [
    'packages/ble-core/src/types.ts',
    'packages/storage-core/src/types.ts',
    'packages/sync-engine/src/types.ts',
  ];
  const missing = files.filter(f => !existsSync(join(ROOT, f)));
  if (missing.length) throw new Error(`缺失：${missing.join(', ')}`);
});

// 6. 检查 TypeScript 编译通过（type-check）
check('TypeScript type-check 通过', () => {
  const r = spawnSync('pnpm', ['turbo', 'run', 'type-check'], { cwd: ROOT, encoding: 'utf-8' });
  if (r.status !== 0) throw new Error(`type-check 失败：\n${r.stdout}\n${r.stderr}`);
});

// 7. 检查 BLE 接口约束：<10ms 延迟、自动重连、心跳
check('BLE 接口约束齐全（延迟监控 / 自动重连 / 心跳）', () => {
  const bleTypes = readFileSync(join(ROOT, 'packages/ble-core/src/types.ts'), 'utf-8');
  const required = ['onLatencyViolation', 'autoReconnect', 'enableHeartbeat', 'BLEConnectionState'];
  const missing = required.filter(s => !bleTypes.includes(s));
  if (missing.length) throw new Error(`BLE 接口缺失关键约束：${missing.join(', ')}`);
});

// 8. 检查离线优先约束：Storage 接口 + Sync 接口独立
check('离线优先架构：Storage 与 Sync 接口分离', () => {
  const storageTypes = readFileSync(join(ROOT, 'packages/storage-core/src/types.ts'), 'utf-8');
  const syncTypes = readFileSync(join(ROOT, 'packages/sync-engine/src/types.ts'), 'utf-8');
  if (!/DatabaseAdapter/.test(storageTypes)) throw new Error('storage-core 缺 DatabaseAdapter 接口');
  if (!/NetworkAdapter/.test(syncTypes)) throw new Error('sync-engine 缺 NetworkAdapter 接口');
});

// 输出报告
console.log('\n========== TremorGuard Frontend Scaffold Verification ==========\n');
for (const r of results) {
  const icon = r.passed ? '[PASS]' : '[FAIL]';
  console.log(`${icon} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
}
const failed = results.filter(r => !r.passed).length;
console.log(`\n${results.length - failed}/${results.length} 项通过`);
if (failed > 0) {
  console.error(`\n❌ ${failed} 项检查失败，请修复后再继续开发。`);
  process.exit(1);
} else {
  console.log('\n✅ 脚手架初始化验证全部通过。');
}
```

---

### 六、CI 流水线配置（预留）

#### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9.7.0
      - uses: actions/setup-node@v4
        with:
          node-version: 18.18.0
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
      - run: pnpm lint
      - run: pnpm type-check
```

---

## Assumptions & Decisions

### 关键决策
1. **Monorepo 工具**：pnpm workspaces + Turborepo（用户确认）—— RN 官方社区推荐，hoisted node-modules 兼容 Metro bundler
2. **Web 框架**：Vite + React Router 6（用户确认）—— 纯 SPA，部署简单，HMR 快
3. **共享包粒度**：细粒度独立包（用户确认）—— BLE/Storage/Sync/Report 各自独立，便于替换与测试
4. **包命名空间**：`@tremorguard/*` 私有 scope
5. **版本号策略**：所有内部包 `0.0.0` + `private: true`，使用 `workspace:*` 协议互引（不发版到 npm）
6. **TypeScript 模块解析**：`moduleResolution: Bundler`（兼容 Vite 5 与 Metro 0.76）
7. **React Native 版本**：锁定 0.73.4（满足 0.72+ 约束，且 Hermes 与新架构默认开启）
8. **目录命名**：遵循项目记忆中的 `src/core/` + `src/features/` + `src/shared/` 约定（在 patient-app 内保留），共享包内部使用 `src/` + 功能子目录

### 假设
1. 假设开发机已预装 Node 18.18+ 与 pnpm 9.7+（CI 中通过 setup-node 与 action-setup 锁定）
2. 假设 iOS/Android 原生工程通过 `react-native init` 生成后由脚手架迁移至 monorepo（具体迁移在 P0 实施阶段进行）
3. 假设固件团队 BLE GATT 协议文档尚未提供，`packages/ble-core/src/protocol/gatt-profile.ts` 中以占位常量声明 UUID
4. 假设后端 API 尚未确定，`packages/sync-engine/src/network-adapter.ts` 仅定义接口，不做实现
5. 假设本阶段不接入 ESLint 自定义规则库（如 react-hooks、jsx-a11y），P0 启动时再补充
6. 假设 `react-native-ble-plx` 的 Web 平台 mock 由测试时提供，ble-core 包不依赖 RN 运行时（仅类型层依赖）

### 与既有实施计划的衔接
- 既有 `tremorguard-implementation-plan.md` 中的 `tremorguard-rn/src/core/` 模块（BLEManager.ts / Database.ts / SyncService.ts）**升级为独立共享包**，路径前缀由 `tremorguard-rn/src/core/` 改为 `packages/{ble-core,storage-core,sync-engine}/src/`
- 既有 `tremorguard-rn/src/features/` 与 `tremorguard-rn/src/shared/` 保留在 `apps/patient-app/src/` 内
- 后续 P0 实施时，patient-app 内的 `core/ble/BlePlxAdapter.ts` 实现 `@tremorguard/ble-core` 的 `BLEManager` 接口

---

## Verification Steps

执行 `pnpm verify` 应完成以下检查（共 8 项）：

1. ✅ **根配置文件齐全**：`package.json` / `pnpm-workspace.yaml` / `turbo.json` / `tsconfig.base.json` / `.npmrc` / `.nvmrc` 全部存在
2. ✅ **workspace 声明与目录一致**：7 个 packages + 3 个 apps 目录均实际存在
3. ✅ **package.json 合规**：每个 package 拥有 `name`（@tremorguard/* 前缀）与 `version`
4. ✅ **workspace 协议使用正确**：跨包依赖均使用 `workspace:*`，避免版本漂移
5. ✅ **核心接口定义文件存在**：ble-core / storage-core / sync-engine 的 `types.ts` 齐全
6. ✅ **TypeScript type-check 通过**：`pnpm turbo run type-check` 全绿
7. ✅ **BLE 接口约束齐全**：包含延迟监控（`onLatencyViolation`）、自动重连（`autoReconnect`）、心跳（`enableHeartbeat`）三项关键约束类型
8. ✅ **离线优先架构验证**：Storage（`DatabaseAdapter`）与 Sync（`NetworkAdapter`）接口分离，网络仅用于同步

**额外的人工验证**：
- 运行 `pnpm install` 无报错（依赖解析成功）
- 运行 `pnpm dev` 在 patient-app 启动 Metro bundler 无报错（monorepo watchFolders 配置正确）
- 运行 `pnpm --filter @tremorguard/doctor-dashboard dev` 启动 Vite dev server 成功
- 在 patient-app 中 `import type { BLEManager } from '@tremorguard/ble-core'` 可被 TS 解析
