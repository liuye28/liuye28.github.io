import React, { useRef, useEffect } from 'react';
import './SearchBar.css';

/**
 * 苹果 Spotlight / Safari 风格搜索栏
 *
 * @param {Object} props
 * @param {string} props.keyword 搜索关键词
 * @param {function} props.onChange 搜索词变化回调
 * @param {function} props.onClear 清空搜索词回调
 * @param {string} [props.placeholder] 搜索框占位文本
 * @param {string} [props.ariaLabel] 无障碍标签
 */
export default function SearchBar({
  keyword,
  onChange,
  onClear,
  onSubmit,
  placeholder = '搜索或输入网址...',
  ariaLabel = '搜索网站'
}) {
  const inputRef = useRef(null);

  // 绑定快捷键 / 快速聚焦就地搜索栏 (当未在其他输入框中打字时)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes(e.target.tagName) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (keyword) {
        onClear();
      } else {
        inputRef.current?.blur();
      }
    } else if (e.key === 'Enter') {
      if (onSubmit) {
        onSubmit(keyword);
      }
    }
  };

  return (
    <div className="spotlight-search-container">
      <div className="spotlight-search-bar">
        <svg
          className="spotlight-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7.5" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className="spotlight-input"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck="false"
        />

        <div className="spotlight-right-addons">
          {keyword ? (
            <button
              type="button"
              className="spotlight-clear-btn"
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              aria-label="清空搜索内容"
              title="清空 (Esc)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <div className="spotlight-shortcut-badge" aria-hidden="true" title="按 / 键快速聚焦">
              <span className="shortcut-key">/</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
