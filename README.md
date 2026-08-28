# 个人导航与开发者/跨境工具箱 (Ly's Workspace)

一个基于 **Vite + React** 构建的轻量、简洁、高效的个人常用网站导航与开发者/跨境电商运营工具箱。全面采用 **Apple (macOS / iOS / HIG)** 极简美学设计，支持深浅色模式自由切换、实时搜索与过滤、多工具独立路由，并支持通过 GitHub Actions 自动构建部署至 GitHub Pages。

---

## 🌟 特性一览

### 🧭 网站导航
- ⚡ **轻量疾速**：基于 Vite + React，零重量级 UI 库负担，秒级加载。
- 🎨 **Apple 美学**：留白舒适、SF Pro 字体体系、App 图标圆角与微交互动效。
- 🌓 **深浅外观**：智能跟随系统偏好，支持右上角一键切换与 `localStorage` 本地记忆。
- 🔍 **Spotlight 搜索**：支持 `⌘K` / `Ctrl+K` 快速唤起与实时模糊过滤。
- 🏷️ **iOS 分段控制器**：分类切换带计数微标与浮动胶囊背景。
- 🌐 **自动 Favicon**：基于 Google Favicon API 动态获取图标并提供首字母 Fallback。

### 🛠️ 实用工具箱 (8 款全开箱即用)

#### 📦 Ozon 跨境电商刊登工具
- 📄 **Ozon 富内容生成器 (`#/tools/ozon-rich`)**：
  - 粘贴俄文卖点文本，自动识别首个冒号分割标题（保留冒号）与正文，无冒号段落生成纯正文区块。
  - 支持区块可视化增删与微调编辑，输出符合 Ozon 官方规范的 `raTextBlock` JSON (`version: 0.3`)。
- 📊 **Ozon 尺码表生成器 (`#/tools/ozon-size`)**：
  - 支持从 Excel/WPS 直接复制粘贴，智能识别制表符 Tab、`|` 竖线或逗号。
  - 首列支持 `//` 自动拆分主标题与副标题（`[主标签, 副标签]`），数值统一转字符串。
  - 页面内置 **HTML 表格实时可视化预览**，输出符合 Ozon 官方规范的 `tcTable` JSON (`version: 0.1`)。

#### 💻 开发者常用小工具
- ⏱️ **时间戳转换器 (`#/tools/timestamp`)**：
  - 支持秒（10位）与毫秒（13位）自动识别，双向转换为本地时间、UTC 与 ISO 格式。
  - 支持每秒跳动的实时时间戳展示与暂停/恢复，支持一键填入当前时间。
- 📦 **JSON 格式化 / 校验器 (`#/tools/json`)**：
  - 双栏实时排版，2 空格缩进美化，一键复制与单行压缩（Minify）。
  - 语法错误时底部实时弹出温和报错横幅，精确提示错误位置。
- 🎯 **正则表达式测试器 (`#/tools/regex`)**：
  - 支持 Flags 修饰符胶囊勾选（`g`, `i`, `m`, `s`）及常用正则一键预设。
  - 待测文本匹配区域实时背景高亮，结构化展示匹配总数与详细索引列表。
- 🔢 **进制转换器 (`#/tools/base-convert`)**：
  - 二进制、八进制、十进制、十六进制实时同步互转，支持 BigInt 大数精度。
  - 实时非法字符检测与提示，各进制结果独立一键复制。
- 🔤 **URL / Base64 编解码器 (`#/tools/codec`)**：
  - 支持 URL 与 Base64 双向编解码，原生支持 UTF-8 中文无乱码，一键输入输出互换。
- 🛡️ **哈希与 UUID 生成器 (`#/tools/hash`)**：
  - 基于 Web Crypto API 实时计算 MD5/SHA-256/SHA-512，批量定制生成 UUID v4。

---

## 🛠️ 技术栈

- **构建工具**：Vite 6
- **核心框架**：React 18 (函数组件 + Hooks)
- **路由方案**：React Router 6 (使用 `HashRouter` 适配 GitHub Pages 静态部署)
- **样式方案**：纯 CSS (Apple HIG CSS Custom Properties 变量系统)
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
