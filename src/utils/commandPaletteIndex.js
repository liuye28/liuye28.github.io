/**
 * 全局 Command Palette 数据索引与加权检索引擎
 *
 * 聚合四大核心领域数据：
 * 1. 系统级快捷动作 (System Actions)
 * 2. 19 款实用离线小工具 (Tools)
 * 3. 7 篇技术速查备忘录与高频实战小节 (Cheatsheets)
 * 4. 程序员精选常用网站导航 (Sites)
 */

import { tools } from '../data/tools.js';
import { sites } from '../data/sites.js';
import { safeGetJSON, safeSetJSON } from './storage.js';

export const STORAGE_KEY_RECENTS = 'recent_palette_commands';

// 常用工具预置拼音与英文关键词别名字典
const TOOL_KEYWORDS = {
  'diff': ['diff', 'bijiao', 'duibi', 'monaco', 'text', 'code', 'contrast'],
  'cron': ['cron', 'dingren', 'shijian', 'linux', 'spring', 'schedule'],
  'sql-to-pojo': ['sql', 'pojo', 'mybatis', 'ddl', 'mysql', 'entity', 'mapper', 'table'],
  'json-to-java': ['json', 'java', 'pojo', 'lombok', 'jackson', 'bean'],
  'json': ['json', 'format', 'geshihua', 'validate', 'jiaoyan', 'beautify'],
  'timestamp': ['timestamp', 'shijianchuo', 'unix', 'time', 'date', 'utc'],
  'regex': ['regex', 'zhengze', 'test', 'ce shi', 'match', 'pattern'],
  'curl': ['curl', 'http', 'fetch', 'resttemplate', 'okhttp', 'client'],
  'ip-check': ['ip', 'ip-check', 'ipcheck', 'chaxun', 'tijian', 'guishu', 'risk', 'proxy', 'hosting', 'jifang', 'zhuzhai', 'asn', 'network', 'chundu'],
  'codec': ['codec', 'base64', 'url', 'bianma', 'jiema', 'utf8'],
  'jwt': ['jwt', 'token', 'decode', 'claim', 'header', 'payload'],
  'base-convert': ['base', 'jinzhi', 'binary', 'hex', 'octal', 'decimal', 'zhuanhuan'],
  'hash': ['hash', 'md5', 'sha256', 'uuid', 'jia mi', 'crypto'],
  'code-pad': ['code', 'pad', 'daima', 'lianxi', 'scratch', 'snippet'],
  'scratchpad': ['notes', 'bianqian', 'memo', 'scratchpad', 'jishi', 'apple'],
  'zen-focus': ['pomodoro', 'fanqie', 'focus', 'clock', 'audio', 'zhuanzhu'],
  'ozon-rich': ['ozon', 'rich', 'fuwenben', 'kuajing', 'e-commerce', 'ru'],
  'ozon-size': ['ozon', 'size', 'chimabiao', 'table', 'excel', 'kuajing'],
  'ozon-calc': ['ozon', 'calc', 'lirun', 'dingjia', 'jisuanqi', 'rub', 'logistics']
};

// 7 大技术速查精选条目
const CHEATSHEET_ENTRIES = [
  {
    id: 'cs-java',
    title: 'Java 核心与 Stream 流式算子速查',
    subtitle: 'Stream 过滤/归约/收集、Optional 防空规范与 Java 17/21 现代语法糖',
    category: '技术速查',
    icon: '☕',
    hash: 'java',
    keywords: ['java', 'stream', 'optional', 'jdk', 'syntax', 'collect', 'lambda']
  },
  {
    id: 'cs-jvm',
    title: 'JVM 调优参数与 OOM 排障流程',
    subtitle: '生产推荐启动参数、jstack/jmap/jstat 四剑客与堆内存排查黄金流程',
    category: '技术速查',
    icon: '⚙️',
    hash: 'jvm',
    keywords: ['jvm', 'oom', 'gc', 'jstack', 'jmap', 'dump', 'memory', 'performance']
  },
  {
    id: 'cs-spring',
    title: 'Spring Boot 机制与事务失效八大陷阱',
    subtitle: '核心注解全景、Bean 生命周期与 @Transactional 事务失效场景深度拆解',
    category: '技术速查',
    icon: '🍃',
    hash: 'spring',
    keywords: ['spring', 'boot', 'transactional', 'shiwu', 'bean', 'ioc', 'aop']
  },
  {
    id: 'cs-redis',
    title: 'Redis 机制与缓存三灾 (穿透/击穿/雪崩)',
    subtitle: '五大数据结构核心命令、分布式锁三大原则与缓存异常针对性治理',
    category: '技术速查',
    icon: '⚡',
    hash: 'redis',
    keywords: ['redis', 'cache', 'huancun', 'chuangtou', 'jichuan', 'xuebeng', 'lock']
  },
  {
    id: 'cs-docker',
    title: 'Docker & Compose 生产运维速查',
    subtitle: '容器生命周期、资源限制与实战 YAML 生产编排模板',
    category: '技术速查',
    icon: '🐳',
    hash: 'docker',
    keywords: ['docker', 'compose', 'container', 'rongqi', 'yaml', 'devops']
  },
  {
    id: 'cs-git',
    title: 'Git 紧急撤销与时光机救急锦囊',
    subtitle: '紧急撤销 commit、暂存区找回、变基操作与 reflog 时光机',
    category: '技术速查',
    icon: '🌿',
    hash: 'git',
    keywords: ['git', 'rebase', 'reset', 'reflog', 'commit', 'branch', 'chexiao']
  },
  {
    id: 'cs-linux',
    title: 'Linux 性能诊断与排障四大件',
    subtitle: 'CPU、内存、磁盘 I/O 及网络四大维度的即时定位排障命令',
    category: '技术速查',
    icon: '🐧',
    hash: 'linux',
    keywords: ['linux', 'cpu', 'memory', 'disk', 'io', 'netstat', 'top', 'sar']
  }
];

/**
 * 构造全量命令条目集
 *
 * @param {object} helpers 动作辅助函数 (navigate, toggleTheme, openTerminal, triggerMatrix, exportBackup, closePalette)
 * @returns {Array<object>}
 */
export function buildAllCommands(helpers = {}) {
  const {
    navigate = () => {},
    toggleTheme = () => {},
    openTerminal = () => {},
    triggerMatrix = () => {},
    exportBackup = () => {},
    lockSite = () => {},
    closePalette = () => {}
  } = helpers;

  const commands = [];

  // 1. 系统级快捷动作
  commands.push(
    {
      id: 'act-theme',
      title: '切换深色 / 浅色外观模式',
      subtitle: '即时在 Dark Mode 与 Light Mode 之间切换外观',
      category: '系统动作',
      icon: '🌓',
      keywords: ['theme', 'dark', 'light', 'zhuti', 'waiguan', 'color', 'mode'],
      shortcutHint: '系统动作',
      action: () => {
        toggleTheme();
        closePalette();
      }
    },
    {
      id: 'act-lock',
      title: '立即锁定网站 (Lock Screen)',
      subtitle: '锁住当前网页，需输入访问密码方可继续访问',
      category: '系统动作',
      icon: '🔒',
      keywords: ['lock', 'suo', 'suoding', 'password', 'mima', 'screen', 'security', 'fangwen'],
      shortcutHint: '安全动作',
      action: () => {
        closePalette();
        lockSite();
      }
    },
    {
      id: 'act-settings',
      title: '系统设置与数据中心',
      subtitle: '查看 PWA 状态、存储配额分析与全站数据备份',
      category: '系统动作',
      icon: '⚙️',
      keywords: ['settings', 'shezhi', 'backup', 'data', 'peizhi', 'pwa'],
      shortcutHint: '回车直达',
      action: () => {
        navigate('/settings');
        closePalette();
      }
    },
    {
      id: 'act-backup',
      title: '导出全站完整备份快照 (JSON)',
      subtitle: '将便签、代码草稿与偏好打包导出并下载',
      category: '系统动作',
      icon: '💾',
      keywords: ['backup', 'export', 'beifen', 'daochu', 'json', 'snapshot'],
      shortcutHint: '系统动作',
      action: () => {
        exportBackup();
        closePalette();
      }
    },
    {
      id: 'act-terminal',
      title: '唤起极客 Web 终端浮层',
      subtitle: '支持命令行快捷直达与彩蛋命令 (快捷键 `)',
      category: '系统动作',
      icon: '💻',
      keywords: ['terminal', 'zhongduan', 'cli', 'shell', 'bash', 'console'],
      shortcutHint: '系统动作',
      action: () => {
        closePalette();
        openTerminal();
      }
    },
    {
      id: 'act-matrix',
      title: '黑客帝国全屏代码雨特效 (Matrix)',
      subtitle: '触发极客全屏 Canvas 绿色流光瀑布动画',
      category: '系统动作',
      icon: '🟢',
      keywords: ['matrix', 'daimayu', 'heike', 'rain', 'easter', 'caidan'],
      shortcutHint: '彩蛋特效',
      action: () => {
        closePalette();
        triggerMatrix();
      }
    },
    {
      id: 'act-home',
      title: '返回常用网站导航首页',
      subtitle: '直达首页网站分类与便捷检索卡片',
      category: '系统动作',
      icon: '🧭',
      keywords: ['home', 'shouye', 'nav', 'daohang', 'sites', 'wangzhan'],
      shortcutHint: '回车直达',
      action: () => {
        navigate('/');
        closePalette();
      }
    }
  );

  // 2. 实用小工具
  tools.forEach((tool) => {
    const extraKeywords = TOOL_KEYWORDS[tool.id] || [];
    commands.push({
      id: `tool-${tool.id}`,
      title: tool.name,
      subtitle: tool.desc,
      category: '实用工具',
      icon: '🛠️',
      keywords: [tool.id, tool.category, ...extraKeywords],
      shortcutHint: '回车直达',
      action: () => {
        navigate(tool.path);
        closePalette();
      }
    });
  });

  // 3. 技术速查备忘录
  CHEATSHEET_ENTRIES.forEach((cs) => {
    commands.push({
      id: cs.id,
      title: cs.title,
      subtitle: cs.subtitle,
      category: '技术速查',
      icon: cs.icon,
      keywords: cs.keywords,
      shortcutHint: '回车直达',
      action: () => {
        navigate('/cheatsheet');
        closePalette();
      }
    });
  });

  // 4. 精选常用网站
  sites.forEach((site) => {
    commands.push({
      id: `site-${site.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: site.name,
      subtitle: site.desc,
      category: '常用网站',
      icon: '🌐',
      keywords: [site.name.toLowerCase(), site.category, ...(site.url ? [site.url] : [])],
      shortcutHint: '外链 ↗',
      action: () => {
        window.open(site.url, '_blank', 'noopener,noreferrer');
        closePalette();
      }
    });
  });

  return commands;
}

/**
 * 获取最近使用过的命令 ID 列表
 * @returns {string[]}
 */
export function getRecentCommandIds() {
  const ids = safeGetJSON(STORAGE_KEY_RECENTS, []);
  return Array.isArray(ids) ? ids : [];
}

/**
 * 记录一次命令执行历史并置顶
 * @param {string} cmdId 命令 ID
 * @param {number} [maxCount=5] 最大存储记录数
 */
export function recordRecentCommand(cmdId, maxCount = 5) {
  if (!cmdId || typeof cmdId !== 'string') return;
  const realId = cmdId.startsWith('recent-') ? cmdId.replace(/^recent-/, '') : cmdId;
  const current = getRecentCommandIds();
  const next = [realId, ...current.filter((id) => id !== realId)].slice(0, maxCount);
  safeSetJSON(STORAGE_KEY_RECENTS, next);
}

/**
 * 清空所有最近使用历史记录
 */
export function clearRecentCommands() {
  safeSetJSON(STORAGE_KEY_RECENTS, []);
}

/**
 * 搜索关键词高亮拆分纯函数
 *
 * @param {string} text 待高亮渲染的原始文本
 * @param {string} query 当前搜索关键词
 * @returns {Array<{ text: string, isMatch: boolean }>}
 */
export function highlightMatches(text, query) {
  if (!text) return [];
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [{ text, isMatch: false }];
  }

  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === q.toLowerCase()
    }));
}

/**
 * 获得空输入状态下的高频默认推荐集（包含最近使用记录）
 *
 * @param {Array<object>} allCommands
 * @param {Array<string>|null} [recentIds=null]
 * @returns {Array<object>}
 */
export function getDefaultCommands(allCommands, recentIds = null) {
  const ids = recentIds !== null ? recentIds : getRecentCommandIds();
  const recentCommands = [];

  if (Array.isArray(ids) && ids.length > 0) {
    ids.forEach((id) => {
      const match = allCommands.find((c) => c.id === id);
      if (match) {
        recentCommands.push({
          ...match,
          id: `recent-${match.id}`,
          category: '最近使用',
          shortcutHint: '回车执行'
        });
      }
    });
  }

  // 推荐：高频系统动作 + 5 款代表性小工具
  const topActionIds = ['act-theme', 'act-lock', 'act-settings', 'act-backup'];
  const topToolIds = ['tool-diff', 'tool-cron', 'tool-json', 'tool-timestamp', 'tool-scratchpad'];

  const actions = allCommands.filter((c) => topActionIds.includes(c.id));
  const toolsList = allCommands.filter((c) => topToolIds.includes(c.id));

  return [...recentCommands, ...actions, ...toolsList];
}

/**
 * 执行加权多字段模糊检索
 *
 * @param {string} query 搜索词
 * @param {Array<object>} allCommands 全量命令集合
 * @param {Array<string>|null} [recentIds=null]
 * @returns {Array<object>} 过滤与排序后的匹配命令列表
 */
export function searchCommands(query, allCommands, recentIds = null) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return getDefaultCommands(allCommands, recentIds);
  }

  const q = query.trim().toLowerCase();
  const scored = [];

  allCommands.forEach((cmd) => {
    let score = 0;
    const titleLower = cmd.title.toLowerCase();
    const subLower = (cmd.subtitle || '').toLowerCase();

    // 1. 标题权重
    if (titleLower === q) {
      score += 100;
    } else if (titleLower.startsWith(q)) {
      score += 80;
    } else if (titleLower.includes(q)) {
      score += 50;
    }

    // 2. 关键词与别名命中权重
    if (cmd.keywords && Array.isArray(cmd.keywords)) {
      for (const kw of cmd.keywords) {
        const kwLower = kw.toLowerCase();
        if (kwLower === q) {
          score += 70;
          break;
        } else if (kwLower.startsWith(q)) {
          score += 45;
          break;
        } else if (kwLower.includes(q)) {
          score += 30;
          break;
        }
      }
    }

    // 3. 描述与副标题权重
    if (subLower.includes(q)) {
      score += 20;
    }

    // 4. 分类权重微调
    if (cmd.category.toLowerCase().includes(q)) {
      score += 15;
    }

    if (score > 0) {
      scored.push({ ...cmd, _score: score });
    }
  });

  // 按得分从高到低排序；相同得分按分类顺序
  const categoryOrder = { '系统动作': 1, '实用工具': 2, '技术速查': 3, '常用网站': 4 };
  scored.sort((a, b) => {
    if (b._score !== a._score) {
      return b._score - a._score;
    }
    const orderA = categoryOrder[a.category] || 99;
    const orderB = categoryOrder[b.category] || 99;
    return orderA - orderB;
  });

  return scored;
}
