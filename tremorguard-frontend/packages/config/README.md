# @tremorguard/config

共享构建配置包。导出 tsconfig / eslint / prettier 配置，避免各包重复。

## 使用

### tsconfig

```jsonc
// packages/foo/tsconfig.json
{
  "extends": "@tremorguard/config/tsconfig/library.json"
}
```

可选：
- `base.json` — 基础配置
- `react-native.json` — RN 包
- `react-web.json` — Web 包
- `library.json` — 共享库包

### eslint

```js
// packages/foo/.eslintrc.js
module.exports = {
  extends: ['@tremorguard/config/eslint/base'],
};
```
