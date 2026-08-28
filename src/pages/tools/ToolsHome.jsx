import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { tools } from '../../data/tools';
import './ToolsHome.css';

/**
 * 渲染不同小工具的精美矢量图标 (统一 Apple 线性风格)
 */
function ToolIcon({ type }) {
  switch (type) {
    case 'document':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'code':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'regex':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="9.17" y1="9.17" x2="14.83" y2="14.83" />
          <line x1="14.83" y1="9.17" x2="9.17" y2="14.83" />
        </svg>
      );
    case 'hash':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
      );
    case 'codec':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
  }
}

/**
 * 小工具板块首页
 */
export default function ToolsHome() {
  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        <Header />

        <div className="tools-hero-section">
          <h2 className="tools-hero-title">开发者与跨境工具箱</h2>
          <p className="tools-hero-subtitle">
            轻量、纯粹、无服务器端依赖的日常开发与 Ozon 电商刊登提效工具集
          </p>
        </div>

        <section className="tools-card-grid" aria-label="工具列表">
          {tools.map((tool) => (
            <Link key={tool.id} to={tool.path} className="tool-card-item">
              <div className="tool-card-top">
                <div className="tool-icon-box" aria-hidden="true">
                  <ToolIcon type={tool.iconType} />
                </div>
                <div className="tool-card-header-info">
                  <div className="tool-name-arrow">
                    <h3 className="tool-name">{tool.name}</h3>
                    <svg
                      className="tool-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <span className="tool-tag">{tool.category}</span>
                </div>
              </div>
              <p className="tool-desc">{tool.desc}</p>
            </Link>
          ))}
        </section>

        <footer className="apple-footer">
          <p>Ly • Developer & E-Commerce Tools</p>
        </footer>
      </div>
    </main>
  );
}
