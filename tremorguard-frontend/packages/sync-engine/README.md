# @tremorguard/sync-engine

同步引擎。增量同步、冲突解决、断点续传、网络适配器抽象。

## 离线优先架构

> 网络仅用于同步。本地数据库是 source of truth。

- 本地写入先落 SQLite，标记 `synced=0`
- 后台 SyncEngine 异步推送到云端（push）
- 拉取远端变更（pull）并合并到本地
- 网络中断时，变更排队等待下次同步
- 冲突通过 ConflictResolver 解决

## 实现方

- `NetworkAdapter`：由 `apps/patient-app/src/core/sync/RemoteSyncAdapter.ts` 基于 fetch 实现
- `SyncEngine`：由 sync-engine 包内部提供默认实现（待 P0 阶段实现）
