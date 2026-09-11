# 个人数字空间与极客实验室实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/about`（关于我）页面重塑升级为全能极客空间：融合个人 Profile、极客装备库（Uses 硬件与软件流）、在读书单与灵感随笔（Reading & Notes）、以及纯前端驱动的 3 款创意实验室（Playground）微交互。

**Architecture:** 纯前端静态解耦架构。新建 `src/data/profileData.js` 集中管理装备、书单、笔记和名言数据；将页面拆解为 `AboutHero`、`UsesSection`、`ReadingSection`、`LabSection` 以及 3 款独立的实验室组件（`HologramCard`、`ParticleCanvas`、`QuoteTyper`）；在 `AboutMe.jsx` 中通过 iOS 胶囊分段控制器无缝驱动视图平滑过渡，并在 `AboutMe.css` 中以 Apple HIG 规范实现深浅外观与毛玻璃高光微动效。

**Tech Stack:** React 18, Vite 6, HTML5 Canvas API, Web Audio API, CSS 3D Transforms, Node 22 built-in `node:test`.

**Spec:** [`docs/superpowers/specs/2026-09-11-about-me-uses-lab-design.md`](file:///c:/Users/if/Desktop/lyWorkSpace/personWeb/docs/superpowers/specs/2026-09-11-about-me-uses-lab-design.md)

## Global Constraints

- 100% 纯客户端静态架构，零额外外部重依赖，整站打包体积零膨胀。
- 全面继承 Apple HIG 视觉规范，所有颜色使用 CSS 变量（`--bg-primary`、`--bg-card`、`--border-subtle`、`--accent-color` 等），严禁硬编码单色。
- Canvas 动画与音频在组件卸载或页面处于后台时必须及时清理释放（`cancelAnimationFrame` 与音频上下文），严禁内存泄漏与无效能耗。
- 绝不出现占位符、TODO 或残缺实现；严格执行 TDD 与步骤自测，保持既有 33 个单元测试全部绿灯。

---

### Task 1: 个人数据模型与单元测试（`profileData.js`）

**Files:**
- Create: `tests/profileData.test.js`
- Create: `src/data/profileData.js`

**Interfaces:**
- Produces:
  - `profileHero`: `{ name, handle, tagline, bio, location, links }`
  - `hardwareDesk`: `Array<{ name, spec, category, tag, desc }>`
  - `softwareStack`: `Array<{ name, category, tag, desc, url }>`
  - `readingList`: `Array<{ title, author, category, status, rating, quote }>`
  - `inspirationNotes`: `Array<{ id, date, tag, content }>`
  - `labQuotes`: `Array<{ author, quote, field }>`

- [ ] **Step 1: 编写数据完整性单元测试 `tests/profileData.test.js`**

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  profileHero,
  hardwareDesk,
  softwareStack,
  readingList,
  inspirationNotes,
  labQuotes
} from '../src/data/profileData.js';

describe('profileData 个人与极客空间数据完整性测试', () => {
  test('profileHero 基础元数据必须完整且合规', () => {
    assert.ok(profileHero.name, '必须包含姓名');
    assert.ok(profileHero.handle, '必须包含 handle');
    assert.ok(profileHero.tagline, '必须包含一句话介绍');
    assert.ok(Array.isArray(profileHero.links) && profileHero.links.length >= 2, '至少包含 2 个社交外链');
    profileHero.links.forEach((link) => {
      assert.ok(link.label && link.url.startsWith('http'), '链接必须包含 label 和合法 url');
    });
  });

  test('hardwareDesk 硬件装备必须包含分类与规格描述', () => {
    assert.ok(Array.isArray(hardwareDesk) && hardwareDesk.length >= 4, '硬件列表至少 4 项');
    hardwareDesk.forEach((item) => {
      assert.ok(item.name && item.spec && item.category && item.desc);
    });
  });

  test('softwareStack 软件栈必须包含分类与有效链接', () => {
    assert.ok(Array.isArray(softwareStack) && softwareStack.length >= 4, '软件列表至少 4 项');
    softwareStack.forEach((item) => {
      assert.ok(item.name && item.category && item.url.startsWith('http'));
    });
  });

  test('readingList 书单必须包含阅读状态与 1-5 星评分', () => {
    assert.ok(Array.isArray(readingList) && readingList.length >= 4, '书单至少 4 本');
    const validStatuses = new Set(['在读中', '已读完', '常读常新']);
    readingList.forEach((book) => {
      assert.ok(book.title && book.author);
      assert.ok(validStatuses.has(book.status), `书本状态必须为合法枚举值，当前: ${book.status}`);
      assert.ok(typeof book.rating === 'number' && book.rating >= 1 && book.rating <= 5, '评分必须在 1-5 星');
    });
  });

  test('inspirationNotes 灵感便签必须包含日期、标签与内容', () => {
    assert.ok(Array.isArray(inspirationNotes) && inspirationNotes.length >= 2);
    inspirationNotes.forEach((note) => {
      assert.ok(note.id && note.tag && note.content);
    });
  });

  test('labQuotes 实验室名言必须包含作者与引言', () => {
    assert.ok(Array.isArray(labQuotes) && labQuotes.length >= 5);
    labQuotes.forEach((q) => {
      assert.ok(q.author && q.quote);
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`node --test tests/profileData.test.js`
预期：FAIL（模块尚未创建）

- [ ] **Step 3: 创建并实现 `src/data/profileData.js`**

编写包含真实、高质感个人 Profile、硬件外设（MacBook、4K 显示器、客制化机械键盘、降噪耳机等）、软件栈（VS Code、IDEA、Raycast、Warp、Obsidian）、在读书单（凤凰架构、深入理解 Java 虚拟机、Redis 设计与实现等）、灵感随笔与极客名言。

- [ ] **Step 4: 运行测试验证通过**

运行：`node --test tests/profileData.test.js`
预期：PASS（6 个测试全部通过）

- [ ] **Step 5: 提交代码**

```bash
git add tests/profileData.test.js src/data/profileData.js
git commit -m "feat(profile): add profileData and unit tests"
```

---

### Task 2: 个人名片与社交连接组件（`AboutHero.jsx`）

**Files:**
- Create: `src/components/about/AboutHero.jsx`

**Interfaces:**
- Consumes: `profileHero` from `src/data/profileData.js`
- Produces: `AboutHero` component
  - 渲染 Avatar 居中 Apple 拟物动态光晕头像
  - 渲染姓名 `Ly (liuye28)`、标语与个人简介
  - 渲染药丸按钮：GitHub 个人主页、开源仓库、以及“复制链接”轻反馈按钮（自带 2 秒“已复制”恢复动效）

- [ ] **Step 1: 创建 `src/components/about/AboutHero.jsx`**

实现完整交互：支持点击头像晃动呼吸、支持一键将当前主页链接写入剪贴板并浮现反馈文字。

- [ ] **Step 2: 验证组件无语法错误**

运行：`node -c src/components/about/AboutHero.jsx` 或直接由 Vite 编译验证。

- [ ] **Step 3: 提交代码**

```bash
git add src/components/about/AboutHero.jsx
git commit -m "feat(about): create AboutHero component"
```

---

### Task 3: 极客装备库（`UsesSection.jsx`）与在读书单（`ReadingSection.jsx`）

**Files:**
- Create: `src/components/about/UsesSection.jsx`
- Create: `src/components/about/ReadingSection.jsx`

**Interfaces:**
- Consumes:
  - `hardwareDesk`, `softwareStack`, `readingList`, `inspirationNotes` from `src/data/profileData.js`
- Produces:
  - `UsesSection`: 渲染硬件工作台与软件栈卡片网格，带类别胶囊、参数描述与跳转图标。
  - `ReadingSection`: 渲染在读书单卡片（书籍封面占位、状态徽标、5 星打分、心得短评）与灵感便签流（带一键复制）。

- [ ] **Step 1: 创建 `src/components/about/UsesSection.jsx`**
- [ ] **Step 2: 创建 `src/components/about/ReadingSection.jsx`**
- [ ] **Step 3: 语法与构建初步检查**
- [ ] **Step 4: 提交代码**

```bash
git add src/components/about/UsesSection.jsx src/components/about/ReadingSection.jsx
git commit -m "feat(about): create UsesSection and ReadingSection components"
```

---

### Task 4: 创意实验室 3 款微交互组件与容器（`LabSection.jsx`）

**Files:**
- Create: `src/components/about/lab/HologramCard.jsx`
- Create: `src/components/about/lab/ParticleCanvas.jsx`
- Create: `src/components/about/lab/QuoteTyper.jsx`
- Create: `src/components/about/LabSection.jsx`

**Interfaces:**
- Consumes:
  - `labQuotes` from `src/data/profileData.js`
- Produces:
  - `HologramCard`: 鼠标移动 3D 透视倾斜（perspective & rotate3D）与彩虹菲涅尔高光，支持 3 款皮肤切换。
  - `ParticleCanvas`: 原生 Canvas 极光微光粒子与代码雨 Matrix 模式，支持鼠标扰动与点击炸裂，标签页不可见时自动休眠。
  - `QuoteTyper`: 打字机逐字输出、Web Audio API 合成敲击声与舒缓和弦音、名言一键复制。
  - `LabSection`: 聚合 3 款实验的极客展厅容器。

- [ ] **Step 1: 实现 `HologramCard.jsx`**
- [ ] **Step 2: 实现 `ParticleCanvas.jsx`（含 RAF 自动暂停与窗口自适应）**
- [ ] **Step 3: 实现 `QuoteTyper.jsx`（含 Web Audio 原生合成与静音切换）**
- [ ] **Step 4: 实现 `LabSection.jsx` 容器**
- [ ] **Step 5: 提交代码**

```bash
git add src/components/about/lab/ src/components/about/LabSection.jsx
git commit -m "feat(about): create interactive LabSection with 3 micro experiments"
```

---

### Task 5: 主页面集成、分段控制器与 Apple HIG 样式（`AboutMe.jsx` & `AboutMe.css`）

**Files:**
- Modify: `src/pages/AboutMe.jsx`
- Modify: `src/pages/AboutMe.css`

**Interfaces:**
- Integrates:
  - `AboutHero`
  - `UsesSection`
  - `ReadingSection`
  - `LabSection`
- Controls:
  - Segment state: `'uses' | 'reading' | 'lab'`，带 iOS 药丸背景滑动过渡与键盘可访问性。

- [ ] **Step 1: 升级 `src/pages/AboutMe.jsx`**
- [ ] **Step 2: 重构并丰富 `src/pages/AboutMe.css`**
  - 适配深浅色模式 CSS 变量
  - 拟物毛玻璃投影、渐变边框、菲涅尔高光层
  - 响应式单双列自适应布局
- [ ] **Step 3: 运行开发构建验证打包**

运行：`npm run build`
预期：无打包错误，生成产物正常。

- [ ] **Step 4: 提交代码**

```bash
git add src/pages/AboutMe.jsx src/pages/AboutMe.css
git commit -m "feat(about): integrate full geek profile page with segmented control and Apple HIG styles"
```

---

### Task 6: 全站回归测试与验证

**Files:**
- None (Verification)

- [ ] **Step 1: 运行全量单元测试套件**

运行：`npm test`
预期：全部 39+ 个单元测试通过（原有 33 个 + 新增 6 个）。

- [ ] **Step 2: 运行 Vite 生产打包**

运行：`npm run build`
预期：打包成功，`dist/` 目录正常生成。

- [ ] **Step 3: 提交并推送工作区**

```bash
git commit --allow-empty -m "chore: verify tests and build for about-me uses and lab"
```
