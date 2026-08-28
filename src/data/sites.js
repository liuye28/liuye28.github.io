/**
 * 导航站分类列表 (程序员精选分类)
 */
export const categories = [
  "全部",
  "AI 助手",
  "代码托管/平台",
  "技术社区/资讯",
  "官方文档/生态",
  "前端/UI组件库",
  "在线查阅/提效",
  "邮箱/工作协同"
];

/**
 * 程序员常用网站数据精选库
 */
export const sites = [
  // ==================== 1. AI 助手 ====================
  {
    name: "Claude",
    url: "https://claude.ai",
    category: "AI 助手",
    desc: "Anthropic 出品的超强编程、长上下文与逻辑推理 AI 助手"
  },
  {
    name: "ChatGPT",
    url: "https://chatgpt.com",
    category: "AI 助手",
    desc: "OpenAI 出品的通用人工智能对话与全能代码生成工具"
  },
  {
    name: "Gemini",
    url: "https://gemini.google.com",
    category: "AI 助手",
    desc: "Google 出品的多模态大型语言模型与智能助手"
  },
  {
    name: "DeepSeek",
    url: "https://chat.deepseek.com",
    category: "AI 助手",
    desc: "深度求索开源深度思考与代码推理大模型，支持 R1 满血版"
  },
  {
    name: "Grok",
    url: "https://grok.com",
    category: "AI 助手",
    desc: "xAI 出品的实时资讯洞察与全能 AI 助手"
  },
  {
    name: "Cursor",
    url: "https://www.cursor.com",
    category: "AI 助手",
    desc: "新一代 AI 原生智能代码编辑器，基于 VS Code 打造"
  },
  {
    name: "v0 by Vercel",
    url: "https://v0.dev",
    category: "AI 助手",
    desc: "通过自然语言生成可直接使用的 React / Tailwind 前端 UI"
  },
  {
    name: "Hugging Face",
    url: "https://huggingface.co",
    category: "AI 助手",
    desc: "全球最大开源机器学习模型、数据集与 Space 体验社区"
  },
  {
    name: "Kimi",
    url: "https://kimi.moonshot.cn",
    category: "AI 助手",
    desc: "月之暗面长文本深度分析与多格式资料解析 AI 助手"
  },

  // ==================== 2. 代码托管 / 开发平台 ====================
  {
    name: "GitHub",
    url: "https://github.com",
    category: "代码托管/平台",
    desc: "全球最大开源代码托管、协作与开发者社交平台"
  },
  {
    name: "Gitee",
    url: "https://gitee.com",
    category: "代码托管/平台",
    desc: "开源中国旗下国内领先的代码托管与 DevOps 研发平台"
  },
  {
    name: "GitLab",
    url: "https://gitlab.com",
    category: "代码托管/平台",
    desc: "一体化 DevOps 生命周期管理平台与企业级 Git 仓库托管"
  },
  {
    name: "Vercel",
    url: "https://vercel.com",
    category: "代码托管/平台",
    desc: "面向前端团队的极速云部署平台，Next.js 官方母公司"
  },
  {
    name: "Docker Hub",
    url: "https://hub.docker.com",
    category: "代码托管/平台",
    desc: "全球最大的容器镜像官方公共存储库与分发中心"
  },
  {
    name: "npm",
    url: "https://www.npmjs.com",
    category: "代码托管/平台",
    desc: "Node.js 官方包管理器与 JavaScript 开源模块注册表"
  },

  // ==================== 3. 技术社区 / 问答资讯 ====================
  {
    name: "Stack Overflow",
    url: "https://stackoverflow.com",
    category: "技术社区/资讯",
    desc: "全球最大的程序员技术问答与编程疑难排查社区"
  },
  {
    name: "稀土掘金",
    url: "https://juejin.cn",
    category: "技术社区/资讯",
    desc: "面向开发者的优质中文技术交流与实战干货分享社区"
  },
  {
    name: "V2EX",
    url: "https://www.v2ex.com",
    category: "技术社区/资讯",
    desc: "创意工作者、极客与程序员热门交流讨论社区"
  },
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com",
    category: "技术社区/资讯",
    desc: "Y Combinator 旗下极客创业、前沿技术与计算机科学资讯"
  },
  {
    name: "博客园",
    url: "https://www.cnblogs.com",
    category: "技术社区/资讯",
    desc: "国内历史悠久的专业开发者技术博客与知识分享社区"
  },
  {
    name: "知乎",
    url: "https://www.zhihu.com",
    category: "技术社区/资讯",
    desc: "高质量中文问答社区与专业技术专栏聚集地"
  },
  {
    name: "Dev.to",
    url: "https://dev.to",
    category: "技术社区/资讯",
    desc: "国际化软件开发者建设性分享与交流成长社区"
  },

  // ==================== 4. 官方文档 / 语言生态 ====================
  {
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    category: "官方文档/生态",
    desc: "权威详尽的 Web 前端标准、HTML/CSS/JS 核心参考手册"
  },
  {
    name: "React 官方文档",
    url: "https://react.dev",
    category: "官方文档/生态",
    desc: "现代 React Hooks、组件化与核心概念官方最新文档"
  },
  {
    name: "Vue.js 官网",
    url: "https://vuejs.org",
    category: "官方文档/生态",
    desc: "渐进式 JavaScript 框架中文文档与响应式生态指南"
  },
  {
    name: "Spring Framework",
    url: "https://spring.io",
    category: "官方文档/生态",
    desc: "Java 企业级开发第一框架 Spring Boot 与 Spring Cloud 官方生态"
  },
  {
    name: "Go 语言官网",
    url: "https://go.dev",
    category: "官方文档/生态",
    desc: "Google Go (Golang) 官方文档、包检索与标准库手册"
  },
  {
    name: "TypeScript",
    url: "https://www.typescriptlang.org",
    category: "官方文档/生态",
    desc: "带类型的 JavaScript 超集官方手册与交互式演练场"
  },
  {
    name: "Rust 官网",
    url: "https://www.rust-lang.org",
    category: "官方文档/生态",
    desc: "注重极致安全与并发性能的系统级编程语言官方教程"
  },
  {
    name: "Python 官方文档",
    url: "https://docs.python.org/3/",
    category: "官方文档/生态",
    desc: "Python 3 官方标准库查阅与语言规范指南"
  },
  {
    name: "Node.js 官网",
    url: "https://nodejs.org",
    category: "官方文档/生态",
    desc: "基于 Chrome V8 引擎的 JavaScript 运行时官方 API 与动态"
  },

  // ==================== 5. 前端 / UI 组件库 ====================
  {
    name: "Element Plus",
    url: "https://element-plus.org",
    category: "前端/UI组件库",
    desc: "基于 Vue 3 的高质量企业级桌面端 UI 组件库"
  },
  {
    name: "Ant Design",
    url: "https://ant.design",
    category: "前端/UI组件库",
    desc: "蚂蚁金服企业级设计体系与 React 经典 UI 组件库"
  },
  {
    name: "Tailwind CSS",
    url: "https://tailwindcss.com",
    category: "前端/UI组件库",
    desc: "实用优先、极速构建现代界面的原子化 CSS 样式框架"
  },
  {
    name: "Shadcn UI",
    url: "https://ui.shadcn.com",
    category: "前端/UI组件库",
    desc: "精美现代、可定制且无黑盒封装的 React 组件精选集"
  },
  {
    name: "Lucide Icons",
    url: "https://lucide.dev",
    category: "前端/UI组件库",
    desc: "优美一致、开箱即用的现代开源矢量图标库"
  },
  {
    name: "UIverse",
    url: "https://uiverse.io",
    category: "前端/UI组件库",
    desc: "社区驱动的纯 CSS 按钮、卡片、加载动效与 UI 元素库"
  },
  {
    name: "Apache ECharts",
    url: "https://echarts.apache.org",
    category: "前端/UI组件库",
    desc: "强大商业级数据可视化图表库，涵盖折线/柱状/地图等"
  },

  // ==================== 6. 在线查阅 / 提效工具 ====================
  {
    name: "Can I Use",
    url: "https://caniuse.com",
    category: "在线查阅/提效",
    desc: "前端 HTML5/CSS3/JS 浏览器兼容性与支持度实时数据库"
  },
  {
    name: "Bundlephobia",
    url: "https://bundlephobia.com",
    category: "在线查阅/提效",
    desc: "查询 npm 第三方依赖包的打包体积与依赖导出分析"
  },
  {
    name: "Regex101",
    url: "https://regex101.com",
    category: "在线查阅/提效",
    desc: "全球最强大的多语言在线正则表达式测试与语法深度解析"
  },
  {
    name: "CyberChef",
    url: "https://cyberchef.io",
    category: "在线查阅/提效",
    desc: "网络安全瑞士军刀：多格式编解码、加解密与数据清洗分析"
  },
  {
    name: "Carbon",
    url: "https://carbon.now.sh",
    category: "在线查阅/提效",
    desc: "生成并分享优雅高级、带 macOS 边框的代码截图工具"
  },
  {
    name: "TinyPNG",
    url: "https://tinypng.com",
    category: "在线查阅/提效",
    desc: "智能 WebP / PNG / JPEG 在线图片无损批量压缩工具"
  },
  {
    name: "draw.io",
    url: "https://app.diagrams.net",
    category: "在线查阅/提效",
    desc: "完全免费且强大的开源架构图、UML 与流程图在线绘制工具"
  },
  {
    name: "ProcessOn",
    url: "https://www.processon.com",
    category: "在线查阅/提效",
    desc: "专业在线作图工具，支持思维导图、流程图与原型设计协作"
  },
  {
    name: "Crontab Guru",
    url: "https://crontab.guru",
    category: "在线查阅/提效",
    desc: "Linux Cron 定时任务表达式实时解析与可视化编辑器"
  },

  // ==================== 7. 常用邮箱 / 工作协同 ====================
  {
    name: "Gmail",
    url: "https://mail.google.com",
    category: "邮箱/工作协同",
    desc: "Google 官方电子邮箱服务，安全高效、垃圾邮件过滤强大"
  },
  {
    name: "网易 163 邮箱",
    url: "https://mail.163.com",
    category: "邮箱/工作协同",
    desc: "网易经典免费电子邮箱，国内主流邮箱服务"
  },
  {
    name: "QQ 邮箱",
    url: "https://mail.qq.com",
    category: "邮箱/工作协同",
    desc: "腾讯旗下大容量电子邮箱，集成微信与 QQ 快捷提醒"
  },
  {
    name: "Outlook",
    url: "https://outlook.live.com",
    category: "邮箱/工作协同",
    desc: "微软官方邮件与日历日程管理云服务"
  },
  {
    name: "Notion",
    url: "https://www.notion.so",
    category: "邮箱/工作协同",
    desc: "多合一笔记、文档知识库与团队项目协作工作空间"
  },
  {
    name: "飞书",
    url: "https://www.feishu.cn",
    category: "邮箱/工作协同",
    desc: "字节跳动旗下先进的一站式办公协作与文档管理平台"
  }
];
