import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/Home';

export function AppRouter(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* P0 阶段添加更多路由：用户管理 / 设备管理 / 数据审计 */}
    </Routes>
  );
}
