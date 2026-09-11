# 个人数字空间与极客实验室 (About Me & Lab) 设计规范

- **状态**：已批准 (Approved)
- **创建日期**：2026-09-11
- **设计分类**：Architectural（内容扩展与交互子系统）
- **目标工程**：Ly's Workspace (personWeb)

---

## 1. 背景与目标

### 1.1 背景
**Ly's Workspace** 目前具备完整的网站导航（Home）、18 款开发者与跨境电商小工具（Tools）、技术速查备忘录（Cheatsheet）和全套设置中心。但此前 `/about`（关于我）页面仅包含简单的头像、名字与两个 GitHub 链接，内容较为单薄，缺乏人格化深度、生活气息与极客技术趣味。

### 1.2 目标
1. **重塑「关于我」为全能极客空间**：将原本单薄的名片页升级为兼具生活工作流与技术创造力的**个人数字杂志**。
2. **三维一体内容架构**：
   - 🖥️ **极客装备库 (Uses)**：公开分享真实的工作台硬件与生产力软件流，建立极客共鸣；
   - 📚 **在读书单与灵感 (Reading & Notes)**：收录常读常新的好书、个人短评与技术灵感便签；
   - 🧪 **创意实验室 (Playground)**：提供 3 款纯前端驱动、即开即玩的交互式微实验。
3. **Apple HIG 极简美学与零新增依赖**：
   - 沿用整站的毛玻璃（Glassmorphism）、深浅主题自适应与柔和微动效；
   - 100% 原生技术实现（React 18 + Canvas API + Web Audio API + CSS 3D），**零新增 npm 依赖**，整站体积零膨胀；
   - 离开视口或切出页面时自动冻结 Canvas 与定时器，实现极致功耗控制。

---

## 2. 总体架构与组件解耦

```
src/pages/AboutMe.jsx (主页面容器，管理 Segmented Control 状态)
  │
  ├── src/components/about/AboutHero.jsx (个人身份头像、极客格言、社交/联系快捷按钮)
  │
  ├── [Segment: uses]     ──▶ src/components/about/UsesSection.jsx
  │                             ├── 硬件工作台网格 (Hardware Desk Grid)
  │                             └── 生产力软件流网格 (Software Stack Grid)
  │
  ├── [Segment: reading]  ──▶ src/components/about/ReadingSection.jsx
  │                             ├── 精选在读书单 (Bookshelf Cards)
  │                             └── 灵感便签卡片盒 (Inspiration Note Cards)
  │
  └── [Segment: lab]      ──▶ src/components/about/LabSection.jsx
                                ├── HologramCard.jsx (3D 悬浮与菲涅尔流光卡片)
                                ├── ParticleCanvas.jsx (原生 Canvas 极光粒子与代码雨)
                                └── QuoteTyper.jsx (极客灵感打字机 & 原生和弦按键音)
```

数据层解耦：
- `src/data/profileData.js`：统一定义并导出 `profileHero`, `hardwareDesk`, `softwareStack`, `readingList`, `inspirationNotes`, `labQuotes`。

---

## 3. 数据模型规范 (Data Models)

### 3.1 个人资料与社交链接 (`profileHero`)
```javascript
export const profileHero = {
  name: "Ly",
  handle: "liuye28",
  tagline: "聚焦 Java 后端架构、全栈探索与数字效率工具",
  bio: "热爱优雅的工程设计、纯静态极速响应与 Apple HIG 极简美学。在代码世界构建确定性，在数字生活寻找创造力。",
  location: "China",
  links: [
    { label: "GitHub 个人主页", url: "https://github.com/liuye28", primary: true },
    { label: "本站开源仓库", url: "https://github.com/liuye28/ly.github.io", primary: false }
  ]
};
```

### 3.2 极客装备库 (`hardwareDesk` & `softwareStack`)
```javascript
export const hardwareDesk = [
  {
    name: "MacBook Pro 14 / 桌面主力机",
    spec: "Apple Silicon / 32GB 统一内存",
    category: "主机",
    tag: "主力生产力",
    desc: "全天候开发与构建中枢，兼顾静音、极致续航与高负荷编译性能。"
  },
  {
    name: "4K 超清 IPS 极简显示器",
    spec: "27 英寸 / 4K UHD / Type-C 90W 反向供电",
    category: "显示",
    tag: "双屏扩展",
    desc: "单线直连 MacBook，细腻视网膜级代码排版与分屏调试体验。"
  }
];

export const softwareStack = [
  {
    name: "VS Code / Cursor",
    category: "代码编辑",
    tag: "日常主力",
    desc: "配合 GitHub Copilot、Vim 模式与精选 Tokyo Night 主题，轻盈极速。",
    url: "https://code.visualstudio.com/"
  },
  {
    name: "IntelliJ IDEA Ultimate",
    category: "Java 重器",
    tag: "后端利器",
    desc: "大型 Spring Cloud 与 JVM 级重构排障的不可替代利器。",
    url: "https://www.jetbrains.com/idea/"
  }
];
```

### 3.3 在读书单与灵感随笔 (`readingList` & `inspirationNotes`)
```javascript
export const readingList = [
  {
    title: "凤凰架构：构建可靠的大型分布式系统",
    author: "周志明",
    category: "架构工程",
    status: "常读常新", // '在读中' | '已读完' | '常读常新'
    rating: 5,
    quote: "不仅是一本架构书，更是一部微服务与云原生演进的技术史诗。"
  },
  {
    title: "深入理解 Java 虚拟机（第 3 版）",
    author: "周志明",
    category: "底层原理",
    status: "已读完",
    rating: 5,
    quote: "Java 后端工程师从初级迈向高阶的必读圣经，内存模型与垃圾回收透彻明了。"
  }
];

export const inspirationNotes = [
  {
    id: "note-1",
    date: "2026",
    tag: "工程哲学",
    content: "简单并不意味着简陋，真正的极简是剔除一切不必要的杂质后，依然能优雅地运转。"
  },
  {
    id: "note-2",
    date: "2026",
    tag: "系统设计",
    content: "过早的优化是万恶之源；但缺乏容量规划与防御性设计的系统，则是迟早要爆炸的定时炸弹。"
  }
];
```

---

## 4. 组件交互与核心技术实现

### 4.1 AboutHero
- **个人身份展示**：居中大圆形 Apple 拟物光晕头像，支持点击触发趣味呼吸晃动。
- **联系与社交**：GitHub 按钮保持直达，新增“复制主页链接”带 Toast 悬浮反馈。

### 4.2 UsesSection 与 ReadingSection
- **分段控制器 (Segmented Control)**：
  - 支持 `Uses 装备`、`Reading 书单`、`Lab 实验室` 3 项无缝切换；
  - 采用滑动胶囊背景与柔和弹性过渡。
- **卡片渲染**：
  - Apple 卡片圆角（16px）、1px 细微半透明边框（`var(--border-subtle)`）、悬停轻微上浮（`translateY(-2px)`）与发光投影。

### 4.3 创意实验室 (LabSection) 3 款微实验

#### 实验 1：HologramCard (3D 悬浮流光卡片)
- **技术实现**：
  - 监听容器 `onMouseMove` 与 `onMouseLeave` 事件；
  - 计算光标相对于卡片中心的偏移百分比 `(x, y)`；
  - 动态应用 `transform: perspective(1000px) rotateX(...) rotateY(...)`，配合 `requestAnimationFrame` 保证平滑；
  - 在卡片上层叠加动态 `radial-gradient` 菲涅尔彩虹反光高光层；
  - 提供皮肤切换（黑晶幽浮 / 赛博霓虹 / 磨砂纯银）。

#### 实验 2：ParticleCanvas (原生 Canvas 极光粒子与代码雨)
- **技术实现**：
  - 原生 HTML5 Canvas，自适应父容器分辨率（处理 `window.devicePixelRatio` 防模糊）；
  - **模式 A（流体极光）**：数百颗带拖尾光晕的微小光子，受正弦波与微重力驱动流动；鼠标悬停时光子产生排斥波纹，点击发生小粒子迸发爆炸；
  - **模式 B（黑客代码雨 Matrix）**：绿色半透明日文/英文字符下落矩阵；
  - **生命周期保护**：当组件卸载、切出 Tab 或当前标签页不可见时（`document.visibilityState === 'hidden'`），自动调用 `cancelAnimationFrame` 暂停渲染，彻底消除能耗浪费。

#### 实验 3：QuoteTyper (极客灵感打字机 & 原生和弦音)
- **技术实现**：
  - 内置精选计算机科学与架构名言；
  - 点击“抽取灵感 / Next”，以打字机速度逐字键入；
  - 基于原生 `AudioContext` 合成细微、悦耳的机械键盘击键滴答声与落定舒缓和弦（仿颂钵和弦），支持一键静音切换与一键复制名言。

---

## 5. 样式与主题无缝适配

- 完全兼容整站的深色（Dark）与浅色（Light）模式，无硬编码黑白颜色，所有色值全部使用全局 CSS 变量：
  - `var(--bg-primary)`、`var(--bg-card)`、`var(--border-subtle)`、`var(--text-primary)`、`var(--accent-color)`；
- 适配移动端窄屏：分段控制器在屏幕宽度 `< 640px` 时自动自适应折行或横向平滑滚动，卡片网格自适应单列排版。

---

## 6. 测试与验证计划

1. **静态语法与构建验证**：
   - 运行 `npm run build` 验证所有新 JSX、CSS 与数据导入完全符合 Vite 打包标准，无未解析依赖。
2. **自动化测试套件回归**：
   - 运行 `npm test`（`node --test tests/*.test.js`）确保所有既有回归测试用例全部 100% 通过。
3. **交互与生命周期手工验证**：
   - 验证深浅色主题无缝切换下各卡片高光与对比度表现；
   - 验证 3D 卡片鼠标悬停与平滑复位；
   - 验证 Canvas 动画在切 Tab 时的帧率与暂停释放机制；
   - 验证打字机音效与静音开关。
