import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Header.css';

/**
 * 顶部导航头部组件 (支持 Apple 风格路由分段切换)
 */
export default function Header() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme_preference');
    if (saved) return saved;
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme_preference', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('theme_preference_manual');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme_preference_manual', 'true');
  };

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
      </nav>

      <div className="header-actions">
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
