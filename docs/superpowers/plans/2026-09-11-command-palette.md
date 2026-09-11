# 全局 Raycast 式 Command Palette 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Ly's Workspace 构建全局 Raycast 式 Command Palette（⌘K 唤起、支持全站 18 款工具、常用网站、技术速查段落与系统动作加权检索，纯键盘方向键循环流转与回车执行）。

**Architecture:** 前端纯原生轻量化设计，构建 `commandPaletteIndex.js` 统一聚合四大域数据并实现多字段加权模糊评分；构建 `CommandPalette.jsx` 与 `.css` 渲染 Apple HIG / Raycast 级 28px 超深毛玻璃浮动层与键盘状态机；解耦 `SearchBar.jsx` 为 `/` 快捷键并在 `Header.jsx` 增加触控搜索入口；在 `App.jsx` 根部全局常驻挂载。

**Tech Stack:** React 18, Vite 6, Node 22 built-in `node:test`, Apple HIG CSS Variables.

**Spec:** [`docs/superpowers/specs/2026-09-11-command-palette-design.md`](file:///c:/Users/if/Desktop/lyWorkSpace/personWeb/docs/superpowers/specs/2026-09-11-command-palette-design.md)

## Global Constraints

- 遵循 Apple HIG 极简设计规范与现有 CSS 变量体系（`--bg-primary`、`--bg-surface`、`--border-subtle`、`--accent-color` 等）。
- 保持 100% 纯客户端静态架构，零额外外部重依赖。
- `⌘K` / `Ctrl+K` 为全局命令面板唯一快捷键，解耦 `SearchBar.jsx` 现有快捷键为 `/` 键。
- 绝不出现占位符、TODO 或残缺实现；严格执行 TDD 与步骤自测。

---

### Task 1: 索引引擎与加权搜索实现（`commandPaletteIndex.js`）

**Files:**
- Create: `tests/commandPaletteIndex.test.js`
- Create: `src/utils/commandPaletteIndex.js`

**Interfaces:**
- Produces:
  - `buildAllCommands(helpers)`: 生成包含四大类（系统动作、小工具、技术速查、常用网站）的完整命令条目列表。
  - `searchCommands(query, allCommands)`: 执行多字段加权模糊匹配，返回过滤和排序后的命令数组。
  - `getDefaultCommands(allCommands)`: 获取空输入状态下的推荐命令集。

- [ ] **Step 1: 编写单元测试用例 `tests/commandPaletteIndex.test.js`**

使用 Node 22 原生 `node:test` 与 `node:assert`：
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAllCommands,
  searchCommands,
  getDefaultCommands
} from '../src/utils/commandPaletteIndex.js';

describe('commandPaletteIndex 检索与动作引擎测试', () => {
  const dummyHelpers = {
    navigate: () => {},
    toggleTheme: () => {},
    openTerminal: () => {},
    triggerMatrix: () => {},
    exportBackup: () => {},
    closePalette: () => {}
  };

  test('buildAllCommands 应正确聚合四大域数据', () => {
    const commands = buildAllCommands(dummyHelpers);
    assert.ok(commands.length > 25, '命令总数应至少包含工具、动作与速查');

    const categories = new Set(commands.map((c) => c.category));
    assert.ok(categories.has('系统动作'));
    assert.ok(categories.has('实用工具'));
    assert.ok(categories.has('技术速查'));
    assert.ok(categories.has('常用网站'));
  });

  test('getDefaultCommands 空状态应返回高频系统动作与常用工具', () => {
    const commands = buildAllCommands(dummyHelpers);
    const defaults = getDefaultCommands(commands);
    assert.ok(defaults.length >= 6);
    assert.ok(defaults.some((c) => c.id === 'act-theme'));
    assert.ok(defaults.some((c) => c.id === 'act-settings'));
  });

  test('searchCommands 应支持拼音简称与英文加权匹配', () => {
    const commands = buildAllCommands(dummyHelpers);

    // 搜索 'diff' 应该将 Diff 对比器排在首位
    const diffResults = searchCommands('diff', commands);
    assert.ok(diffResults.length > 0);
    assert.equal(diffResults[0].id, 'tool-diff');

    // 搜索 'theme' 应该命中切换深浅外观模式
    const themeResults = searchCommands('theme', commands);
    assert.ok(themeResults.length > 0);
    assert.equal(themeResults[0].id, 'act-theme');

    // 搜索 'jvm' 应该命中 JVM 调优速查
    const jvmResults = searchCommands('jvm', commands);
    assert.ok(jvmResults.length > 0);
    assert.ok(jvmResults[0].title.includes('JVM'));
  });

  test('searchCommands 搜索无匹配时应安全返回空数组', () => {
    const commands = buildAllCommands(dummyHelpers);
    const results = searchCommands('xyz_not_exist_query_12345', commands);
    assert.equal(results.length, 0);
  });
});
```

- [ ] **Step 2: 运行测试并验证失败**

运行：
```powershell
node --test tests/commandPaletteIndex.test.js
```
预期：报错找不到模块 `../src/utils/commandPaletteIndex.js`。

- [ ] **Step 3: 编写 `src/utils/commandPaletteIndex.js` 完整实现**

聚合：
- `tools.js` 中全部 18 款工具
- `sites.js` 中精选网站
- 7 篇技术速查主题与高频章节
- 6 大系统动作（切换主题、打开设置、全站备份、打开终端、代码雨、回首页）
- 加权算法与空状态推荐集生成

- [ ] **Step 4: 运行测试并确保全部通过**

运行：
```powershell
node --test tests/commandPaletteIndex.test.js
```
预期：4 个测试全部 PASS。

- [ ] **Step 5: 提交代码**

```powershell
git add tests/commandPaletteIndex.test.js src/utils/commandPaletteIndex.js
git commit -m "feat(palette): implement commandPaletteIndex search engine with tests"
```

---

### Task 2: Raycast 式命令面板组件开发（`CommandPalette.jsx` & `CommandPalette.css`）

**Files:**
- Create: `src/components/CommandPalette.css`
- Create: `src/components/CommandPalette.jsx`

**Interfaces:**
- Consumes:
  - `commandPaletteIndex.js`: `buildAllCommands`, `searchCommands`, `getDefaultCommands`
  - `backupManager.js`: `exportBackup`
- Produces:
  - `<CommandPalette />`: 全局常驻挂载组件，监听 `⌘K` / `Ctrl+K`，支持完整的键盘导航（`↑`, `↓`, `Enter`, `Esc`）与视口自动平滑对齐。

- [ ] **Step 1: 编写 `src/components/CommandPalette.css`**

实现：
- `.command-palette-backdrop` 全屏毛玻璃遮罩（`backdrop-filter: blur(12px)`）
- `.command-palette-card` 浮动面板本体（`max-width: 640px`，`backdrop-filter: blur(28px)`，阴影与 `raycastPop` 动效）
- `.command-input-wrapper` 极简无边框大字号输入框与图标
- `.command-group-title` 粘性吸顶分组小标头
- `.command-item` 行高亮激活态（`selected`）、左侧图标阴影、右侧动作徽标
- `.command-palette-footer` 底部极客键盘操作指南条

- [ ] **Step 2: 编写 `src/components/CommandPalette.jsx` 完整逻辑**

包含：
- 全局快捷键监听（`⌘K` / `Ctrl+K`）与 `window.toggleCommandPalette` 暴露
- 扁平结果映射与受控 `activeIndex`
- 键盘导航事件流（`ArrowDown`, `ArrowUp`, `Enter`, `Escape`）
- `activeItemRef` 驱动 `scrollIntoView({ block: 'nearest' })`
- 点击遮罩关闭与动作执行后收起

- [ ] **Step 3: 运行本地构建校验无 JSX/CSS 语法错误**

运行：
```powershell
npm run build
```

- [ ] **Step 4: 提交代码**

```powershell
git add src/components/CommandPalette.jsx src/components/CommandPalette.css
git commit -m "feat(palette): build Raycast-style CommandPalette component with keyboard navigation"
```

---

### Task 3: 首页与全局快捷键解耦协同

**Files:**
- Modify: `src/components/SearchBar.jsx`
- Modify: `src/components/Header.jsx`

**Interfaces:**
- Consumes:
  - `window.toggleCommandPalette`
- Produces:
  - `SearchBar.jsx` 快捷键从 `⌘K` 改为 `/` 键，避免与全局 Command Palette 产生冲突。
  - `Header.jsx` 导航右侧新增可视化“放大镜”搜索按钮，点击唤起全局 Command Palette。

- [ ] **Step 1: 改造 `src/components/SearchBar.jsx`**

- 键盘监听改为检测按键 `/`（且当前未在输入框中打字）：`e.key === '/'` 触发 `inputRef.current?.focus()`。
- 快捷键提示徽标从 `<kbd className="spotlight-shortcut">⌘K</kbd>` 改为 `<kbd className="spotlight-shortcut">/</kbd>`。

- [ ] **Step 2: 改造 `src/components/Header.jsx` 增加全局搜索图标**

在终端按钮左侧新增：
```jsx
<button
  type="button"
  className="theme-control-btn"
  onClick={() => window.toggleCommandPalette?.()}
  aria-label="全局搜索与命令 (⌘K)"
  title="全局命令面板 (快捷键 ⌘K)"
>
  <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
</button>
```

- [ ] **Step 3: 运行单测与构建检查**

运行：
```powershell
node --test tests/commandPaletteIndex.test.js
npm run build
```

- [ ] **Step 4: 提交代码**

```powershell
git add src/components/SearchBar.jsx src/components/Header.jsx
git commit -m "feat(palette): remap in-page SearchBar hotkey to / and add search trigger in Header"
```

---

### Task 4: 全局路由根部挂载与构建集成验证

**Files:**
- Modify: `src/App.jsx`
- Verify: 全量构建与端到端测试

- [ ] **Step 1: 在 `src/App.jsx` 挂载 `CommandPalette`**

在 `<HashRouter>` 根部挂载 `<CommandPalette />`：
```jsx
import CommandPalette from './components/CommandPalette';
...
<WebTerminal />
<PwaUpdateToast />
<CommandPalette />
```

- [ ] **Step 2: 运行全量自动化测试**

运行：
```powershell
node --test tests/commandPaletteIndex.test.js
node --test tests/backupManager.test.js
```
确保所有单元测试全部通过。

- [ ] **Step 3: 运行生产环境全量打包构建**

运行：
```powershell
npm run build
```
检查产物无体积超标与导入异常。

- [ ] **Step 4: 最终提交与记录**

```powershell
git add src/App.jsx
git commit -m "feat(palette): mount CommandPalette globally and complete end-to-end integration"
```
