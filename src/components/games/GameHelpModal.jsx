import React, { useEffect } from 'react';
import '../../pages/games/GamesCommon.css';

/**
 * 游戏玩法与操作说明模态弹窗组件
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   rules?: Array<string | { label: string, desc: string }>,
 *   keys?: Array<{ key: string, desc: string }>
 * }} props
 */
export default function GameHelpModal({
  isOpen,
  onClose,
  title = '',
  rules = [],
  keys = [],
}) {
  // 监听 Escape 按键便捷关闭弹窗
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="game-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-help-modal-title"
    >
      <div className="game-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="game-modal-header">
          <h2 id="game-help-modal-title" className="game-modal-title">
            {title ? `${title} · 玩法指南` : '游戏玩法指南'}
          </h2>
          <button
            type="button"
            className="game-modal-close-btn"
            onClick={onClose}
            aria-label="关闭玩法指南"
            title="关闭 (Esc)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="game-modal-body">
          {rules && rules.length > 0 && (
            <div className="game-modal-section">
              <h3 className="game-modal-section-title">核心规则</h3>
              <ul className="game-rule-list">
                {rules.map((rule, idx) => (
                  <li key={idx} className="game-modal-rule-item">
                    <span className="game-rule-bullet" aria-hidden="true" />
                    <div>
                      {typeof rule === 'string' ? (
                        rule
                      ) : (
                        <>
                          <strong style={{ color: 'var(--text-primary)' }}>{rule.label}</strong>
                          {rule.desc && <span>: {rule.desc}</span>}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {keys && keys.length > 0 && (
            <div className="game-modal-section">
              <h3 className="game-modal-section-title">键盘快捷键</h3>
              <div className="game-keys-grid">
                {keys.map((item, idx) => (
                  <div key={idx} className="game-key-item">
                    <kbd className="game-key-badge">{item.key}</kbd>
                    <span className="game-key-desc">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="game-modal-actions">
          <button
            type="button"
            className="game-btn game-btn-primary"
            onClick={onClose}
            style={{ width: '100%', height: '40px' }}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
