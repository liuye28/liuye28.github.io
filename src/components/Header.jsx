import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Header.css';

const STORAGE_KEY = 'theme_pref';
const OLD_THEME_KEY = 'theme_preference';
const OLD_MANUAL_KEY = 'theme_preference_manual';

/**
 * 获取初始主题配置，支持从旧版本 key (theme_preference / theme_preference_manual) 自动平滑迁移
 *
 * @returns {{ theme: 'dark' | 'light', manual: boolean }}
 */
function getInitialThemePref() {
  try {
    // 1. 尝试从新合并 key 读取
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.theme === 'dark' || parsed.theme === 'light')) {
        return {
          theme: parsed.theme,
          manual: Boolean(parsed.manual),
        };
      }
    }

    // 2. 兼容并一次性迁移旧版本的分散 key
    const oldTheme = localStorage.getItem(OLD_THEME_KEY);
    const oldManual = localStorage.getItem(OLD_MANUAL_KEY);
    if (oldTheme === 'dark' || oldTheme === 'light') {
      const migrated = {
        theme: oldTheme,
        manual: oldManual === 'true',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(OLD_THEME_KEY);
      localStorage.removeItem(OLD_MANUAL_KEY);
      return migrated;
    }
  } catch {
    // 容错处理 (如 JSON 解析错误或隐私模式下 localStorage 受限)
  }

  // 3. 无本地偏好时，默认跟随系统 prefers-color-scheme
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    theme: prefersDark ? 'dark' : 'light',
    manual: false,
  };
}

/**
 * 顶部导航头部组件 (支持 Apple 风格路由分段切换)
 */
export default function Header() {
  const [themePref, setThemePref] = useState(getInitialThemePref);

  // 同步根节点 data-theme 属性与本地持久化
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themePref.theme);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(themePref));
    } catch {
      // 忽略存储异常
    }
  }, [themePref]);

  // 监听系统颜色方案变化（仅在用户未手动指定过主题时自动响应）
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setThemePref((prev) => {
        if (prev.manual) return prev;
        return {
          theme: e.matches ? 'dark' : 'light',
          manual: false,
        };
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemePref((prev) => ({
      theme: prev.theme === 'dark' ? 'light' : 'dark',
      manual: true,
    }));
  };

  const theme = themePref.theme;

  return (
    <header className="apple-header">
      <div className="header-left">
        <Link to="/" className="header-title-link">
          <h1 className="header-title">Ly</h1>
        </Link>
      </div>

      <nav className="header-nav-segmented" aria-label="页面切换">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `header-nav-item ${isActive ? 'active' : ''}`
          }
        >
          网站导航
        </NavLink>
        <NavLink
          to="/tools"
          className={({ isActive }) =>
            `header-nav-item ${isActive ? 'active' : ''}`
          }
        >
          小工具
        </NavLink>
        <NavLink
          to="/cheatsheet"
          className={({ isActive }) =>
            `header-nav-item ${isActive ? 'active' : ''}`
          }
        >
          技术速查
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `header-nav-item ${isActive ? 'active' : ''}`
          }
        >
          关于我
        </NavLink>
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="theme-control-btn"
          onClick={() => window.toggleWebTerminal?.()}
          aria-label="唤起极客终端 (`)"
          title="唤起极客终端 (快捷键 `)"
        >
          <svg
            className="theme-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </button>

        <button
          className="theme-control-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? '切换为浅色外观' : '切换为深色外观'}
          title={theme === 'dark' ? '浅色外观' : '深色外观'}
        >
          {theme === 'dark' ? (
            <svg
              className="theme-icon sun-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              className="theme-icon moon-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
