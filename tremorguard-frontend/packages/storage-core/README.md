# @tremorguard/storage-core

本地数据库抽象层。SQLite 适配器接口 + Repository 模式 + 迁移机制 + 加密 Provider。

## 离线优先架构

本地 SQLite 是数据的 source of truth，网络仅用于同步。
所有读取操作走本地数据库，写入操作先落本地再异步同步到云端。

## 实现方

由 `apps/patient-app/src/core/storage/SqliteAdapter.ts` 基于 `react-native-sqlite-storage` 实现。

```typescript
import type { DatabaseAdapter, TremorRepository } from '@tremorguard/storage-core';
```
