# @tremorguard/ui-theme

跨端共享设计令牌。从 PRD 14.5 节抽取，RN 与 Web 共用。

## 使用

```typescript
// RN
import { Colors, Typography } from '@tremorguard/ui-theme';

// Web（CSS 变量）
import '@tremorguard/ui-theme/src/tokens.css';
```

## 令牌来源

- 主色：Teal `#0D9488`（医疗专业性与安心感）
- 状态色配对：safe/warning/danger，背景 + 文字双色配对，满足色彩非唯一标识规则
- 字号：最小正文 16px，关键数字 24px，等级数字 48px
- 按钮尺寸：≥ 48dp，就诊模式退出按钮 ≥ 72dp
