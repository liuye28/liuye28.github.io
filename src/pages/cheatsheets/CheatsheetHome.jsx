import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import Header from '../../components/Header';
import usePageTitle from '../../hooks/usePageTitle';
import './CheatsheetHome.css';

// 纯静态 Markdown 内容引入 (借助 Vite ?raw 语法，零后端，打包时直接内联)
import javaMd from '../../data/cheatsheets/java.md?raw';
import jvmMd from '../../data/cheatsheets/jvm.md?raw';
import springMd from '../../data/cheatsheets/spring.md?raw';
import redisMd from '../../data/cheatsheets/redis.md?raw';
import dockerMd from '../../data/cheatsheets/docker.md?raw';
import gitMd from '../../data/cheatsheets/git.md?raw';
import linuxMd from '../../data/cheatsheets/linux.md?raw';

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

const CHEATSHEETS = [
  {
    id: 'java',
    title: 'Java 核心与 Stream 速查',
    category: '后端开发',
    desc: 'Stream 高频流式操作、Optional 防空实践与 Java 17/21 现代语法糖',
    icon: '☕',
    content: javaMd,
  },
  {
    id: 'jvm',
    title: 'JVM 调优与排障速查',
    category: '架构与性能',
    desc: '生产推荐启动参数、jstack/jmap/jstat 四剑客与 OOM 排查思路',
    icon: '⚙️',
    content: jvmMd,
  },
  {
    id: 'spring',
    title: 'Spring Boot 与事务陷阱',
    category: '后端开发',
    desc: '核心注解全景、Bean 扩展点与 @Transactional 事务失效八大场景',
    icon: '🍃',
    content: springMd,
  },
  {
    id: 'redis',
    title: 'Redis 机制与缓存三灾',
    category: '架构与性能',
    desc: '五大数据结构命令、分布式锁要点及穿透/击穿/雪崩对策',
    icon: '⚡',
    content: redisMd,
  },
  {
    id: 'docker',
    title: 'Docker & Compose 运维速查',
    category: '运维部署',
    desc: '容器生命周期、性能限制、日志追踪与 Compose 模板',
    icon: '🐳',
    content: dockerMd,
  },
  {
    id: 'git',
    title: 'Git 撤销回滚与分支拯救',
    category: '常用工具',
    desc: '撤销 commit、暂存区找回、变基与 reflog 时光机救急',
    icon: '🌿',
    content: gitMd,
  },
  {
    id: 'linux',
    title: 'Linux 生产性能诊断三板斧',
    category: '运维部署',
    desc: 'CPU、内存、磁盘 I/O 及网络四大维度的快速定位命令',
    icon: '🐧',
    content: linuxMd,
  },
];

/**
 * 极简技术速查备忘录首页组件
 */
export default function CheatsheetHome() {
  const [selectedId, setSelectedId] = useState('java');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // 根据当前选中的技术卡片动态更新标题
  const activeSheet = useMemo(() => CHEATSHEETS.find((s) => s.id === selectedId), [selectedId]);
  usePageTitle(activeSheet ? `${activeSheet.title} - 技术备忘录` : '技术速查备忘录');

  // 检索过滤备忘录目录
  const filteredSheets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CHEATSHEETS;
    return CHEATSHEETS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // 当前激活的文档
  const currentSheet = useMemo(() => {
    return CHEATSHEETS.find((s) => s.id === selectedId) || CHEATSHEETS[0];
  }, [selectedId]);

  // 将 Markdown 解析为纯 HTML
  const renderedHtml = useMemo(() => {
    if (!currentSheet || !currentSheet.content) return '';
    return marked.parse(currentSheet.content);
  }, [currentSheet]);

  const handleCopyMarkdown = () => {
    if (!currentSheet) return;
    navigator.clipboard.writeText(currentSheet.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        <Header />

        <div className="cheatsheet-container">
          {/* 左侧：分类与文档列表导引 */}
          <aside className="cheatsheet-sidebar">
            <input
              type="text"
              className="cheatsheet-search-input"
              placeholder="搜索速查知识点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="搜索速查知识点"
            />

            <div className="cheatsheet-nav-list">
              {filteredSheets.length > 0 ? (
                filteredSheets.map((sheet) => {
                  const isActive = sheet.id === currentSheet.id;
                  return (
                    <button
                      key={sheet.id}
                      type="button"
                      className={`cheatsheet-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedId(sheet.id)}
                    >
                      <span className="cheatsheet-nav-icon">{sheet.icon}</span>
                      <div className="cheatsheet-nav-info">
                        <span className="cheatsheet-nav-title">{sheet.title}</span>
                        <span className="cheatsheet-nav-category">{sheet.category}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.825rem' }}>
                  未找到匹配条目
                </div>
              )}
            </div>
          </aside>

          {/* 右侧：Markdown 沉浸式阅读区域 */}
          <section className="cheatsheet-content-card">
            <div className="cheatsheet-header-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="cheatsheet-badge">
                  {currentSheet.icon} {currentSheet.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  纯静态 Markdown 驱动 · 随查随用
                </span>
              </div>

              <button
                type="button"
                className={`apple-btn apple-btn-secondary apple-btn-sm ${copied ? 'active' : ''}`}
                onClick={handleCopyMarkdown}
                title="复制整篇 Markdown 源码"
              >
                {copied ? '✓ 已复制 Markdown' : '复制整篇 Markdown'}
              </button>
            </div>

            {/* Markdown 渲染注入区 */}
            <article
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </section>
        </div>

        <footer className="apple-footer">
          <p>Ly · 极简技术速查备忘录</p>
        </footer>
      </div>
    </main>
  );
}
