# 个人导航与开发者/跨境工具箱 (Ly's Workspace)

<p align="center">
  <strong>基于 Vite + React 构建的高性能、极简纯静态个人常用网站导航、开发者 / 跨境电商工具箱与休闲小游戏中心</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/React_Router-7.1-CA4245?logo=reactrouter&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/PWA-Ready-orange?logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/Monaco_Editor-0.52-007ACC?logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/Tests-142%20passed-brightgreen" alt="Tests" />
  <img src="https://img.shields.io/badge/Design-Apple_HIG-000000?logo=apple&logoColor=white" alt="Apple Design" />
  <img src="https://img.shields.io/badge/Deploy-GitHub_Pages-222222?logo=github&logoColor=white" alt="GitHub Pages" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

---

## 📖 项目简介

**Ly's Workspace** 是一个追求极致轻量、美观与实用性的纯前端一站式工作台。全面对齐 **Apple (macOS / iOS / HIG)** 极简人机界面规范，整合了**常用网站导航**、**19 款开箱即用的开发与跨境电商小工具**、**7 款经典益智小游戏中心**、**高频技术速查备忘录**、**极客个人名片与创意实验室**、**全局快捷命令面板**以及**极客 Web 终端**。

项目基于纯静态客户端架构设计，**零后端依赖、数据绝不上报云端**，兼具毫秒级加载响应与极致的私密安全性；通过 GitHub Actions 实现代码推送到 `main` 分支全自动构建部署至 GitHub Pages。

---

## 🌟 核心特性

### 🧭 1. 网站导航
- ⚡ **极致响应**：基于 Vite + React 构建，配合 `React.lazy` 与 `Suspense` 实现路由级别按需拆包 (Code Splitting)，首页极速直达。
- 🎨 **Apple 美学体验**：遵循苹果人机界面指南 (HIG)，采用系统字体族 (`-apple-system`, `SF Pro Display`)、精细毛玻璃拟态、柔和高级灰边框与丝滑微交互动效。
- 🌓 **深浅外观双模**：智能跟随系统偏好，HTML 根部注入防白屏跳闪 (FOUC) 预初始化脚本，支持一键无感切换并持久化记忆。
- 🔍 **Spotlight 快速检索**：支持针对网站名称、描述、域名（如 `github`、`juejin`）进行拼音与模糊匹配，按 `Enter` 回车直达首条结果。
- 🏷️ **iOS 分段控制器**：分类切换带实时卡片数量统计徽标与浮动胶囊背景。
- 🌐 **自适应 Favicon**：集成稳定高速的 Favicon 图标解析服务，附带优雅的首字母 Fallback 占位。

---

### 🛠️ 2. 实用工具箱 (19 款全功能工具，支持独立路由与分类筛选)

所有工具均在浏览器纯内存与本地安全 `localStorage` 中执行，绝无网络数据外泄风险；全工具页面统一标配 **`🔒 纯本地离线处理`** 安全认证徽标。

#### 📦 跨境电商专区 (Ozon 平台全链路辅助)
- 📄 **Ozon 富内容生成器 (`#/tools/ozon-rich`)**：智能识别商品 4 大核心卖点，解耦底层解析逻辑，一键生成 100% 对齐官方规范的 `raTextBlock` JSON 模板 (`version: 0.3`)。
- 📊 **Ozon 尺码表生成器 (`#/tools/ozon-size`)**：支持从 Excel 表格直接复制粘贴，全自动净化中文字符并标准化俄文表头，生成 RU+INT 双行对照表与平台标准的 `tcTable` JSON 结构。
- 💰 **Ozon 利润与定价计算器 (`#/tools/ozon-calc`)**：采购成本、商品克重、中俄跨境干线物流、平台类目扣点与损耗全链路联动，科学测算建议卢布零售价与保本底线。

#### 💻 后端开发与调试工具
- 🌐 **IP 纯净度与风险体检 (`#/tools/ip-check`)**：纯前端直连探测公网 IP 归属地、ISP 运营商与 ASN 编号，智能识别云机房托管 (Hosting) vs 家庭原生住宅 (Residential) 属性及代理/VPN/Tor 风险标记，提供 Apple Bento Grid 风格的综合纯净度体检。
- ☕ **SQL DDL 转 MyBatis-Plus (`#/tools/sql-to-pojo`)**：浏览器端解析 MySQL 建表 DDL 语句，自动生成带 `@TableName`、`@TableId`、`@TableField` 的 POJO 实体类与 Mapper 接口；支持准确识别**复合主键 / 联合索引**并给出架构调整告警指引，附带 SQL `IN (...)` 批量查询格式化助手。
- ⚖️ **Monaco 代码/文本 Diff 对比器 (`#/tools/diff`)**：内嵌 VS Code Monaco Editor 内核，专业高亮对比两段文本、JSON、YAML 或 Java 代码的行级增删差异。
- ☕ **JSON 转 Java POJO / Lombok (`#/tools/json-to-java`)**：纯前端递归推导复杂 JSON 结构，支持自动生成带 Lombok 注解、Jackson 序列化属性以及嵌套静态内部类。
- ⏰ **Cron 表达式生成与预测器 (`#/tools/cron`)**：提供可视化秒/分/时/日/月/周配置向导，支持解析 Spring 与 Linux Cron 表达式；采用**字段级跳跃推算算法**，告别逐秒暴力循环，亚毫秒级计算未来 10 次执行时刻与中文自然语言释义。
- 📝 **代码练习板 (`#/tools/code-pad`)**：Monaco Editor 驱动，预置 Java、Python、C++、Go 算法答题骨架，支持代码草稿本地持久化暂存与一键重置。
- ⏱️ **时间戳转换器 (`#/tools/timestamp`)**：秒级/毫秒级 Unix 时间戳自动识别，支持双向转换为本地时间、莫斯科时区时间 (MSK / UTC+3) 与相对自然语言时间。
- 🎯 **正则表达式测试器 (`#/tools/regex`)**：支持修饰符多选、预设高频正则模板、实时语法匹配高亮与捕获组索引详情，支持 `⌘K` / `Ctrl+K` 快速聚焦与一键复制匹配项。
- 🌐 **cURL 转多语言代码 (`#/tools/curl`)**：快速解析浏览器 Network 导出的 cURL 命令，一键转为 Java HttpClient、Spring RestTemplate、OkHttp 或 JS Fetch 代码。

#### 🔄 编码与转换工具
- 📦 **JSON 格式化 / 校验器 (`#/tools/json`)**：双栏实时排版，2 空格优雅缩进美化、紧凑压缩与报错行号精确定位；深度适配极客快捷键，支持 `⌘K` / `Ctrl+K` 聚焦输入框与 `⌘/Ctrl + Enter` 一键校验美化。
- 🔤 **URL / Base64 编解码器 (`#/tools/codec`)**：双向编解码转换，原生支持 UTF-8 中文编码防乱码。
- 🔑 **JWT 离线安全解码器 (`#/tools/jwt`)**：纯内存解码 Header 与 Payload Claims，自动解析过期时间戳并呈现倒计时状态，数据永不离端。

#### 🛡️ 安全与计算工具
- 🔢 **进制转换器 (`#/tools/base-convert`)**：支持二进制、八进制、十进制、十六进制实时互转，借助 BigInt 保证大整数计算精度。
- 🔑 **哈希与 UUID 生成器 (`#/tools/hash`)**：基于原生 Web Crypto API 极速计算 SHA-256、SHA-512、SHA-1，内置独立纯 JS MD5 算法引擎，支持标准 UUID v4 批量生成。

#### ☕ 生产力与专注
- 📝 **Apple Notes 极简便签 (`#/tools/scratchpad`)**：模拟便签纸交互，通过统一安全存储模块自动落盘，随手记临时配置、日志 ID 或碎片想法，支持 JSON 全量导入导出备份。
- ⏱️ **极简白噪音专注番茄钟 (`#/tools/zen-focus`)**：经典 25+5 分钟环形番茄钟，基于 Web Audio 原生算法合成细雨白噪音与自然衰减颂钵提示音；集成系统级桌面通知 (Web Notification) 与站内优雅 Toast 横幅，彻底杜绝阻断性原生 alert 弹窗，0 外部音频文件网络开销。

---

### 🎮 3. 休闲小游戏中心 (`#/games`)

遵循 Apple Bento Grid 设计美学，整合 7 款经典益智与策略游戏，**免安装、零外部音频资源、全本地战绩存储**：

- 🐍 **贪吃蛇 (`#/games/snake`)**：经典 60FPS 敏捷贪吃蛇，支持平滑操控、动态阶梯变速、Canvas 高清微动效与移动端虚拟十字键。
- 🔢 **2048 (`#/games/2048`)**：4×4 经典数字华容道合并，支持一键撤销历史、移动端轻扫手势、弹跳微动效与最高分记录。
- 💣 **扫雷 (`#/games/minesweeper`)**：经典 Windows 推理排雷体验，首击绝对安全保证、空白连片展开、插旗标记与初/中双难度记录。
- 🧩 **记忆翻牌 (`#/games/memory`)**：4×4 网格 8 对精选极客科技 Emoji，纯 CSS 3D 立体翻转与通关星芒礼花狂欢。
- 🧱 **俄罗斯方块 (`#/games/tetris`)**：纯正经典 60FPS 消除挑战，支持 SRS 旋转踢墙系统、7-Bag 随机器、Hold 暂存、幽灵落点投影与消行计分。
- ♟️ **五子棋人机 (`#/games/gomoku`)**：经典 15×15 棋盘人机对弈，内置简单/中等/困难 3 级启发式 Minimax AI 与无限步悔棋支持。
- 🔢 **数独 (`#/games/sudoku`)**：经典 9×9 逻辑数独，唯一解题目回溯生成引擎，支持候选笔记模式、实时冲突高亮与三档难度。
- 🔊 **Web Audio 物理算法合成音效**：全游戏集成算法即时合成的拟真音效（消除、旋转、落子、合并、胜负等），0KB 外部音频文件网络消耗。
- 🏆 **本地战绩持久化**：各游戏游玩次数、最高分、最快用时持久化保存于本地浏览器。

---

### 📖 4. 极简技术速查备忘录 (`#/cheatsheet`)
- ⚡ **零后端静态驱动**：借助 Vite `?raw` 纯静态内联打包与 `marked` 高性能解析，无需独立 API 服务即可极速呈现。
- 📚 **精选后端与架构高频锦囊**：
  - **Java 核心**：Stream 流式常用算子、Optional 防空规范、Java 17/21 现代语法糖。
  - **JVM 调优**：生产推荐启动参数、jstack/jmap/jstat 四剑客与 OOM 排障黄金流程。
  - **Spring Boot**：核心注解全景、Bean 生命周期与 `@Transactional` 事务失效八大场景。
  - **Redis 核心**：五大数据结构高频命令、分布式锁三大原则与穿透/击穿/雪崩对策。
  - **Docker & Compose**：容器生命周期、生产性能限制、日志排障与实战 YAML 模板。
  - **Git 锦囊**：紧急撤销 commit、暂存区找回、变基操作与 reflog 时光机救急。
  - **Linux 诊断**：CPU、内存、磁盘 I/O 及网络四大维度的快速定位命令。
- 🔍 **全量即时检索**：支持跨文档多维度关键词秒级过滤，代码块一键快速复制。

---

### 👨‍💻 5. 关于我与创意实验室 (`#/about`)
- 🪪 **Apple 风格极简名片**：光晕渐变头像、点击弹性微动效、身份简介与一键复制主页链接。
- 📚 **在读书单 (Reading Section)**：精选技术与认知书籍卡片，附阅读状态标签与个人书评感悟。
- 🧪 **创意实验室 (Playground)**：
  - **3D 悬浮流光极客通行证**：CSS 3D 透视物理倾斜、光标菲涅尔高光追踪与 3 款质感皮肤切换。
  - **极光微光粒子流与代码雨矩阵**：HTML5 Canvas 原生引擎、Retina 级像素抗锯齿、流体斥力扰动与后台节能休眠。
  - **极客灵感打字机**：Web Audio 物理敲击滴答音与大七和弦合成，打字机拟真节奏逐字输出。

---

### ⚙️ 6. 系统设置与数据中心 (`#/settings`)
- 📱 **PWA 离线应用与运行状态**：Service Worker 全量预缓存、独立窗口模式 (Standalone) 探测、一键安装、更新检查与离线缓存清理。
- 🔐 **站点访问锁与隐私防护**：整站访问密码保护屏障，原生 SHA-256 安全哈希校验，支持自定义修改密码与一键恢复默认 (520)。
- 📊 **本地存储用量深度分析**：实时分析 localStorage 各功能模块真实占用与容量占比，支持单模块导出与一键清空。
- 💾 **全站数据无损备份与迁移**：一键导出整站结构化 JSON 快照；支持导入备份预检，提供“智能合并”与“完全覆盖”双模式。
- ⚠️ **危险区域出厂重置**：防误触二次口令确认，一键重置全站数据至纯净出厂状态。

---

### 💻 7. 全局效率工具与极客彩蛋

#### ⚡ Command Palette 快捷命令面板 (`⌘K` / `Ctrl+K`)
- **呼出方式**：在全站任意界面按下 `⌘K` / `Ctrl+K` 或点击顶部搜索图标呼出。
- **功能特性**：
  - 加权多字段模糊检索，支持拼音与缩写匹配；
  - 覆盖五大核心数据域：系统快捷动作、19 款离线小工具、7 款休闲小游戏、7 篇技术速查小节与精选导航网站；
  - 最近使用命令自动记录与置顶推荐；
  - 全键盘无障碍操作支持 (`↑` / `↓` 切换选中，`Enter` 执行，`ESC` 关闭)。

#### 💻 macOS 极客 Web 终端 (Easter Egg)
- **唤起方式**：在全站任意界面按下按键 `` ` ``（反引号）或点击顶部导航栏终端图标，按 `ESC` 键关闭。
- **支持命令列表**：
  | 命令 | 说明 |
  | :--- | :--- |
  | `help` | 显示终端所有可用指令与说明 |
  | `tools` | 列出全部 19 款实用小工具的 ID 与分类 |
  | `open <tool_id>` | 快速路由跳转至指定小工具（如 `open diff`、`open ozon-calc`） |
  | `games` | 直达休闲小游戏大厅 |
  | `game <name>` | 快速直达指定小游戏（如 `game tetris`、`game sudoku`） |
  | `nav` | 返回网站导航首页 |
  | `cheatsheet` | 直达技术速查备忘录 |
  | `about` | 直达关于我与创意实验室 |
  | `settings` | 直达系统设置与数据中心 |
  | `theme <dark\|light>` | 快速切换全局外观主题（如 `theme dark`） |
  | `date` | 查看本地时间与莫斯科时区时间 (MSK / UTC+3) |
  | `matrix` | 触发全屏黑客帝国数字雨动态彩蛋（按 `ESC` 或点击屏幕退出） |
  | `clear` | 清空终端屏幕历史记录 |
  | `exit` | 关闭终端浮层 |

---

## 📂 项目结构规范

```text
personWeb/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动化构建与 Pages 发布工作流
├── src/
│   ├── components/               # Apple HIG 通用组件
│   │   ├── about/                # 关于我专属子组件 (Hero/书单/实验室)
│   │   │   ├── AboutHero.jsx     # 个人名片与社交连接
│   │   │   ├── ReadingSection.jsx# 在读书单展示卡片
│   │   │   ├── LabSection.jsx    # 创意实验室容器
│   │   │   └── lab/              # 实验室互动模块 (3D名片/粒子画布/打字机)
│   │   ├── games/                # 游戏通用组件 (顶栏/帮助弹窗/结算/虚拟手柄)
│   │   ├── Header.jsx            # 顶部导航栏 (分段路由/深浅切换/搜索/终端)
│   │   ├── SearchBar.jsx         # 网站导航 Spotlight 搜索栏
│   │   ├── CategoryTabs.jsx      # 分类筛选胶囊控制器
│   │   ├── SiteCard.jsx          # 导航卡片组件
│   │   ├── SiteGrid.jsx          # 响应式网格布局
│   │   ├── ToolLayout.jsx        # 统一的小工具通用布局外壳
│   │   ├── CommandPalette.jsx    # 全局 Raycast 风格快捷命令面板
│   │   ├── SiteLockScreen.jsx    # 全局站点访问安全锁屏
│   │   ├── PwaUpdateToast.jsx    # PWA 离线平滑热更新通知
│   │   └── WebTerminal.jsx       # 全局唤起式极客终端与 Canvas Matrix 引擎
│   ├── data/                     # 静态数据与文档配置
│   │   ├── cheatsheets/          # 7 篇技术速查 Markdown 原文 (Java/JVM/Spring/Redis/Docker/Git/Linux)
│   │   ├── profileData.js        # 个人名片、在读书单与打字机语录数据源
│   │   ├── sites.js              # 常用网站分类与链接数据源
│   │   └── tools.js              # 19 款小工具元数据与路由配置
│   ├── hooks/                    # 自定义 React Hooks
│   │   ├── useCategoryFilter.js  # 分类过滤与搜索高亮自定义 Hook
│   │   ├── useCopyToClipboard.js # 剪贴板一键复制通用 Hook
│   │   ├── usePageTitle.js       # 页面标题自适应 Hook
│   │   ├── usePwaInstall.js      # PWA 安装能力与独立窗口探测 Hook
│   │   └── useTouchSwipe.js      # 移动端手势滑动轻扫 Hook
│   ├── pages/                    # 页面视图组件
│   │   ├── Home.jsx              # 网站导航首页
│   │   ├── AboutMe.jsx           # 关于我极简名片与实验室
│   │   ├── Settings.jsx          # 系统设置与数据中心
│   │   ├── cheatsheets/          # 极简技术速查备忘录首页
│   │   ├── games/                # 7 款休闲小游戏视图 (贪吃蛇/2048/扫雷/翻牌/俄罗斯方块/五子棋/数独)
│   │   └── tools/                # 19 款小工具实现组件
│   ├── styles/
│   │   └── shared.css            # Apple HIG 变量规范体系与全局样式
│   ├── utils/                    # 核心工具与算法引擎
│   │   ├── games/                # 7 款小游戏的纯逻辑算法引擎 (SRS踢墙/Minimax AI/数独回溯等)
│   │   ├── backupManager.js      # 数据备份、快照校验、全站导入导出引擎
│   │   ├── commandPaletteIndex.js# 命令面板全域加权模糊检索引擎
│   │   ├── gameAudio.js          # Web Audio 原生算法音效合成引擎
│   │   ├── gameStorage.js        # 游戏历史战绩本地持久化
│   │   ├── siteLock.js           # 站点安全访问锁屏与 SHA-256 密码比对
│   │   ├── md5.js                # 纯 JS 离线 MD5 摘要计算实现
│   │   ├── ozonParser.js         # Ozon 尺码表与富内容标准化解析与构建引擎
│   │   └── storage.js            # 全局统一安全容错 localStorage 存储包装器
│   ├── App.jsx                   # 根路由配置 (HashRouter + Code Splitting 懒加载)
│   ├── main.jsx                  # React 挂载入口
│   └── index.css                 # 基础样式重置
├── tests/                        # 自动化单元测试套件 (142+ 自动化测试全量通过)
├── index.html                    # 页面入口模板 (包含防白屏跳闪内联脚本)
├── vite.config.js                # Vite 6 构建配置 (集成 PWA 离线支持)
├── package.json                  # 依赖与脚本配置
└── README.md                     # 项目说明文档
```

---

## 🛠️ 技术栈

| 模块 | 选型 | 说明 |
| :--- | :--- | :--- |
| **构建工具** | Vite 6.0 | 极速冷启动与毫秒级 HMR 模块热重载 |
| **核心框架** | React 18.3 | 函数组件、Hooks 与 `React.lazy` / `Suspense` |
| **路由驱动** | React Router 7.1 | 采用 `HashRouter` 适配 GitHub Pages 静态托管与刷新防 404 |
| **离线应用** | PWA (`vite-plugin-pwa`) | Service Worker 离线预缓存与平滑热更新通知 |
| **代码编辑** | Monaco Editor | VS Code 核心编辑器内核 (`@monaco-editor/react`) |
| **文档解析** | Marked 18.0 | 高性能纯前端 Markdown 解析器 |
| **样式体系** | 纯 CSS (Apple HIG) | 基于 CSS Custom Properties 设计变量，零沉重第三方 UI 库依赖 |
| **音效算法** | Web Audio API | 原生振荡器算法合成白噪音、颂钵泛音与 7 款小游戏动态拟真音效，0 外部音频带宽消耗 |
| **图形渲染** | HTML5 Canvas 2D | 60FPS 俄罗斯方块渲染、黑客帝国代码雨引擎与极光微光粒子流 |
| **存储安全** | 容错 Safe Storage | 封装原生 `localStorage`，兼顾 Safari 隐私无痕模式与存储超限容错保护 |
| **数据备份** | Backup Manager | 支持全站多模块用量深度分析与结构化 JSON 快照导入/导出/合并 |
| **安全锁屏** | Web Crypto SHA-256 | 基于浏览器原生密码学 API 实现整站访问密码保护屏障 |
| **测试套件** | Node.js Test Runner | 内置 16 个测试套件、142+ 单元测试覆盖各算法引擎 |
| **持续集成** | GitHub Actions | 自动化 CI/CD 打包并一键发布至 GitHub Pages |

---

## 🚀 本地开发与测试

### 1. 环境准备
确保本地已安装 [Node.js](https://nodejs.org/) (推荐 Node 18 或 20+)。

### 2. 克隆仓库与安装依赖
```bash
# 克隆仓库
git clone https://github.com/liuye28/ly.github.io.git
cd ly.github.io

# 安装依赖
npm install
```

### 3. 启动本地开发服务
```bash
npm run dev
```
启动成功后，在浏览器访问 [http://localhost:3000](http://localhost:3000) 即可实时预览。

### 4. 运行自动化单元测试
```bash
npm test
```
执行全部 16 个算法测试套件（涵盖俄罗斯方块 SRS 踢墙、五子棋 Minimax AI、数独唯一解生成器、扫雷、2048、数据备份迁移、站点锁屏等 142+ 测试用例）。

### 5. 生产构建打包
```bash
npm run build
```
打包产物将自动生成在 `dist/` 目录下。可通过以下命令在本地快速预览打包产物：
```bash
npm run preview
```

---

## 🚢 GitHub Pages 自动部署

本项目已内置 GitHub Actions 自动化构建部署脚本 (`.github/workflows/deploy.yml`)：

1. 将代码推送到 GitHub 仓库的 `main` 分支；
2. 进入仓库页面的 **Settings** -> **Pages**；
3. 将 **Build and deployment** 下的 **Source** 配置为 **GitHub Actions**；
4. 每次 `git push` 到 `main` 分支时，GitHub Actions 会自动触发构建、打包与部署，约 1 分钟后即可通过 `https://<用户名>.github.io` 访问最新版本。

---

## 🔒 隐私与安全性

- **100% 纯本地离线运算**：全工具统一标配 `🔒 纯本地离线处理` 安全认证，无论是 SQL DDL 转换、JSON 转换、JWT 解码、Hash 计算还是 cURL 转换，所有数据均仅在浏览器沙箱内存中瞬时处理，**不设任何后端接收服务、不向任何云端第三方发送用户内容与操作日志**。
- **容错存储保障 (Safe Storage)**：便签记事本、代码练习板草稿、游戏历史战绩与偏好设置通过封装的安全存储接口读写，即使在 Safari 无痕浏览、第三方 Storage 权限受限或存储配额已满等严苛环境下依然稳健运行，数据绝不上云。
- **纯原生算法实现**：MD5、白噪音声学、游戏音效、粒子系统与代码雨等均采用原生纯 JS / Web Audio / Canvas API 计算合成，零外部音视频资源外链。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。欢迎 Star、Fork 或提交 Pull Request！
