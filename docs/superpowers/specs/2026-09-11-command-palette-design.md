# 全局 Raycast 式 Command Palette 设计规范

- **状态**：已批准 (Approved)
- **创建日期**：2026-09-11
- **设计分类**：Architectural（全局调度与交互子系统）
- **目标工程**：Ly's Workspace (personWeb)

---

## 1. 背景与目标

### 1.1 背景
**Ly's Workspace** 已拥有 18 款开发者与跨境电商小工具、精选网站导航库、7 篇技术速查备忘录与全套设置中心。此前，站内搜索分散在首页和小工具首页的 `SearchBar`，且缺乏跨页面即时唤起、执行系统命令（如切换外观、导出备份、触发彩蛋）和直达深层文档章节的全局能力。

### 1.2 目标
1. **统一全局检索与动作中心**：打造一个融合 Apple Spotlight 与 Raycast 极客风格的全局浮动命令面板（Command Palette）。
2. **全站随处即用**：支持 `⌘K` / `Ctrl+K` 在任意路由与小工具中秒级唤起/关闭，同时在 Header 提供可视化按钮供触控和鼠标操作。
3. **四域全量融合检索**：
   - ⚡ **系统动作**：切换深/浅色模式、打开设置页、导出备份快照、唤起 Web 终端、运行 Matrix 代码雨、回首页等；
   - 🛠️ **实用工具**：全量 18 款小工具（名称、英文/拼音缩写如 `diff`, `cron`, `json`, `jwt`, `ozon` 等）；
   - 📚 **技术速查**：7 篇技术备忘录及其高频章节段落（Java Stream、JVM 调优、Spring 事务陷阱、Redis 缓存穿透等）；
   - 🌐 **常用网站**：`sites.js` 精选站点直达。
4. **极致键盘体验**：方向键 `↑` / `↓` 循环切换、`Enter` 执行动作、`Esc` 退出，视口自动平滑滚动对齐，空状态提供 Raycast 式高频推荐。

---

## 2. 总体架构与数据流

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Presentation                        │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │      Header.jsx       │       │  CommandPalette.jsx   │  │
│  │ (搜索按钮 / ⌘K 标识)  │──────▶│ (毛玻璃浮层 / 键盘驱动)│  │
│  └───────────────────────┘       └───────────┬───────────┘  │
└──────────────────────────────────────────────┼──────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────┐
│                    Search & Index Engine                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               commandPaletteIndex.js                  │  │
│  │  - 聚合 Tools / Sites / Cheatsheets / System Actions  │  │
│  │  - 加权多字段模糊匹配引擎                             │  │
│  │  - 初始空状态智能推荐集生成                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 索引数据模型与匹配算法

### 3.1 命令条目数据契约（CommandItem）
```typescript
export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: '系统动作' | '实用工具' | '技术速查' | '常用网站';
  icon: string; // Emoji 或 SVG 图标标识
  keywords: string[]; // 英文简称、拼音与关键词
  action: (helpers: ActionHelpers) => void;
  shortcutHint?: string; // 动作徽章文案，如 '回车直达'、'系统动作'、'外链 ↗'
}

export interface ActionHelpers {
  navigate: (path: string) => void;
  toggleTheme: () => void;
  openTerminal: () => void;
  triggerMatrix: () => void;
  exportBackup: () => void;
  closePalette: () => void;
}
```

### 3.2 模糊匹配权重算法
搜索算法对输入词 `query`（去空格、转小写）执行加权评分：
1. **主标题匹配（Title Match）**：
   - 标题全等：权重 100
   - 标题以 query 开头：权重 80
   - 标题包含 query：权重 50
2. **关键词与简称匹配（Keywords Match）**：
   - 精确命中关键字（如输入 `diff` 匹配 `Monaco Diff`）：权重 70
   - 包含关键字：权重 40
3. **副标题与描述匹配（Subtitle Match）**：
   - 描述包含 query：权重 20

按权重得分降序排列；若输入为空，返回**默认智能推荐集**（3 项高频系统动作 + 5 款最常用小工具）。

---

## 4. 键盘导航状态机与交互行为

### 4.1 全局快捷键与事件监听
- **全局拦截**：在 `window` 监听 `keydown` 事件：
  - 当 `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'` 时，调用 `e.preventDefault()` 切换面板开启/关闭状态。
  - 挂载全局方法 `window.toggleCommandPalette = () => ...`，供各组件编程式调用。
- **解耦现有搜索框**：
  - 修改 `src/components/SearchBar.jsx`，将输入框的快捷键徽标由 `⌘K` 改为 `/`，按 `/` 键时若当前焦点不在输入控件中，则聚焦就地搜索框。

### 4.2 键盘状态流转
- 维护 `searchQuery` 与 `activeIndex`。
- `searchQuery` 变化时，重置 `activeIndex = 0`。
- `ArrowDown`：`activeIndex = (activeIndex + 1) % totalItems`。
- `ArrowUp`：`activeIndex = (activeIndex - 1 + totalItems) % totalItems`。
- `Enter`：执行 `flattenedItems[activeIndex].action(helpers)`，并在执行后立即关闭面板。
- `Escape`：关闭面板并清空查询词。
- 鼠标 `onMouseEnter` 动态同步 `activeIndex`，实现键盘与鼠标操作的无缝衔接。
- 自动视口跟随：监听 `activeIndex` 变化，针对激活元素调用 `scrollIntoView({ block: 'nearest', behavior: 'smooth' })`。

---

## 5. UI 布局与视觉规范（Raycast / Apple HIG）

### 5.1 组件结构
1. **Backdrop（全屏半透明遮罩）**：
   - `background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(12px);`
   - 点击遮罩空白区域自动收起面板。
2. **Modal Card（浮动面板本体）**：
   - 宽度 `max-width: 640px`，距离顶部 `12vh`，圆角 `18px`，阴影 `0 32px 72px rgba(0, 0, 0, 0.36)`。
   - 背景色 `var(--bg-surface)` 配合 `backdrop-filter: blur(28px)`。
3. **顶部输入栏**：
   - Apple 质感搜索图标，无边框高辨识度输入框（`1.15rem`），右侧提供 `ESC` 快捷键微徽标。
4. **中部结果列表（分组渲染）**：
   - 最大高度 `420px`，分类粘性吸顶标头（Sticky Category Header）。
   - 条目行：左侧图标、中间标题+副标题、右侧动作徽标（`回车直达` / `系统动作` / `外链 ↗`）。
   - 激活行：采用品牌强调色微底色（`rgba(0, 113, 227, 0.08)`）及高亮指示。
5. **底部快捷键提示条（Footer Legend）**：
   - 提示：`[ ↑ ↓ ] 选择` · `[ ↵ ] 执行` · `[ ESC ] 关闭`。

---

## 6. 验证与测试计划

1. **单元测试（`tests/commandPaletteIndex.test.js`）**：
   - 验证四大域基础数据是否正确加载并转换；
   - 验证空状态推荐集包含系统动作与常用工具；
   - 验证加权模糊搜索能够正确根据拼音/简称（如 `diff`, `cron`, `theme`）排在首位；
   - 验证非法或无匹配输入时安全返回空数组。
2. **端到端交互测试**：
   - 编译构建测试：`npm run build` 确保无 JSX、CSS 或导入语法错误；
   - 快捷键唤起测试：按下 `⌘K` / `Ctrl+K` 验证浮层秒级展开并自动聚焦输入框；
   - 键盘上下键与回车测试：方向键选中“切换深色模式”，回车验证全站外观即时变化；方向键选中“Monaco Diff 对比器”，回车验证平滑路由跳转至 `#/tools/diff` 并关闭浮层；
   - 顶部 Header 搜索按钮测试：鼠标点击放大镜图标，验证浮层正常唤起。
