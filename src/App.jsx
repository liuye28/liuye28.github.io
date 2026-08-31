import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ToolsHome from './pages/tools/ToolsHome';
import Timestamp from './pages/tools/Timestamp';
import JsonFormatter from './pages/tools/JsonFormatter';
import RegexTester from './pages/tools/RegexTester';
import BaseConvert from './pages/tools/BaseConvert';
import Codec from './pages/tools/Codec';
import HashGenerator from './pages/tools/HashGenerator';
import CodePad from './pages/tools/CodePad';
import OzonRichContent from './pages/tools/OzonRichContent';
import OzonSizeTable from './pages/tools/OzonSizeTable';

/**
 * 根应用路由配置 (包含 Ozon 刊登辅助工具)
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 网站导航主页 */}
        <Route path="/" element={<Home />} />

        {/* 小工具板块首页 */}
        <Route path="/tools" element={<ToolsHome />} />

        {/* 跨境电商专用工具 */}
        <Route path="/tools/ozon-rich" element={<OzonRichContent />} />
        <Route path="/tools/ozon-size" element={<OzonSizeTable />} />

        {/* 开发者实用通用工具 */}
        <Route path="/tools/code-pad" element={<CodePad />} />
        <Route path="/tools/timestamp" element={<Timestamp />} />
        <Route path="/tools/json" element={<JsonFormatter />} />
        <Route path="/tools/regex" element={<RegexTester />} />
        <Route path="/tools/base-convert" element={<BaseConvert />} />
        <Route path="/tools/codec" element={<Codec />} />
        <Route path="/tools/hash" element={<HashGenerator />} />

        {/* 兜底路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
