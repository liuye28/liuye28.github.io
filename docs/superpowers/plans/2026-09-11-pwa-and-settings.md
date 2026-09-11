# PWA 离线应用化与全局数据备份中心 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Ly's Workspace 构建完整的 PWA 离线脱网运行能力（Prompt 热更新 + 桌面安装）以及 macOS 偏好设置风格的独立数据中心（`#/settings`，支持存储占用分析、全量/细粒度 JSON 备份与恢复、重置安全防误触）。

**Architecture:** 前端通过 `vite-plugin-pwa` 与 Workbox 实现按需拆包资源（Monaco Editor、marked、Markdown 备忘录、各工具 chunk）全量预缓存；通过 `virtual:pwa-register/react` 驱动右下角浮动热更新 Toast；构建纯原生 `backupManager.js` 工具类管理受管命名空间数据与字节占用计量；在 `Settings.jsx` 渲染四大功能卡片并通过 `Header.jsx` 导航无缝集成。

**Tech Stack:** React 18, Vite 6, `vite-plugin-pwa` (Workbox), Node 22 built-in `node:test`, Apple HIG CSS Variables.

**Spec:** [`docs/superpowers/specs/2026-09-11-pwa-and-settings-design.md`](file:///c:/Users/if/Desktop/lyWorkSpace/personWeb/docs/superpowers/specs/2026-09-11-pwa-and-settings-design.md)

## Global Constraints

- 遵循项目现有 Apple HIG 极简设计规范与 CSS 变量系统（`--bg-primary`、`--bg-card`、`--border-subtle`、`--accent-color` 等）。
- 保持 100% 纯客户端静态架构，严禁引入第三方云存储或外部强制后端接口。
- 数据存储严格利用已有 `src/utils/storage.js` 的安全读写和环境探测机制，兼容无痕模式降级。
- 绝不出现占位符、TODO 或残缺实现；严格执行 TDD 与步骤自测。

---

### Task 1: 基础设施搭建与 PWA 插件配置

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `public/icon-192.svg`
- Create: `public/icon-512.svg`
- Modify: `index.html`

**Interfaces:**
- Produces: PWA Web App Manifest (`manifest.webmanifest`), 离线预缓存 service worker 打包配置，应用图标资源，HTML 移动端适配 meta 标签。

- [ ] **Step 1: 安装 `vite-plugin-pwa` 开发依赖**

运行命令：
```powershell
npm install -D vite-plugin-pwa
```
验证 `package.json` 中新增 `"vite-plugin-pwa"` 依赖。

- [ ] **Step 2: 创建 PWA 标准矢量图标**

创建 `public/icon-192.svg` 与 `public/icon-512.svg`：
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="appleBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0077ED" />
      <stop offset="100%" stop-color="#0051B3" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#appleBlue)" />
  <circle cx="256" cy="256" r="210" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="8" />
  <text x="256" y="340" font-size="250" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" font-weight="700" fill="#FFFFFF" text-anchor="middle">L</text>
</svg>
```
`public/icon-192.svg` 内容与 512 一致（保留相同 viewBox 与视觉质量）。

- [ ] **Step 3: 配置 `vite.config.js` 集成 VitePWA 插件**

在 `vite.config.js` 中引入并配置 `VitePWA`：
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['robots.txt', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: "Ly's Workspace - 个人工作台与开发者工具箱",
        short_name: "Ly's Workspace",
        description: "极简 Apple 风格的开发者常用网站导航、跨境电商专用工具与全套离线高频开发者小工具箱。",
        theme_color: "#0071e3",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/#/",
        icons: [
          {
            src: "icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,md}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  base: '/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
```

- [ ] **Step 4: 增强 `index.html` PWA 移动端与 Apple Web App 元标签**

在 `index.html` 的 `<head>` 中添加：
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Ly" />
<link rel="apple-touch-icon" href="/icon-192.svg" />
<meta name="theme-color" content="#0071e3" />
```

- [ ] **Step 5: 验证编译通过并提交代码**

运行：
```powershell
npm run build
```
验证 `dist/` 下生成了 `manifest.webmanifest` 和 `sw.js`。
提交：
```powershell
git add package.json vite.config.js public/icon-192.svg public/icon-512.svg index.html
git commit -m "feat(pwa): configure vite-plugin-pwa with icons and manifest"
```

---

### Task 2: 全局数据管理与备份模块实现（`backupManager.js`）

**Files:**
- Create: `tests/backupManager.test.js`
- Create: `src/utils/backupManager.js`

**Interfaces:**
- Produces:
  - `DATA_MODULES`: 模块注册表数组
  - `analyzeStorage()`: 返回各模块占用字节、条目数、总容量与百分比
  - `exportBackup(selectedModuleIds?: string[])`: 导出快照并下载 JSON
  - `validateBackup(rawJson: string)`: 校验快照格式合法性并返回摘要
  - `importBackup(snapshot: object, mode: 'overwrite'|'merge')`: 执行数据还原
  - `clearModuleData(moduleId: string)`: 清空单模块数据
  - `resetFactoryData()`: 出厂重置受管数据

- [ ] **Step 1: 编写单元测试用例 `tests/backupManager.test.js`**

使用 Node 22 内置 `node:test` 与 `node:assert`：
```javascript
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_MODULES,
  validateBackup,
  formatBytes
} from '../src/utils/backupManager.js';

describe('backupManager 核心功能测试', () => {
  test('DATA_MODULES 注册表应包含 3 大核心模块', () => {
    assert.equal(DATA_MODULES.length, 3);
    const ids = DATA_MODULES.map(m => m.id);
    assert.ok(ids.includes('scratchpad'));
    assert.ok(ids.includes('codepad'));
    assert.ok(ids.includes('preferences'));
  });

  test('formatBytes 应能准确格式化字节单位', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1024), '1.0 KB');
    assert.equal(formatBytes(1048576), '1.0 MB');
  });

  test('validateBackup 对合法快照应校验成功并提取元数据', () => {
    const validPayload = JSON.stringify({
      version: '1.0.0',
      appName: "Ly's Workspace",
      exportedAt: new Date().toISOString(),
      meta: { totalModules: 1, totalKeys: 1, totalBytes: 100 },
      data: {
        local_scratchpad_notes: [
          { id: '1', title: '测试便签', content: '内容', updatedAt: 123456 }
        ]
      }
    });

    const result = validateBackup(validPayload);
    assert.equal(result.valid, true);
    assert.equal(result.meta.totalModules, 1);
    assert.ok(result.snapshot.data.local_scratchpad_notes);
  });

  test('validateBackup 对非法 JSON 或缺失结构应安全拦截', () => {
    assert.equal(validateBackup('invalid json').valid, false);
    assert.equal(validateBackup('{}').valid, false);
    assert.equal(validateBackup(JSON.stringify({ version: '2.0.0' })).valid, false);
  });
});
```

- [ ] **Step 2: 运行测试并验证失败**

运行：
```powershell
node --test tests/backupManager.test.js
```
预期：报错找不到模块 `../src/utils/backupManager.js`。

- [ ] **Step 3: 编写 `src/utils/backupManager.js` 完整实现**

实现内容：
- `DATA_MODULES` 注册表（便签 `local_scratchpad_notes`、代码板草稿 `codepad_draft_*`、偏好 `theme_pref`）。
- `formatBytes(bytes)` 字节格式化。
- `analyzeStorage()` 遍历 `localStorage`，计算 Blob 真实尺寸。
- `validateBackup(rawJson)` 校验版本与结构。
- `exportBackup(selectedModuleIds, triggerDownload = true)` 生成标准 Snapshot v1.0。
- `importBackup(snapshot, mode = 'overwrite')` 执行导入（合并/覆盖）。
- `clearModuleData(moduleId)` 与 `resetFactoryData()`。

- [ ] **Step 4: 重新运行测试并确保全部通过**

运行：
```powershell
node --test tests/backupManager.test.js
```
预期：4 个测试全部 PASS。

- [ ] **Step 5: 提交代码**

```powershell
git add tests/backupManager.test.js src/utils/backupManager.js
git commit -m "feat(data): implement backupManager with storage analysis, snapshot validation, and tests"
```

---

### Task 3: PWA 运行时能力与组件（`usePwaInstall` & `PwaUpdateToast`）

**Files:**
- Create: `src/hooks/usePwaInstall.js`
- Create: `src/components/PwaUpdateToast.jsx`
- Create: `src/components/PwaUpdateToast.css`

**Interfaces:**
- Produces:
  - `usePwaInstall()`: 提供 `{ canInstall, isStandalone, isIos, installApp }` 状态与行为。
  - `<PwaUpdateToast />`: 挂载在 App 根部的 Apple HIG 毛玻璃浮动提示组件。

- [ ] **Step 1: 编写 `src/hooks/usePwaInstall.js`**

监听 `beforeinstallprompt` 与 `appinstalled` 事件；检测 `display-mode: standalone` 和 iOS Safari `navigator.standalone`；暴露 `installApp` 触发浏览器原生安装面板。

- [ ] **Step 2: 编写 `src/components/PwaUpdateToast.css`**

实现 Apple HIG 毛玻璃悬浮卡片样式（`backdrop-filter: blur(16px)`，圆角，阴影，平滑进出动效，双模主题适配）。

- [ ] **Step 3: 编写 `src/components/PwaUpdateToast.jsx`**

通过 `virtual:pwa-register/react` 的 `useRegisterSW` 监听 `needRefresh`：
- 当检测到新版本时展示横幅：“🎉 发现新版本工作台，[立即更新] / [稍后]”。
- 点击“立即更新”调用 `updateServiceWorker(true)` 刷新页面。
- 点击“稍后”收起横幅。

- [ ] **Step 4: 提交代码**

```powershell
git add src/hooks/usePwaInstall.js src/components/PwaUpdateToast.jsx src/components/PwaUpdateToast.css
git commit -m "feat(pwa): add usePwaInstall hook and PwaUpdateToast component"
```

---

### Task 4: 设置中心界面开发（`Settings.jsx` & `Settings.css`）

**Files:**
- Create: `src/pages/Settings.jsx`
- Create: `src/pages/Settings.css`

**Interfaces:**
- Consumes:
  - `backupManager.js`: `analyzeStorage`, `exportBackup`, `validateBackup`, `importBackup`, `clearModuleData`, `resetFactoryData`
  - `usePwaInstall.js`: `canInstall`, `isStandalone`, `isIos`, `installApp`
  - `Header.jsx`: 页面顶部导航
  - `usePageTitle.js`: 设置页面标题为“系统设置与数据中心”
- Produces:
  - `Settings`: 包含四大功能卡片（PWA 离线与应用状态、本地存储洞察、全站数据备份与迁移、危险区域）的完整视图。

- [ ] **Step 1: 编写 `src/pages/Settings.css`**

按照 Apple 系统偏好设置规范排版：
- 分块卡片容器（`settings-card`）
- 存储进度条（`storage-meter-bar`），不同模块不同颜色块，悬停提示
- 模块行（`module-row`）与操作药丸按钮（`apple-btn-pill`）
- 危险区域红框警示样式（`danger-card`）
- 模态弹窗（导入预览与二次确认 Dialog）毛玻璃样式

- [ ] **Step 2: 编写 `src/pages/Settings.jsx` 完整逻辑**

包含：
- **卡片一（PWA 离线与应用状态）**：显示离线状态徽标、触发“安装到桌面”、手动检查更新、清理离线 CacheStorage 缓存。
- **卡片二（本地存储洞察）**：实时计算存储占比、可视化条形图、各模块条目数量与大小、单独导出/清空。
- **卡片三（全站数据备份与迁移）**：一键导出 JSON、文件拖拽/点击选择上传、导入预检弹窗（选择覆盖或合并）。
- **卡片四（危险区域）**：恢复出厂设置按钮与弹窗防误触输入确认。
- Toast 状态横幅反馈（操作成功/失败提示）。

- [ ] **Step 3: 验证单组件语法与无警告**

执行本地编译检查：
```powershell
npm run build
```
确保无 JSX 语法或导入路径错误。

- [ ] **Step 4: 提交代码**

```powershell
git add src/pages/Settings.jsx src/pages/Settings.css
git commit -m "feat(settings): create macOS-style Settings and Data Center page"
```

---

### Task 5: 路由挂载与全站导航集成

**Files:**
- Modify: `src/components/Header.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes:
  - `src/pages/Settings.jsx`
  - `src/components/PwaUpdateToast.jsx`
- Produces:
  - 全站路由 `/settings` 注册与代码分割按需懒加载。
  - 顶部导航分段控制器中的“设置”Tab 导航。
  - 全局常驻 `PwaUpdateToast`。

- [ ] **Step 1: 在 `src/components/Header.jsx` 新增“设置”分段**

在 `header-nav-segmented` 中追加：
```jsx
<NavLink
  to="/settings"
  className={({ isActive }) =>
    `nav-segment-item ${isActive ? 'active' : ''}`
  }
>
  设置
</NavLink>
```

- [ ] **Step 2: 在 `src/App.jsx` 注册 `/settings` 路由并挂载 `PwaUpdateToast`**

引入：
```jsx
const Settings = lazy(() => import('./pages/Settings'));
import PwaUpdateToast from './components/PwaUpdateToast';
```
在 `<Routes>` 中追加：
```jsx
<Route path="/settings" element={<Settings />} />
```
并在 `<HashRouter>` 内挂载 `<PwaUpdateToast />`。

- [ ] **Step 3: 运行自动化测试与编译构建**

运行：
```powershell
node --test tests/backupManager.test.js
npm run build
```
验证构建顺利通过，无报错。

- [ ] **Step 4: 提交代码**

```powershell
git add src/components/Header.jsx src/App.jsx
git commit -m "feat(nav): integrate Settings page into Header and mount PwaUpdateToast globally"
```

---

### Task 6: 构建校验与离线端到端验证

**Files:**
- Verify: `dist/`
- Verify: 离线 Service Worker 缓存
- Verify: 数据导入导出全链路

- [ ] **Step 1: 运行全量构建并检查产物**

运行：
```powershell
npm run build
```
检查 `dist/` 目录下是否包含：
- `sw.js`
- `workbox-*.js`
- `manifest.webmanifest`
- `icon-192.svg`
- `icon-512.svg`

- [ ] **Step 2: 本地启动预览服务器**

运行：
```powershell
npm run preview
```
在浏览器中访问 `http://localhost:4173/`。

- [ ] **Step 3: 验证 PWA 离线工作流程**

1. 打开浏览器 DevTools -> Application -> Service Workers，验证 SW 注册激活。
2. 导航切换至 `#/settings`，查看 PWA 卡片显示“🟢 离线可用已就绪”。
3. 在 DevTools -> Network 中勾选 `Offline`。
4. 刷新网页，验证首页、各个工具（如 Diff、Cron、便签、代码练习板）以及速查 Markdown 文档能否无障碍秒开。

- [ ] **Step 4: 验证数据备份与恢复全链路**

1. 在 `#/tools/scratchpad` 新建一条测试便签：“测试数据备份”。
2. 进入 `#/settings`，观察存储分析列表中“便签备忘录”字节数与条目增加。
3. 点击“导出全站完整备份”，验证成功下载 `.json` 文件。
4. 在危险区域点击“恢复出厂设置”，确认便签被安全清空。
5. 上传刚才导出的 `.json` 文件，选择“覆盖导入”，确认便签数据完整恢复。

- [ ] **Step 5: 最终集成提交**

```powershell
git status
git commit -am "chore: complete PWA and data settings center end-to-end verification"
```
