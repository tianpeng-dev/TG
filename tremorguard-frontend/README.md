# TremorGuard Frontend Monorepo

帕金森病震颤监测智能腕带 —— 前端 monorepo 脚手架。

## 技术栈

- **包管理**：pnpm workspaces + Turborepo
- **运行时**：Node.js 18.18+ (见 `.nvmrc`)
- **语言**：TypeScript 5.4+
- **患者端**：React Native 0.73.4 + React 18.2
- **医生端 / 管理后台**：Vite 5 + React 18.2 + React Router 6

## 目录结构

```
tremorguard-frontend/
├── apps/
│   ├── patient-app/         # 患者端 React Native App
│   ├── doctor-dashboard/    # 医生端 Web 仪表盘（Vite）
│   └── admin-console/       # 管理后台 Web（Vite）
├── packages/
│   ├── shared-types/        # 跨端领域模型与 API 契约
│   ├── ble-core/            # BLE 服务抽象
│   ├── storage-core/        # SQLite 本地持久化抽象
│   ├── sync-engine/         # 同步引擎
│   ├── report-engine/       # 报告引擎（指标 + 结论翻译）
│   ├── ui-theme/            # 共享设计令牌
│   └── config/              # 共享构建配置
└── tools/
    └── verify-scaffold.ts   # 初始化验证脚本
```

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 初始化验证（8 项检查）
pnpm verify

# 3. 启动开发
pnpm dev                                 # 并行启动所有 app
pnpm --filter @tremorguard/patient-app dev       # 仅 RN 患者 App
pnpm --filter @tremorguard/doctor-dashboard dev  # 仅医生端
pnpm --filter @tremorguard/admin-console dev     # 仅管理后台
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm verify` | 脚手架完整性检查（8 项） |
| `pnpm lint` | 全工作区 ESLint |
| `pnpm type-check` | 全工作区 TS 类型检查 |
| `pnpm build` | 全工作区构建 |
| `pnpm clean` | 清理所有构建产物与 node_modules |

## 架构约束

- **离线优先**：本地 SQLite 持久化，网络仅用于同步（见 `packages/storage-core` + `packages/sync-engine`）
- **BLE 通信**：延迟 < 10ms，自动重连 + 心跳检测（见 `packages/ble-core/src/types.ts`）
- **跨端共享**：领域模型、报告引擎、设计令牌跨端复用
- **不包含页面开发**：本脚手架仅含基础设施与接口定义，业务页面在 P0 阶段开发

## 包依赖关系

```
patient-app ─┬─> ble-core ──> shared-types
             ├─> storage-core ──> shared-types
             ├─> sync-engine ──> storage-core ──> shared-types
             ├─> report-engine ──> shared-types
             └─> ui-theme

doctor-dashboard ─┬─> report-engine ──> shared-types
                  └─> ui-theme

admin-console ─┬─> shared-types
               └─> ui-theme
```
