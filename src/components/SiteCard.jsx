import React, { useState } from 'react';
import { getFaviconUrl, getDomain, isFaviconFailed, markFaviconFailed } from '../utils/url';
import './SiteCard.css';

/**
 * 苹果 App 风格网站卡片组件
 *
 * @param {Object} props
 * @param {Object} props.site 网站数据对象
 */
export default function SiteCard({ site }) {
  const domain = getDomain(site.url);
  const isKnownFailed = isFaviconFailed(domain);
  const [imgError, setImgError] = useState(isKnownFailed);
  const faviconUrl = getFaviconUrl(site.url);

  // 首字母备用展示
  const fallbackLetter = site.name ? site.name.trim().charAt(0).toUpperCase() : '?';

  const handleImageError = () => {
    setImgError(true);
    markFaviconFailed(domain);
  };

  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="apple-site-card"
      title={`访问 ${site.name} (${site.url})`}
    >
      <div className="card-top-row">
        <div className="app-icon-container">
          {!imgError ? (
            <img
              src={faviconUrl}
              alt={`${site.name} 图标`}
              className="app-icon"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="app-icon-fallback" aria-hidden="true">
              {fallbackLetter}
            </div>
          )}
        </div>

        <div className="card-header-info">
          <div className="name-and-arrow">
            <h2 className="app-title">{site.name}</h2>
            <svg
              className="arrow-glyph"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </div>
          <span className="app-category-tag">{site.category}</span>
        </div>
      </div>

      <p className="app-description">{site.desc || '快捷访问入口'}</p>
    </a>
  );
}
