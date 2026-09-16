import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildAllCommands,
  searchCommands,
  highlightMatches,
  recordRecentCommand,
  getRecentCommandIds,
  clearRecentCommands
} from '../utils/commandPaletteIndex.js';
import { exportBackup } from '../utils/backupManager.js';
import { safeSetJSON } from '../utils/storage.js';
import { lockSite } from '../utils/siteLock.js';
import './CommandPalette.css';

/**
 * 搜索关键词高亮渲染辅助组件
 */
function HighlightedText({ text, query }) {
  const parts = useMemo(() => highlightMatches(text, query), [text, query]);
  if (!query || !query.trim() || !text) return text || '';

  return (
    <>
      {parts.map((part, index) =>
        part.isMatch ? (
          <mark key={index} className="command-highlight">
            {part.text}
          </mark>
        ) : (
          part.text
        )
      )}
    </>
  );
}

/**
 * Apple HIG / Raycast 风格全局 Command Palette 组件
 */
export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentsVersion, setRecentsVersion] = useState(0);

  const inputRef = useRef(null);
  const activeItemRef = useRef(null);
  const navigate = useNavigate();

  // 读取最新最近命令 ID 列表
  const recentIds = useMemo(() => {
    return getRecentCommandIds();
  }, [recentsVersion, isOpen]);

  // 主题切换辅助逻辑
  const handleToggleTheme = useCallback(() => {
    if (typeof document === 'undefined') return;
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    safeSetJSON('theme_pref', { theme: next, manual: true });
  }, []);

  // 动作辅助执行环境
  const helpers = useMemo(
    () => ({
      navigate: (path) => navigate(path),
      toggleTheme: handleToggleTheme,
      openTerminal: () => {
        if (typeof window !== 'undefined') {
          window.toggleWebTerminal?.();
        }
      },
      triggerMatrix: () => {
        if (typeof window !== 'undefined') {
          // 打开终端并执行代码雨
          window.toggleWebTerminal?.();
        }
      },
      exportBackup: () => exportBackup(),
      lockSite: () => lockSite(),
      closePalette: () => setIsOpen(false)
    }),
    [navigate, handleToggleTheme]
  );

  // 预编译全量命令索引
  const allCommands = useMemo(() => buildAllCommands(helpers), [helpers]);

  // 过滤与加权排序匹配结果（空查询时融入最近使用历史）
  const filteredCommands = useMemo(
    () => searchCommands(query, allCommands, recentIds),
    [query, allCommands, recentIds]
  );

  // 执行命令并记录到最近使用历史
  const handleExecuteCommand = useCallback(
    (cmd) => {
      if (!cmd) return;
      recordRecentCommand(cmd.id);
      setRecentsVersion((v) => v + 1);
      if (cmd.action) {
        cmd.action(helpers);
      }
    },
    [helpers]
  );

  // 清空最近使用历史
  const handleClearRecents = useCallback(() => {
    clearRecentCommands();
    setRecentsVersion((v) => v + 1);
  }, []);

  // 每次查询词变更，重置高亮索引到第一条
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // 唤起与关闭时自动聚焦及锁定背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setActiveIndex(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 视口自动瞬时对齐高亮条目 (auto 消除 smooth 的快速连按帧积压)
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'auto'
      });
    }
  }, [activeIndex]);

  // 全局快捷键调度与编程式方法挂载 (⌘K / Ctrl+K)
  useEffect(() => {
    window.toggleCommandPalette = () => {
      setIsOpen((prev) => !prev);
    };
    window.openCommandPalette = () => {
      setIsOpen(true);
    };

    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      delete window.toggleCommandPalette;
      delete window.openCommandPalette;
    };
  }, [isOpen]);

  // 键盘方向键与回车事件处理
  const handleKeyDown = (e) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[activeIndex];
      if (selected) {
        handleExecuteCommand(selected);
      }
    }
  };

  if (!isOpen) return null;

  // 按分类对过滤结果进行分组渲染
  const categoryOrder = ['最近使用', '系统动作', '实用工具', '技术速查', '常用网站'];
  const grouped = {};
  categoryOrder.forEach((cat) => {
    grouped[cat] = [];
  });

  filteredCommands.forEach((cmd, index) => {
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = [];
    }
    grouped[cmd.category].push({ cmd, flatIndex: index });
  });

  return (
    <div
      className="command-palette-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="全局命令检索面板"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="command-palette-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部搜索框栏 */}
        <div className="command-input-container">
          <svg
            className="command-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索小工具、常用网站、技术速查或系统动作..."
            className="command-input"
          />
          <span className="command-input-badge" title="按 ESC 键退出">
            ESC
          </span>
        </div>

        {/* 结果列表区 */}
        <div className="command-results-list" role="listbox">
          {filteredCommands.length === 0 ? (
            <div className="command-empty-state">
              <span className="command-empty-icon">🔍</span>
              <span>未找到与 "{query}" 相关的工具、动作或网站</span>
            </div>
          ) : (
            categoryOrder.map((cat) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;

              return (
                <div key={cat} className="command-group-section">
                  <div className="command-group-title">
                    <span>{cat} · {items.length}</span>
                    {cat === '最近使用' && (
                      <button
                        type="button"
                        className="command-clear-recents-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearRecents();
                        }}
                        title="清空最近使用历史"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  {items.map(({ cmd, flatIndex }) => {
                    const isActive = flatIndex === activeIndex;

                    return (
                      <div
                        key={cmd.id}
                        ref={isActive ? activeItemRef : null}
                        role="option"
                        aria-selected={isActive}
                        className={`command-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleExecuteCommand(cmd)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                      >
                        <div className="command-item-left">
                          <span className="command-item-icon">{cmd.icon}</span>
                          <div className="command-item-text">
                            <span className="command-item-title">
                              <HighlightedText text={cmd.title} query={query} />
                            </span>
                            {cmd.subtitle && (
                              <span className="command-item-subtitle">
                                <HighlightedText text={cmd.subtitle} query={query} />
                              </span>
                            )}
                          </div>
                        </div>

                        {cmd.shortcutHint && (
                          <span className="command-item-badge">
                            {cmd.shortcutHint}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* 底部键盘指南条 */}
        <div className="command-palette-footer">
          <div className="command-footer-hints">
            <span className="command-key-hint">
              <kbd>↑</kbd> <kbd>↓</kbd> 导航
            </span>
            <span className="command-key-hint">
              <kbd>↵</kbd> 执行
            </span>
            <span className="command-key-hint">
              <kbd>ESC</kbd> 关闭
            </span>
          </div>
          <div className="command-footer-count">
            {filteredCommands.length} 项结果
          </div>
        </div>
      </div>
    </div>
  );
}
