# 个人导航与开发者/跨境工具箱 (Ly's Workspace)

一个基于 **Vite + React** 构建的轻量、简洁、高效的个人常用网站导航与开发者/跨境电商运营工具箱。全面采用 **Apple (macOS / iOS / HIG)** 极简美学设计，支持深浅色模式自由切换、实时搜索与过滤、多工具独立路由，并支持通过 GitHub Actions 自动构建部署至 GitHub Pages。

---

## 🌟 特性一览

### 🧭 网站导航
- ⚡ **轻量疾速**：基于 Vite + React，通过 `React.lazy` 与 `Suspense` 实现路由按需拆包 (Code Splitting)，首页初始加载秒开。
- 🎨 **Apple 美学**：留白舒适、SF Pro 字体体系、App 图标圆角与微交互动效。
- 🌓 **深浅外观**：智能跟随系统偏好，HTML 头部注入防闪烁初始化脚本彻底告别刷新白屏跳闪 (FOUC)，支持一键切换与本地记忆。
- 🔍 **Spotlight 搜索**：支持 `⌘K` / `Ctrl+K` 快速聚焦，支持名称、描述、网址/域名（如 zhihu、juejin）全局模糊匹配，支持按 `Enter` 回车直达。
- 🏷️ **iOS 分段控制器**：分类切换带计数微标与浮动胶囊背景。
- 🌐 **自动 Favicon**：基于国内稳定高速的 `favicon.im` 服务动态获取高清图标，并提供优雅首字母 Fallback。

---

### 🛠️ 实用工具箱 (18 款全开箱即用，支持分类检索与独立路由)

#### 📦 跨境电商专区 (Ozon 平台全链路辅助)
- 📄 **Ozon 富内容生成器 (`#/tools/ozon-rich`)**：智能识别 4 大核心卖点，100% 对齐官方 `raTextBlock` JSON (`version: 0.3`)。
- 📊 **Ozon 尺码表生成器 (`#/tools/ozon-size`)**：中文全自动净化与俄文标准化，生成 RU+INT 双行对照表与 `tcTable` JSON。
- 💰 **Ozon 利润与定价计算器 (`#/tools/ozon-calc`)**：采购进价、克重、跨境干线、平台扣点与损耗联动，科学推算建议零售价（卢布）与保本底线。

#### 💻 后端开发与调试工具
- ☕ **SQL DDL 转 MyBatis-Plus (`#/tools/sql-to-pojo`)**：纯前端解析 MySQL 建表 DDL，自动生成带 `@TableName`、`@TableId`、`@TableField`、`@Data` 的实体类与 Mapper 接口，附带 SQL `IN (...)` 格式化小助手。
- ⚖️ **Monaco 文本/代码 Diff 对比器 (`#/tools/diff`)**：基于 VS Code Monaco Editor 内核，专业高亮对比两段文本、JSON、YAML 或 Java 代码的行级差异。
- ☕ **JSON 转 Java POJO / Lombok (`#/tools/json-to-java`)**：浏览器端递归解析复杂 JSON 结构，支持 Lombok、Jackson 注解与静态内部类生成。
- ⏰ **Cron 表达式生成与预测器 (`#/tools/cron`)**：可视化配置向导与直接解析 Spring/Linux Cron 表达式，带中文自然语言释义与未来 10 次执行时间推算。
- 📝 **代码练习板 (`#/tools/code-pad`)**：Monaco Editor 驱动，内置 Java/Python/C++/Go 算法模板，支持双栏对照与防丢暂存。
- ⏱️ **时间戳转换器 (`#/tools/timestamp`)**：秒/毫秒自动识别，双向转换为本地时间、莫斯科时间 (MSK / UTC+3) 与相对时间。
- 🎯 **正则表达式测试器 (`#/tools/regex`)**：Flags 修饰符选择、常用正则预设与实时匹配项高亮。
- 🌐 **cURL 转多语言代码 (`#/tools/curl`)**：解析抓包 cURL 命令，一键转为 Java HttpClient、Spring RestTemplate、OkHttp 或 JS Fetch。

#### 🔄 编码与转换工具
- 📦 **JSON 格式化 / 校验器 (`#/tools/json`)**：双栏实时排版，2 空格标准缩进美化，紧凑压缩与报错精确定位。
- 🔤 **URL / Base64 编解码器 (`#/tools/codec`)**：双向编解码，原生支持 UTF-8 中文无乱码。
- 🔑 **JWT 离线安全解码器 (`#/tools/jwt`)**：纯内存 Base64URL 解码 Claims 数据，换算过期时间与相对有效倒计时，绝不上网泄露 Token。

#### 🛡️ 安全与计算工具
- 🔢 **进制转换器 (`#/tools/base-convert`)**：二进制、八进制、十进制、十六进制实时互转，支持 BigInt 大数精度。
- 🔑 **哈希与 UUID 生成器 (`#/tools/hash`)**：Web Crypto API 实时计算 SHA-256、SHA-512、SHA-1，批量生成 UUID v4。

#### ☕ 生产力与专注
- 📝 **Apple Notes 极简便签 (`#/tools/scratchpad`)**：纯本地 localStorage 离线存储，随手记临时配置、日志 ID 或灵感，支持 JSON 导入导出备份。
- ⏱️ **极简白噪音专注番茄钟 (`#/tools/zen-focus`)**：经典 25+5 分钟环形番茄钟，基于 Web Audio 原生算法合成细雨与白噪音，0KB 音频媒体开销。

---

### 📖 极简技术速查备忘录 (`#/cheatsheet`)
- ⚡ **零后端静态打包**：借助 Vite 纯静态打包与 `marked` 高性能解析，无需数据库与任何独立后端。
- 📚 **精选后端与架构高频锦囊**：
  - **Java 核心**：Stream 流式操作、Optional 防空规范、Java 17/21 现代语法糖。
  - **JVM 调优**：生产启动推荐参数模板、jstack/jmap/jstat 四剑客与 OOM 排障。
  - **Spring Boot**：核心注解全景、Bean 生命周期与 `@Transactional` 事务失效八大场景。
  - **Redis 核心**：五大数据结构高频命令、分布式锁核心要点与缓存穿透/击穿/雪崩对策。
  - **Docker & Compose**：容器生命周期、日志排错、资源限制与 YAML 模板。
  - **Git 锦囊**：紧急撤销 commit、暂存区找回、变基与 reflog 时光机救急。
  - **Linux 性能**：CPU、内存、磁盘 I/O 及网络四大维度的快速定位命令。
- 🔍 **全量即时检索**：支持跨文档关键词快速过滤，代码块一键复制。

---

### 👨‍💻 关于我与技术雷达 (`#/about`)
- Apple 风格个人卡片展示：职业经历、技术栈熟练度矩阵（Java 核心、存储中间件、云原生、跨境全栈）。

---

### 💻 全局 macOS 极客终端 (Easter Egg)
- 全局按快捷键 `` ` ``（反引号）或点击顶栏终端图标呼出。
- 支持命令行交互：`help`、`tools`、`open <id>`、`theme <dark|light>`、`date`、`matrix`（全屏代码雨）等指令。

---

## 🛠️ 技术栈

- **构建工具**：Vite 6
- **核心框架**：React 18 (函数组件 + Hooks)
- **代码编辑器**：Monaco Editor (`@monaco-editor/react`)
- **路由方案**：React Router 7 (使用 `HashRouter` 适配 GitHub Pages 静态部署与刷新)
- **样式方案**：纯 CSS (Apple HIG CSS Custom Properties 变量设计系统)
- **持续集成**：GitHub Actions (`.github/workflows/deploy.yml`)

---

## 🚀 快速上手

### 1. 安装依赖
```bash
npm install
```

### 2. 启动本地开发服务
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可预览。

### 3. 构建打包
```bash
npm run build
```
打包产物输出至 `dist/` 目录。

---

## 🚢 部署到 GitHub Pages

1. 将代码推送到 GitHub 的 `main` 分支（仓库名 `用户名.github.io`）。
2. 在 GitHub 仓库页面中点击 **Settings** -> **Pages**。
3. 将 **Build and deployment** 下的 **Source** 选择为 **GitHub Actions**。
4. 随后推送到 `main` 分支时，GitHub Actions 会自动打包并发布，1~2 分钟后即可通过 `https://<用户名>.github.io` 访问！
