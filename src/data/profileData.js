/**
 * 个人极客主页、装备库（Uses）、阅读书单与实验室静态数据模型
 */

export const profileHero = {
  name: 'Ly',
  handle: '@liuye28',
  tagline: '专注于高并发架构、JVM 调优与现代全栈工程的技术探索者',
  bio: '热爱优雅的代码架构与极客生产力工具链。深耕分布式系统与高吞吐性能调优，热衷于打磨兼具美感与效能的工程化数字空间。',
  location: 'Hangzhou / Remote, China',
  links: [
    {
      label: 'GitHub',
      url: 'https://github.com/liuye28'
    },
    {
      label: 'Repository',
      url: 'https://github.com/liuye28/ly.github.io'
    },
    {
      label: 'Blog Home',
      url: 'https://liuye28.github.io'
    }
  ]
};

export const hardwareDesk = [
  {
    name: 'MacBook Pro 16"',
    spec: 'Apple M3 Max / 64GB 统一内存 / 2TB SSD',
    category: '计算核心',
    tag: '主力主机',
    desc: '全天候高负载代码编译、微服务容器集群模拟及本地 LLM 实验的核心动力枢纽。'
  },
  {
    name: 'Dell UltraSharp U2723QE',
    spec: '27英寸 4K IPS Black / 98% DCI-P3 / Type-C 90W 反向供电',
    category: '显示设备',
    tag: '视觉中心',
    desc: '出色的色彩还原与极高对比度，超高清细腻字体渲染，单线整合供电与菊花链拓扑。'
  },
  {
    name: 'HHKB Professional HYBRID Type-S',
    spec: '静电容量轴体 / 45g 压力克数 / 经典 60% UNIX 布局',
    category: '输入外设',
    tag: '心流输入',
    desc: '专为 UNIX 哲学设计的 Control 键位布局，静音平滑触感，长久沉浸击键无负担。'
  },
  {
    name: 'Logitech MX Master 3S',
    spec: '8000 DPI 光学传感器 / MagSpeed 电磁滚轮 / 静音微动',
    category: '输入外设',
    tag: '工效利器',
    desc: '人体工学弧度握持，飞速滚动长文代码与文档，多设备跨屏无缝流转。'
  },
  {
    name: 'Sony WH-1000XM5',
    spec: '双芯驱动降噪系统 / LDAC 高清音频 / 30小时续航',
    category: '音频设备',
    tag: '隔音结界',
    desc: '在嘈杂环境中瞬间阻绝环境噪音，构筑深度思考与心流编码的声学护盾。'
  },
  {
    name: '明基 ScreenBar Halo',
    spec: '前后双光源 / 无线旋钮遥控 / 非对称光学设计',
    category: '桌面生态',
    tag: '环境照明',
    desc: '屏幕无反光不刺眼，柔和照亮敲击空间，深夜加班维护视觉舒适度。'
  }
];

export const softwareStack = [
  {
    name: 'IntelliJ IDEA Ultimate',
    category: '开发工具',
    tag: '核心 IDE',
    desc: 'JVM 生态顶级生产力工具，无可匹敌的重构引擎、静态检查与深层调试体验。',
    url: 'https://www.jetbrains.com/idea/'
  },
  {
    name: 'Visual Studio Code',
    category: '开发工具',
    tag: '全栈编辑',
    desc: '现代轻量化前端开发、Markdown 与脚本快速编写的瑞士军刀。',
    url: 'https://code.visualstudio.com/'
  },
  {
    name: 'Raycast',
    category: '效率启动器',
    tag: '指挥中心',
    desc: '新一代 macOS 极客扩展中心，支持极速剪贴板、窗口管理与自研 Script Commands。',
    url: 'https://www.raycast.com/'
  },
  {
    name: 'Warp',
    category: '终端环境',
    tag: '现代终端',
    desc: '基于 Rust 构建的高性能 GPU 终端，支持命令块交互、历史记录分享与智能提示。',
    url: 'https://www.warp.dev/'
  },
  {
    name: 'Obsidian',
    category: '知识管理',
    tag: '第二大脑',
    desc: '基于本地纯文本与 Markdown 双向链接的知识库，助力长青笔记沉淀与图谱探索。',
    url: 'https://obsidian.md/'
  },
  {
    name: 'OrbStack',
    category: '基础设施',
    tag: '极速容器',
    desc: '比 Docker Desktop 更轻、更快、更省电的 macOS 原生容器与轻量 Linux 机器。',
    url: 'https://orbstack.dev/'
  }
];

export const readingList = [
  {
    title: '凤凰架构：构建可靠的大型分布式系统',
    author: '周志明',
    category: '系统架构',
    status: '常读常新',
    rating: 5,
    quote: '从单体到分布式服务集群，系统的设计本质是对复杂性、一致性与可用性的权衡艺术。'
  },
  {
    title: '深入理解 Java 虚拟机（第3版）',
    author: '周志明',
    category: '底层原理',
    status: '常读常新',
    rating: 5,
    quote: '自动内存管理与即时编译技术，在底层默默支撑着现代巨型软件工业的稳健运行。'
  },
  {
    title: 'Redis 设计与实现',
    author: '黄健宏',
    category: '存储与中间件',
    status: '已读完',
    rating: 5,
    quote: '以简洁优雅的 C 语言核心数据结构，极致榨干单线程 CPU 与内存通道吞吐。'
  },
  {
    title: '设计数据密集型应用 (DDIA)',
    author: 'Martin Kleppmann',
    category: '数据架构',
    status: '常读常新',
    rating: 5,
    quote: '硬件不可靠是分布式环境的常态；软件的核心使命是在不可靠的基础之上铸造可靠系统。'
  },
  {
    title: '系统性能调优：方法论与实践',
    author: 'Brendan Gregg',
    category: '性能工程',
    status: '在读中',
    rating: 5,
    quote: '没有科学量化指标与 FlameGraph 剖析的优化尝试，多半只是迷茫的试错。'
  },
  {
    title: '代码整洁之道 (Clean Code)',
    author: 'Robert C. Martin',
    category: '软件素养',
    status: '已读完',
    rating: 4,
    quote: '阅读代码与编写新代码的耗时比往往超过 10 比 1，保持整洁是对未来的敬畏。'
  }
];

export const inspirationNotes = [
  {
    id: 'note-01',
    date: '2026-03-01',
    tag: '架构哲学',
    content: '所有的复杂性都不会凭空消失，它只会被封装、延后或转移。架构师的职责不是消除复杂性，而是决定把复杂性放在何处。'
  },
  {
    id: 'note-02',
    date: '2026-02-15',
    tag: '效能工具',
    content: '优秀的工具链不仅缩短物理等待时间，更重要的是捍卫开发者不被打断的心流状态。指令从敲下到响应的毫秒差距，是创造力流速的标尺。'
  },
  {
    id: 'note-03',
    date: '2026-01-20',
    tag: '工程素养',
    content: '过早优化往往是陷阱，但对基础数据结构与时空复杂度的漠不关心则是平庸代码的根源。稳健来自严谨的边界审视。'
  }
];

export const labQuotes = [
  {
    author: 'Linus Torvalds',
    quote: 'Talk is cheap. Show me the code.',
    field: '开源与操作系统'
  },
  {
    author: 'Donald Knuth',
    quote: 'Premature optimization is the root of all evil.',
    field: '算法与理论计算'
  },
  {
    author: 'Alan Kay',
    quote: 'The best way to predict the future is to invent it.',
    field: '人机交互'
  },
  {
    author: 'Ken Thompson',
    quote: 'You can’t trust code that you did not totally create yourself.',
    field: 'Unix 与系统安全'
  },
  {
    author: 'Martin Fowler',
    quote: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    field: '软件设计与重构'
  },
  {
    author: 'Rich Hickey',
    quote: 'Simplicity is prerequisite for reliability.',
    field: '编程语言设计'
  }
];
