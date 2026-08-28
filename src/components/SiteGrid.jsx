import React from 'react';
import SiteCard from './SiteCard';
import './SiteGrid.css';

/**
 * 苹果网格容器与空状态组件
 *
 * @param {Object} props
 * @param {Array} props.sites 过滤后的网站列表
 * @param {function} props.onResetFilter 重置过滤条件回调
 */
export default function SiteGrid({ sites, onResetFilter }) {
  if (sites.length === 0) {
    return (
      <div className="apple-empty-state">
        <div className="empty-glyph-box" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="empty-title">无匹配结果</p>
        <p className="empty-subtitle">未找到相匹配的网站或分类项目</p>
        {onResetFilter && (
          <button type="button" className="empty-reset-action" onClick={onResetFilter}>
            还原全部项目
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="apple-site-grid" aria-label="网站列表">
      {sites.map((site) => (
        <SiteCard key={`${site.name}-${site.url}`} site={site} />
      ))}
    </section>
  );
}
