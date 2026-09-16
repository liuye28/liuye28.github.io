import React, { useState, useCallback } from 'react';
import { profileHero } from '../../data/profileData';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

/**
 * 链接图标辅助渲染函数
 */
function renderLinkIcon(label = '', url = '') {
  const lower = (label + ' ' + url).toLowerCase();

  // GitHub 标识
  if (lower.includes('github')) {
    return (
      <svg
        className="about-btn-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    );
  }

  // 仓库 / 代码库
  if (lower.includes('repo') || lower.includes('仓库') || lower.includes('code')) {
    return (
      <svg
        className="about-btn-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    );
  }

  // 默认外链 / 博客
  return (
    <svg
      className="about-btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/**
 * 个人名片与社交连接组件（AboutHero）
 *
 * 遵循 Apple HIG 拟物与极简美学：
 * 1. 居中光晕渐变 Avatar，支持点击弹性晃动反馈
 * 2. 姓名、Handle、标语与个人简介多层级排版
 * 3. 社交与外链药丸按钮组（GitHub、仓库主页等）
 * 4. “复制主页链接”交互按钮，提供 2 秒“已复制 ✓”轻反馈动效
 *
 * @param {object} props
 * @param {object} [props.profile=profileHero] 个人资料对象
 */
export default function AboutHero({ profile = profileHero }) {
  const data = profile || profileHero;
  const {
    name = 'Ly',
    handle = 'liuye28',
    tagline = '',
    bio = '',
    location = '',
    links = []
  } = data;

  const [isBouncing, setIsBouncing] = useState(false);
  const [copied, copy] = useCopyToClipboard(2000);

  // 点击头像触发弹性微动画
  const handleAvatarClick = useCallback(() => {
    setIsBouncing(false);
    requestAnimationFrame(() => {
      setIsBouncing(true);
    });
  }, []);

  // 复制当前页面链接
  const handleCopyLink = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    copy(url);
  }, [copy]);

  // 处理 handle 展示格式 (去掉前导 @，在模板中统一格式化)
  const displayHandle = handle ? (handle.startsWith('@') ? handle.slice(1) : handle) : '';
  const avatarText = name ? name.slice(0, 2) : 'Ly';

  return (
    <section className="about-profile-hero" aria-label="个人名片介绍">
      <style>{`
        .about-profile-hero {
          text-align: center;
          margin: 1rem auto 2.5rem auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 720px;
        }

        .about-avatar-container {
          position: relative;
          display: inline-block;
          margin: 0 auto 1.25rem auto;
        }

        .about-avatar-circle {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1f6feb 0%, #5856d6 55%, #af52de 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 2.3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          box-shadow: 0 12px 30px rgba(88, 86, 214, 0.35);
          user-select: none;
          cursor: pointer;
          outline: none;
          border: 3px solid rgba(255, 255, 255, 0.22);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .about-avatar-circle:hover {
          transform: scale(1.06);
          box-shadow: 0 18px 40px rgba(88, 86, 214, 0.48);
        }

        .about-avatar-circle:focus-visible {
          box-shadow: 0 0 0 3px var(--accent-light, #e8f2fc), 0 14px 34px rgba(88, 86, 214, 0.4);
        }

        .about-avatar-circle.is-bouncing {
          animation: appleAvatarBounce 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes appleAvatarBounce {
          0% { transform: scale(1); }
          25% { transform: scale(0.86) rotate(-5deg); }
          50% { transform: scale(1.15) rotate(4deg); }
          75% { transform: scale(0.96) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .about-profile-name {
          font-size: 2.15rem;
          font-weight: 700;
          letter-spacing: -0.035em;
          color: var(--text-primary, #1d1d1f);
          margin: 0;
          font-family: var(--font-sans);
          line-height: 1.25;
        }

        .about-profile-handle {
          font-size: 1.2rem;
          font-weight: 500;
          color: var(--text-secondary, #86868b);
          letter-spacing: -0.01em;
          vertical-align: middle;
        }

        .about-profile-location {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background-color: var(--bg-surface-secondary, #f0f0f2);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary, #86868b);
        }

        .about-location-icon {
          width: 13px;
          height: 13px;
          color: var(--accent-color, #0071e3);
          flex-shrink: 0;
        }

        .about-profile-tagline {
          font-size: 1.08rem;
          font-weight: 500;
          color: var(--text-primary, #1d1d1f);
          margin: 0.85rem auto 0 auto;
          max-width: 620px;
          line-height: 1.5;
          letter-spacing: -0.01em;
        }

        .about-profile-bio {
          font-size: 0.92rem;
          color: var(--text-secondary, #86868b);
          margin: 0.6rem auto 1.5rem auto;
          max-width: 640px;
          line-height: 1.68;
        }

        .about-action-group {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
          width: 100%;
        }

        .about-btn-pill {
          padding: 0.62rem 1.4rem;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.88rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition-fast, all 0.2s cubic-bezier(0.16, 1, 0.3, 1));
          border: 1px solid transparent;
        }

        .about-btn-pill:hover {
          transform: translateY(-1px) scale(1.02);
        }

        .about-btn-pill:active {
          transform: scale(0.98);
        }

        .about-btn-pill.copied {
          background-color: rgba(52, 199, 89, 0.15) !important;
          color: #34c759 !important;
          border-color: rgba(52, 199, 89, 0.35) !important;
        }

        .about-btn-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .about-avatar-circle {
            width: 84px;
            height: 84px;
            font-size: 2.1rem;
          }
          .about-profile-name {
            font-size: 1.75rem;
          }
          .about-profile-handle {
            font-size: 1.05rem;
          }
          .about-profile-tagline {
            font-size: 0.98rem;
            padding: 0 0.5rem;
          }
          .about-profile-bio {
            font-size: 0.88rem;
            padding: 0 0.5rem;
          }
          .about-action-group {
            gap: 0.6rem;
          }
          .about-btn-pill {
            padding: 0.55rem 1.15rem;
            font-size: 0.84rem;
          }
        }
      `}</style>

      {/* 居中拟物光晕头像 */}
      <div className="about-avatar-container">
        <div
          className={`about-avatar-circle ${isBouncing ? 'is-bouncing' : ''}`}
          onClick={handleAvatarClick}
          onAnimationEnd={() => setIsBouncing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAvatarClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`${name} 头像（点击触发微动效）`}
          title="戳一下 Ly"
        >
          {avatarText}
        </div>
      </div>

      {/* 姓名与 Handle */}
      <h1 className="about-profile-name">
        {name}
        {displayHandle && (
          <span className="about-profile-handle"> ({displayHandle})</span>
        )}
      </h1>

      {/* 地理位置胶囊（若有） */}
      {location && (
        <div className="about-profile-location">
          <svg
            className="about-location-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{location}</span>
        </div>
      )}

      {/* 一句话标语 */}
      {tagline && <p className="about-profile-tagline">{tagline}</p>}

      {/* 关于我深度介绍 */}
      {bio && <p className="about-profile-bio">{bio}</p>}

      {/* 快捷操作药丸按钮组 */}
      <div className="about-action-group">
        {links.map((link, index) => {
          const isPrimary = index === 0 || Boolean(link.primary);
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`apple-btn ${
                isPrimary ? 'apple-btn-primary' : 'apple-btn-secondary'
              } about-btn-pill`}
            >
              {renderLinkIcon(link.label, link.url)}
              <span>{link.label}</span>
            </a>
          );
        })}

        {/* 复制当前主页链接 */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`apple-btn apple-btn-secondary about-btn-pill ${
            copied ? 'copied' : ''
          }`}
          aria-label="复制当前主页链接"
          title="复制主页链接"
        >
          {copied ? (
            <>
              <svg
                className="about-btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>已复制 ✓</span>
            </>
          ) : (
            <>
              <svg
                className="about-btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>复制主页链接</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

export { AboutHero };
