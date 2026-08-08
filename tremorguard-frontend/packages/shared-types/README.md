# @tremorguard/shared-types

跨端领域模型与 API 契约包。零运行时依赖，纯类型包。

## 内容

- `domain/` — 领域实体（TremorLevel、MedicationEvent、ThresholdConfig、ClinicReport、DeviceStatus、PatientProfile、WristbandBinding）
- `api/` — REST API 与同步协议契约
- `enums.ts` — 共享枚举

## 使用

```typescript
import type { TremorLevel, ClinicReport } from '@tremorguard/shared-types';
```
