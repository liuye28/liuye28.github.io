import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import usePageTitle from '../hooks/usePageTitle';
import './ToolLayout.css';

/**
 * 开发者小工具通用页面骨架组件
 *
 * @param {Object} props
 * @param {string} props.title 工具名称
 * @param {string} props.desc 工具描述说明
 * @param {React.ReactNode} props.children 工具具体交互组件
 */
export default function ToolLayout({ title, desc, children }) {
  // 动态同步浏览器标签页标题
  usePageTitle(title);
  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        <Header />

        <div className="tool-page-nav-bar">
          <Link to="/tools" className="tool-back-link" title="返回小工具列表">
            <svg
              className="back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>返回工具列表</span>
          </Link>
        </div>

        <div className="tool-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <h2 className="tool-page-title" style={{ marginBottom: 0 }}>{title}</h2>
            <span className="tool-privacy-badge" title="数据仅在当前浏览器内存中处理，不依赖任何外部后端，绝不上报隐私">
              🔒 纯本地离线处理
            </span>
          </div>
          {desc && <p className="tool-page-desc">{desc}</p>}
        </div>

        <div className="tool-page-body">{children}</div>

        <footer className="apple-footer">
          <p>Ly</p>
        </footer>
      </div>
    </main>
  );
}
