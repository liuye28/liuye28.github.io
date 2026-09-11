# PWA 离线应用化与全局数据备份中心 设计规范

- **状态**：已批准 (Approved)
- **创建日期**：2026-09-11
- **设计分类**：Architectural（新功能子系统）
- **目标工程**：Ly's Workspace (personWeb)

---

## 1. 背景与目标

### 1.1 背景
**Ly's Workspace** 是一个追求轻量、高美感（Apple HIG 风格）与实用性的纯前端一站式工作台，内置了网站导航、18 款离线开发者小工具、技术速查备忘录与 Web 终端。目前所有工具均在浏览器端运行，数据保存在本地 `localStorage`。

### 1.2 目标
1. **PWA 离线应用化**：引入 `vite-plugin-pwa` 与 Workbox 缓存，使整站（包括按需拆包的 Monaco Editor、marked 解析器、Markdown 备忘录及各工具 chunk）具备 100% 离线脱网运行能力，并支持作为独立桌面应用（Standalone）或移动端 PWA 安装。
2. **应用热更新体验**：支持“提示更新（Prompt on Update）”机制，检测到新构建版本后，通过右下角 Apple 质感 Toast 提示用户一键热刷新，杜绝工作过程被强制中断。
3. **全局数据管理中心（`#/settings`）**：在顶部导航提供“设置”独立页面，集中提供全站数据快照备份/恢复（JSON）、模块级存储分析与单项清理、PWA 运行状态监控与出厂重置保护。

---

## 2. 总体架构与模块划分

```
┌──────────────────────────────────────────────────────────┐
│                      UI Presentation                     │
│  ┌─────────────────┐ ┌───────────────┐ ┌──────────────┐ │
│  │   Header.jsx    │ │ Settings.jsx  │ │PwaUpdateToast│ │
│  │ (导航分段+设置) │ │ (4 大配置卡片)│ │ (更新悬浮横幅)│ │
│  └────────┬────────┘ └───────┬───────┘ └──────┬───────┘ │
└───────────┼──────────────────┼────────────────┼──────────┘
            │                  │                │
┌───────────▼──────────────────▼────────────────▼──────────┐
│                      Business Logic                      │
│  ┌─────────────────────────┐  ┌───────────────────────┐  │
│  │    backupManager.js     │  │    usePwaInstall.js   │  │
│  │ (快照/导入导出/存储分析)│  │ (安装事件/独立窗口检测)│  │
│  └────────┬────────────────┘  └───────┬───────────────┘  │
└───────────┼───────────────────────────┼──────────────────┘
            │                           │
┌───────────▼───────────────────────────▼──────────────────┐
│                      Platform Layer                      │
│  ┌─────────────────────────┐  ┌───────────────────────┐  │
│  │   storage.js (原生/内存)│  │ virtual:pwa-register  │  │
│  │   localStorage API      │  │ ServiceWorker+Workbox │  │
│  └─────────────────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 3. PWA 离线架构与配置规范

### 3.1 `vite-plugin-pwa` 配置
在 `vite.config.js` 中集成插件，采用 `registerType: 'prompt'` 模式：

```javascript
VitePWA({
  registerType: 'prompt',
  includeAssets: ['robots.txt', 'favicon.ico'],
  manifest: {
    name: "Ly's Workspace - 个人常用网站与开发者工具箱",
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
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icon-512.svg",
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
```

### 3.2 更新通知组件（`src/components/PwaUpdateToast.jsx`）
* **挂载位置**：在 `src/App.jsx` 根部全局挂载。
* **交互逻辑**：
  * 通过 `useRegisterSW` 监听 `needRefresh`。
  * 当为 `true` 时，在右下角以滑动淡入动效展示 Apple 质感毛玻璃悬浮横幅。
  * 提供两个操作按钮：
    * **立即更新**：调用 `updateServiceWorker(true)` 激活等待中的 Service Worker 并自动刷新当前页面。
    * **稍后**：调用关闭方法，当前会话不再弹出打扰。

### 3.3 安装状态监听 Hook（`src/hooks/usePwaInstall.js`）
* 监听 `beforeinstallprompt` 原生事件并持久化 `deferredPrompt`。
* 检测 `window.matchMedia('(display-mode: standalone)').matches` 或 iOS `navigator.standalone`，返回：
  * `isStandalone`: boolean（是否已处于独立桌面/全屏模式）。
  * `canInstall`: boolean（是否支持一键触发安装）。
  * `installApp()`: 触发原生安装弹窗并处理用户接受/取消结果。
  * `isIos`: boolean（是否是 iOS 设备，用于展示“分享 -> 添加到主屏幕”指引）。

---

## 4. 全局数据管理核心（`src/utils/backupManager.js`）

### 4.1 命名空间与模块注册表
```javascript
export const DATA_MODULES = [
  {
    id: 'scratchpad',
    name: '便签备忘录',
    icon: '📝',
    matchKey: (key) => key === 'local_scratchpad_notes',
    description: '随手记便签卡片与排版内容'
  },
  {
    id: 'codepad',
    name: '代码板草稿',
    icon: '💻',
    matchKey: (key) => key.startsWith('codepad_draft_'),
    description: 'Monaco 代码练习板多语言暂存草稿'
  },
  {
    id: 'preferences',
    name: '界面与主题偏好',
    icon: '🎨',
    matchKey: (key) => key === 'theme_pref' || key === 'theme_preference',
    description: '深浅外观模式及分类筛选配置'
  }
];
```

### 4.2 快照协议（Snapshot Schema v1.0）
```typescript
interface BackupSnapshot {
  version: "1.0.0";
  appName: "Ly's Workspace";
  exportedAt: string; // ISO 8601
  meta: {
    totalModules: number;
    totalKeys: number;
    totalBytes: number;
  };
  data: Record<string, any>;
}
```

### 4.3 核心功能 API
1. **`analyzeStorage(): StorageAnalysis`**
   * 遍历 `localStorage` 所有键值，按模块分类。
   * 使用 `new Blob([value]).size` 计量字节，返回各模块的 `sizeBytes`, `formattedSize`, `itemCount` 及全站用量和百分比。
2. **`exportBackup(selectedModuleIds?: string[]): void`**
   * 提取选中模块（默认全部），构建 `BackupSnapshot` 对象。
   * 触发浏览器原生下载 `ly-workspace-backup-YYYYMMDD-HHmmss.json`。
3. **`validateBackup(rawJson: string): ValidationResult`**
   * 校验 JSON 合法性、`version` 兼容性、`data` 对象存在性。
   * 返回解析出的元数据及各模块项数量，供 UI 预览弹窗展示。
4. **`importBackup(snapshot: BackupSnapshot, mode: 'overwrite' | 'merge'): ImportResult`**
   * **`overwrite` 模式**：直接写入目标键值到 `safeSetItem`。
   * **`merge` 模式**：
     * 便签数组：通过 `id` 对比，保留修改时间更新的项。
     * 代码板与单项配置：若目标已有且内容不同，可提示或优先保留最新。
5. **`clearModuleData(moduleId: string): boolean`**
   * 清除指定模块下的所有 `localStorage` 键。
6. **`resetFactoryData(): boolean`**
   * 清空全站受管命名空间下的所有数据。

---

## 5. 设置页面 UI 设计规范（`src/pages/Settings.jsx`）

### 5.1 页面布局与导航整合
* **路由注册**：在 `src/App.jsx` 注册路由 `/settings`，使用 `React.lazy` 按需加载。
* **导航栏分段控制（`src/components/Header.jsx`）**：
  在原有的导航项后追加 `设置`（NavLink 路径指向 `/settings`），保持 Apple HIG 的平滑高亮反馈。

### 5.2 四大卡片模块构成
1. **卡片一：PWA 应用状态与离线缓存（Apple 系统服务样式）**
   * 状态栏：展示“🟢 离线可用已就绪”、“📱 独立应用模式运行中”或“🌐 浏览器标签页运行中”。
   * 操作区：
     * **安装到桌面**（在支持环境下一键触发，已安装时显示“已在桌面安装”）。
     * **检查更新**（手动调用 SW `registration.update()`，若有新版触发 Toast）。
     * **清空离线缓存**（清理 CacheStorage，重新从网络拉取）。
2. **卡片二：本地存储洞察（Storage Inspector）**
   * 顶部多色彩条形图（Segmented Progress Bar）：各模块色块占比。
   * 模块明细列表：图标、名称、条数、字节占用。
   * 模块快捷操作：[单独导出 JSON] 与 [单独清空]。
3. **卡片三：全站数据备份与迁移（Backup & Restore）**
   * [ 💾 导出完整备份快照 ] 大按钮。
   * [ 📂 从文件导入备份 ] 区域（支持拖拽与点击选取 `.json` 文件）。
   * 导入预览 Modal：展示解析摘要，允许选择“智能合并”或“完全覆盖”。
4. **卡片四：危险区域（Danger Zone）**
   * 红色边框警示卡片。
   * [ ⚠️ 恢复出厂设置（清空所有本地数据） ]。
   * 需在弹窗中进行二次防误触确认。

---

## 6. 异常与降级处理规范

1. **隐私模式 / 限制沙盒环境**：
   * `storageAvailable === false` 时，`backupManager` 自动降级为展示“受限隐私模式”，提示用户数据仅在当前会话有效，避免抛出 `SecurityError` 导致白屏。
2. **Service Worker 不支持环境**：
   * 针对不支持 SW 的古老浏览器或特定内嵌 WebView，PWA 卡片优雅显示为“当前环境不支持离线缓存，工作台将以在线轻量模式运行”。
3. **JSON 导入防御**：
   * 任何语法错误、超大畸形文件、缺少必要节点的 JSON 均通过 try-catch 安全拦截并给出友好错误横幅，绝不污染现有存储。

---

## 7. 验证与测试计划

1. **构建与离线测试**：
   * 执行 `npm run build`，检查 `dist/` 目录下是否正确生成 `sw.js`、`workbox-*.js`、`manifest.webmanifest`。
   * 启动 `npm run preview`，在 Chrome DevTools Network 中切换为 `Offline`，验证全站页面、18 款工具及 Monaco Editor 是否能在完全离线状态下刷新打开。
2. **PWA 安装测试**：
   * 在 Chrome/Edge 打开，验证安装图标能否正常弹出并成功安装为桌面应用。
3. **数据导入导出测试**：
   * 在便签中录入 2 条笔记，在代码板中保存一段 Java 代码。
   * 进入设置页，验证存储分析是否正确统计各模块占用大小。
   * 执行全量导出，获得 `.json` 文件并核对内容。
   * 修改本地内容后，执行导入恢复，验证覆盖与合并逻辑准确无误。
   * 执行“恢复出厂设置”，验证数据清空与二次确认拦截。
