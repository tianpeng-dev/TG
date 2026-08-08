/**
 * TremorGuard Frontend Monorepo — 初始化验证脚本
 *
 * 运行：pnpm verify
 *
 * 检查 8 项：
 * 1. 根配置文件齐全
 * 2. workspace 声明的包目录均存在
 * 3. 所有 package 拥有合法 package.json
 * 4. 跨包依赖使用 workspace:* 协议
 * 5. 三大核心接口定义文件存在
 * 6. TypeScript type-check 通过
 * 7. BLE 接口约束齐全（延迟监控 / 自动重连 / 心跳）
 * 8. 离线优先架构：Storage 与 Sync 接口分离
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

type CheckResult = { name: string; passed: boolean; detail?: string };
const results: CheckResult[] = [];

function check(name: string, fn: () => void | string): void {
  try {
    const detail = fn();
    results.push({
      name,
      passed: true,
      detail: typeof detail === 'string' ? detail : undefined,
    });
  } catch (e) {
    results.push({ name, passed: false, detail: (e as Error).message });
  }
}

const ROOT = resolve(__dirname, '..');

// 1. 检查根配置文件齐全
check('根配置文件齐全', () => {
  const required = [
    'package.json',
    'pnpm-workspace.yaml',
    'turbo.json',
    'tsconfig.base.json',
    '.npmrc',
    '.nvmrc',
  ];
  const missing = required.filter((f) => !existsSync(join(ROOT, f)));
  if (missing.length) throw new Error(`缺失：${missing.join(', ')}`);
});

// 2. 检查 workspace 声明与实际目录一致
check('pnpm-workspace 声明的包目录均存在', () => {
  const expectedPackages = [
    'packages/shared-types',
    'packages/ble-core',
    'packages/storage-core',
    'packages/sync-engine',
    'packages/report-engine',
    'packages/ui-theme',
    'packages/config',
  ];
  const expectedApps = [
    'apps/patient-app',
    'apps/doctor-dashboard',
    'apps/admin-console',
  ];
  const missing = [...expectedPackages, ...expectedApps].filter((p) =>
    !existsSync(join(ROOT, p)),
  );
  if (missing.length) throw new Error(`缺失目录：${missing.join(', ')}`);
});

// 3. 检查每个 package 都有合法的 package.json
check('所有 package 拥有合法 package.json', () => {
  // 仅遍历目录，跳过 .DS_Store 等隐藏文件
  const listDirs = (parent: string) =>
    readdirSync(join(ROOT, parent))
      .filter((name) => !name.startsWith('.'))
      .filter((name) => statSync(join(ROOT, parent, name)).isDirectory())
      .map((name) => `${parent}/${name}`);
  const pkgs = listDirs('packages');
  const apps = listDirs('apps');
  for (const dir of [...pkgs, ...apps]) {
    const pkgPath = join(ROOT, dir, 'package.json');
    if (!existsSync(pkgPath)) throw new Error(`${dir} 缺 package.json`);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (!pkg.name?.startsWith('@tremorguard/')) {
      throw new Error(`${dir} name 不合规：${pkg.name}`);
    }
    if (!pkg.version) throw new Error(`${dir} 缺 version`);
  }
});

// 4. 检查 workspace 依赖使用 workspace:* 协议
check('跨包依赖使用 workspace:* 协议', () => {
  const patientPkg = JSON.parse(
    readFileSync(join(ROOT, 'apps/patient-app/package.json'), 'utf-8'),
  );
  const deps = patientPkg.dependencies || {};
  const tremorguardDeps = Object.entries(deps).filter(([k]) =>
    k.startsWith('@tremorguard/'),
  );
  const nonWorkspace = tremorguardDeps.filter(([, v]) => v !== 'workspace:*');
  if (nonWorkspace.length > 0) {
    throw new Error(
      `未使用 workspace:* ：${nonWorkspace.map(([k]) => k).join(', ')}`,
    );
  }
});

// 5. 检查核心接口定义文件存在
check('三大核心接口定义文件存在', () => {
  const files = [
    'packages/ble-core/src/types.ts',
    'packages/storage-core/src/types.ts',
    'packages/sync-engine/src/types.ts',
  ];
  const missing = files.filter((f) => !existsSync(join(ROOT, f)));
  if (missing.length) throw new Error(`缺失：${missing.join(', ')}`);
});

// 6. 检查 TypeScript 编译通过（type-check）
check('TypeScript type-check 通过', () => {
  const r = spawnSync('pnpm', ['turbo', 'run', 'type-check'], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  if (r.status !== 0) {
    throw new Error(`type-check 失败：\n${r.stdout}\n${r.stderr}`);
  }
});

// 7. 检查 BLE 接口约束：<10ms 延迟、自动重连、心跳
check('BLE 接口约束齐全（延迟监控 / 自动重连 / 心跳）', () => {
  const bleTypes = readFileSync(
    join(ROOT, 'packages/ble-core/src/types.ts'),
    'utf-8',
  );
  const required = [
    'onLatencyViolation',
    'autoReconnect',
    'enableHeartbeat',
    'BLEConnectionState',
  ];
  const missing = required.filter((s) => !bleTypes.includes(s));
  if (missing.length) {
    throw new Error(`BLE 接口缺失关键约束：${missing.join(', ')}`);
  }
});

// 8. 检查离线优先约束：Storage 接口 + Sync 接口独立
check('离线优先架构：Storage 与 Sync 接口分离', () => {
  const storageTypes = readFileSync(
    join(ROOT, 'packages/storage-core/src/types.ts'),
    'utf-8',
  );
  // NetworkAdapter 定义在 network-adapter.ts，但应在 index.ts 导出
  const syncIndex = readFileSync(
    join(ROOT, 'packages/sync-engine/src/index.ts'),
    'utf-8',
  );
  const syncNetworkAdapter = readFileSync(
    join(ROOT, 'packages/sync-engine/src/network-adapter.ts'),
    'utf-8',
  );
  if (!/DatabaseAdapter/.test(storageTypes)) {
    throw new Error('storage-core 缺 DatabaseAdapter 接口');
  }
  if (!/NetworkAdapter/.test(syncNetworkAdapter)) {
    throw new Error('sync-engine/src/network-adapter.ts 缺 NetworkAdapter 接口');
  }
  if (!/NetworkAdapter/.test(syncIndex)) {
    throw new Error('sync-engine/src/index.ts 未导出 NetworkAdapter');
  }
});

// 输出报告
console.log('\n========== TremorGuard Frontend Scaffold Verification ==========\n');
for (const r of results) {
  const icon = r.passed ? '[PASS]' : '[FAIL]';
  console.log(`${icon} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
}
const failed = results.filter((r) => !r.passed).length;
console.log(`\n${results.length - failed}/${results.length} 项通过`);
if (failed > 0) {
  console.error(`\n❌ ${failed} 项检查失败，请修复后再继续开发。`);
  process.exit(1);
} else {
  console.log('\n✅ 脚手架初始化验证全部通过。');
}
