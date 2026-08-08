# @tremorguard/ble-core

BLE 服务抽象层。定义连接状态机、特征值订阅、自动重连、心跳检测的接口契约。

## 关键约束

- 数据延迟 < 10ms（通过 `onLatencyViolation` 监控）
- 自动重连（`ConnectOptions.autoReconnect` 默认开启）
- 心跳检测（`enableHeartbeat`，间隔 ≤ 5s）
- 50Hz 震颤数据流（`subscribeTremorStream`）

## 实现方

由 `apps/patient-app/src/core/ble/BlePlxAdapter.ts` 基于 `react-native-ble-plx` 实现。

```typescript
import type { BLEManager } from '@tremorguard/ble-core';
```
