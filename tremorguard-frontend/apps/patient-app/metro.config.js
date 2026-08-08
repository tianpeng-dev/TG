/**
 * Metro bundler 配置 - monorepo 兼容
 *
 * 关键：
 * - watchFolders 指向 monorepo 根目录，让 Metro 能感知 packages/*
 * - nodeModulesPaths 包含根 node_modules，让 hoisted 依赖可被解析
 */
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
