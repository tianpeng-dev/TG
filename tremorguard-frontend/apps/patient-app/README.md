# TremorGuard Patient App (React Native)

帕金森病震颤监测智能腕带 —— 患者端 RN App。

## 脚手架状态

本目录为脚手架，仅包含：
- 入口文件（App.tsx 空壳）
- 导航占位
- 平台适配器占位（BLE/Storage/Sync）
- 8 功能模块占位目录

P0 阶段在此脚手架上实现业务页面。

## 启动

```bash
# 安装依赖（在 monorepo 根目录）
pnpm install

# 启动 Metro bundler
pnpm --filter @tremorguard/patient-app dev

# 运行 iOS
pnpm --filter @tremorguard/patient-app build:ios

# 运行 Android
pnpm --filter @tremorguard/patient-app build:android
```

## iOS/Android 原生工程

P0 阶段通过 `npx react-native init` 生成原生工程后，迁移至本目录的 `ios/` 与 `android/` 子目录。
当前阶段仅保留 TypeScript 代码与 Metro 配置。
