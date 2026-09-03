# 个人导航与开发者/跨境工具箱 (Ly's Workspace)

<p align="center">
  <strong>基于 Vite + React 构建的高性能、极简纯静态个人常用网站导航与开发者 / 跨境电商工具箱</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/React_Router-7.1-CA4245?logo=reactrouter&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Monaco_Editor-0.52-007ACC?logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/Design-Apple_HIG-000000?logo=apple&logoColor=white" alt="Apple Design" />
  <img src="https://img.shields.io/badge/Deploy-GitHub_Pages-222222?logo=github&logoColor=white" alt="GitHub Pages" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

---

## 📖 项目简介

**Ly's Workspace** 是一个追求极致轻量、美观与实用性的纯前端一站式工作台。全面采用 **Apple (macOS / iOS / HIG)** 极简设计规范，整合了**常用网站导航**、**18 款开箱即用的开发与跨境电商小工具**、**高频技术速查备忘录**、**极简个人名片**以及**全局极客 Web 终端**。

项目基于纯静态架构设计，**零后端依赖、数据绝不上报云端**，兼具毫秒级加载响应与极致的私密安全性；通过 GitHub Actions 实现代码推送到 `main` 分支全自动构建部署至 GitHub Pages。

---

## 🌟 核心特性

### 🧭 1. 网站导航
- ⚡ **极致响应**：基于 Vite + React 构建，配合 `React.lazy` 与 `Suspense` 实现路由级别按需拆包 (Code Splitting)，首页极速直达。
- 🎨 **Apple 美学体验**：遵循苹果人机界面指南 (HIG)，采用系统字体族 (`-apple-system`, `SF Pro Display`)、精细的毛玻璃阴影、柔和的高级灰边框与微交互动效。
- 🌓 **深浅外观双模**：智能跟随系统偏好，HTML 根部注入防白屏跳闪 (FOUC) 预初始化脚本，支持一键无感切换并持久化记忆。
- 🔍 **Spotlight 快速检索**：支持全局快捷键 `⌘K` / `Ctrl+K` 聚焦搜索框，支持针对网站名称、描述、域名（如 `github`、`juejin`）进行拼音/模糊匹配，支持按 `Enter` 回车直达首条结果。
- 🏷️ **iOS 分段控制器**：分类切换带实时卡片数量统计徽标与浮动胶囊背景。
- 🌐 **自适应 Favicon**：集成稳定高速的国内 Favicon 图标解析服务，且附带优雅的首字母 Fallback 占位。

---

### 🛠️ 2. 实用工具箱 (18 款全功能工具，支持独立路由与分类筛选)

所有工具均在浏览器纯内存与本地安全 `localStorage` 中执行，绝无网络数据外泄风险；全工具页面统一标配 **`🔒 纯本地离线处理`** 安全认证徽标。

#### 📦 跨境电商专区 (Ozon 平台全链路辅助)
- 📄 **Ozon 富内容生成器 (`#/tools/ozon-rich`)**：智能识别商品 4 大核心卖点，解耦底层解析逻辑，一键生成 100% 对齐官方规范的 `raTextBlock` JSON 模板 (`version: 0.3`)。
- 📊 **Ozon 尺码表生成器 (`#/tools/ozon-size`)**：支持从 Excel 表格直接复制粘贴，全自动净化中文字符并标准化俄文表头，生成 RU+INT 双行对照表与平台标准的 `tcTable` JSON 结构。
- 💰 **Ozon 利润与定价计算器 (`#/tools/ozon-calc`)**：采购成本、商品克重、中俄跨境干线物流、平台类目扣点与损耗全链路联动，科学测算建议卢布零售价与保本底线。

#### 💻 后端开发与调试工具
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

### 📖 3. 极简技术速查备忘录 (`#/cheatsheet`)
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

### 👨‍💻 4. 关于我 (About Me) (`#/about`)
- Apple 风格极简名片设计，直观展示个人身份头像与简介。
- 开放快速连接渠道，一键跳转 GitHub 个人主页与本站开源仓库源码。

---

### 💻 5. 全局 macOS 极客终端 (Easter Egg)
- **唤起方式**：在全站任意界面按下按键 `` ` ``（反引号）或点击顶部导航栏的终端图标呼出/隐藏，按 `ESC` 键关闭。
- **支持命令列表**：
  | 命令 | 说明 |
  | :--- | :--- |
  | `help` | 显示终端所有可用指令与说明 |
  | `tools` | 列出全部 18 款实用小工具的 ID 与分类 |
  | `open <tool_id>` | 快速路由跳转至指定小工具（如 `open diff`、`open ozon-calc`） |
  | `nav` | 返回网站导航首页 |
  | `cheatsheet` | 直达技术速查备忘录 |
  | `about` | 直达关于我页面 |
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
│   │   ├── Header.jsx            # 顶部导航栏 (深浅切换、终端唤起、分段路由)
│   │   ├── SearchBar.jsx         # 网站导航 Spotlight 搜索栏
│   │   ├── CategoryTabs.jsx      # 分类筛选胶囊控制器
│   │   ├── SiteCard.jsx          # 导航卡片组件
│   │   ├── SiteGrid.jsx          # 响应式网格布局
│   │   ├── ToolLayout.jsx        # 统一的小工具通用布局外壳
│   │   └── WebTerminal.jsx       # 全局唤起式极客终端与 Canvas Matrix 引擎
│   ├── data/                     # 静态数据与文档配置
│   │   ├── cheatsheets/          # 7 篇技术速查 Markdown 原文 (Java/JVM/Spring/Redis/Docker/Git/Linux)
│   │   ├── sites.js              # 常用网站分类与链接数据源
│   │   └── tools.js              # 18 款小工具元数据与路由配置
│   ├── hooks/
│   │   ├── useCategoryFilter.js  # 分类过滤与搜索高亮自定义 Hook
│   │   └── useCopyToClipboard.js # 剪贴板一键复制、多键位支持与定时自动复位通用 Hook
│   ├── pages/                    # 页面视图组件
│   │   ├── Home.jsx              # 网站导航首页
│   │   ├── AboutMe.jsx           # 关于我极简名片页
│   │   ├── cheatsheets/          # 极简技术速查备忘录首页
│   │   └── tools/                # 18 款小工具实现组件
│   ├── styles/
│   │   └── shared.css            # Apple HIG 变量规范体系与全局样式
│   ├── utils/
│   │   ├── md5.js                # 纯 JS 离线 MD5 摘要计算实现 (独立无外部依赖)
│   │   ├── ozonParser.js         # Ozon 尺码表与富内容核心标准化解析与构建引擎
│   │   ├── storage.js            # 全局统一安全容错 localStorage 存储与 JSON 包装器
│   │   └── url.js                # URL 标准化与 Favicon 获取逻辑
│   ├── App.jsx                   # 根路由配置 (HashRouter + Code Splitting 懒加载)
│   ├── main.jsx                  # React 挂载入口
│   └── index.css                 # 基础样式重置
├── index.html                    # 页面入口模板 (包含防白屏跳闪内联脚本)
├── vite.config.js                # Vite 6 构建配置
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
| **代码编辑** | Monaco Editor | VS Code 核心编辑器内核 (`@monaco-editor/react`) |
| **文档解析** | Marked 18.0 | 高性能纯前端 Markdown 解析器 |
| **样式体系** | 纯 CSS (Apple HIG) | 基于 CSS Custom Properties 设计变量，零沉重第三方 UI 库依赖 |
| **声学与提醒** | Web Audio & Notification | 原生振荡器算法合成白噪音与颂钵提示音，结合系统级桌面通知，0 外部音频带宽开销 |
| **存储安全** | 容错 Safe Storage | 封装原生 `localStorage`，兼顾 Safari 隐私无痕模式与存储超限容错保护 |
| **持续集成** | GitHub Actions | 自动化 CI/CD 打包并一键发布至 GitHub Pages |

---

## 🚀 本地开发与使用

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

### 4. 生产构建打包
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
- **容错存储保障 (Safe Storage)**：便签记事本、代码练习板草稿与主题偏好通过定制封装的安全存储接口读写，即使在 Safari 无痕浏览、第三方 Storage 权限受限或存储配额已满等严苛环境下依然稳健运行，数据绝不上云。
- **纯原生算法实现**：MD5、白噪音声学、自然衰减颂钵泛音等均采用原生纯 JS / Web Audio API 计算合成，零外部音频与字体等敏感资源外链。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。欢迎 Star、Fork 或提交 Pull Request！
