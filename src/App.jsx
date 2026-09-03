import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';

// 工具页面路由按需动态懒加载 (实现 Code Splitting，显著降低首屏 JS 体积)
const ToolsHome = lazy(() => import('./pages/tools/ToolsHome'));
const Timestamp = lazy(() => import('./pages/tools/Timestamp'));
const JsonFormatter = lazy(() => import('./pages/tools/JsonFormatter'));
const RegexTester = lazy(() => import('./pages/tools/RegexTester'));
const BaseConvert = lazy(() => import('./pages/tools/BaseConvert'));
const Codec = lazy(() => import('./pages/tools/Codec'));
const HashGenerator = lazy(() => import('./pages/tools/HashGenerator'));
const CodePad = lazy(() => import('./pages/tools/CodePad'));
const OzonRichContent = lazy(() => import('./pages/tools/OzonRichContent'));
const OzonSizeTable = lazy(() => import('./pages/tools/OzonSizeTable'));
const JsonToJava = lazy(() => import('./pages/tools/JsonToJava'));
const CronPredictor = lazy(() => import('./pages/tools/CronPredictor'));
const CheatsheetHome = lazy(() => import('./pages/cheatsheets/CheatsheetHome'));
const SqlToPojo = lazy(() => import('./pages/tools/SqlToPojo'));
const DiffViewer = lazy(() => import('./pages/tools/DiffViewer'));
const JwtDecoder = lazy(() => import('./pages/tools/JwtDecoder'));
const CurlConverter = lazy(() => import('./pages/tools/CurlConverter'));
const OzonProfitCalc = lazy(() => import('./pages/tools/OzonProfitCalc'));
const LocalScratchpad = lazy(() => import('./pages/tools/LocalScratchpad'));
const ZenFocus = lazy(() => import('./pages/tools/ZenFocus'));
const AboutMe = lazy(() => import('./pages/AboutMe'));

import WebTerminal from './components/WebTerminal';

/**
 * Apple 极简优雅路由过渡骨架
 */
function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        gap: '0.75rem',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          border: '2.5px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      <span>载入中...</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * 根应用路由配置 (包含按需拆包加载优化)
 */
export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* 网站导航主页 */}
          <Route path="/" element={<Home />} />

          {/* 小工具板块首页 */}
          <Route path="/tools" element={<ToolsHome />} />

          {/* 技术速查备忘录 */}
          <Route path="/cheatsheet" element={<CheatsheetHome />} />

          {/* 关于我与技术雷达 */}
          <Route path="/about" element={<AboutMe />} />

          {/* 跨境电商专用工具 */}
          <Route path="/tools/ozon-rich" element={<OzonRichContent />} />
          <Route path="/tools/ozon-size" element={<OzonSizeTable />} />
          <Route path="/tools/ozon-calc" element={<OzonProfitCalc />} />

          {/* 开发者实用通用工具 */}
          <Route path="/tools/sql-to-pojo" element={<SqlToPojo />} />
          <Route path="/tools/diff" element={<DiffViewer />} />
          <Route path="/tools/code-pad" element={<CodePad />} />
          <Route path="/tools/timestamp" element={<Timestamp />} />
          <Route path="/tools/json" element={<JsonFormatter />} />
          <Route path="/tools/json-to-java" element={<JsonToJava />} />
          <Route path="/tools/cron" element={<CronPredictor />} />
          <Route path="/tools/regex" element={<RegexTester />} />
          <Route path="/tools/curl" element={<CurlConverter />} />
          <Route path="/tools/base-convert" element={<BaseConvert />} />
          <Route path="/tools/codec" element={<Codec />} />
          <Route path="/tools/jwt" element={<JwtDecoder />} />
          <Route path="/tools/hash" element={<HashGenerator />} />

          {/* 生产力与专注 */}
          <Route path="/tools/scratchpad" element={<LocalScratchpad />} />
          <Route path="/tools/zen-focus" element={<ZenFocus />} />

          {/* 兜底路由 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {/* 全局极客唤起式终端浮层 */}
      <WebTerminal />
    </HashRouter>
  );
}

