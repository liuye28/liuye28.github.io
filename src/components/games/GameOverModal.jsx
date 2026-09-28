import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../pages/games/GamesCommon.css';

/**
 * 游戏结束 / 通关胜利结算模态弹窗组件
 *
 * @param {{
 *   isOpen: boolean,
 *   title?: string,
 *   subtitle?: string,
 *   stats?: Array<{ label: string, value: string | number, highlight?: boolean }>,
 *   onRestart?: () => void,
 *   onBackHome?: () => void
 * }} props
 */
export default function GameOverModal({
  isOpen,
  title = '游戏结束',
  subtitle,
  stats = [],
  onRestart,
  onBackHome,
}) {
  const navigate = useNavigate();

  // 支持按 Enter 或 R 快捷键直接再玩一局
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if ((e.key === 'Enter' || e.key === 'r' || e.key === 'R') && onRestart) {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onRestart]);

  if (!isOpen) return null;

  const handleBackHome = () => {
    if (typeof onBackHome === 'function') {
      onBackHome();
    } else {
      navigate('/games');
    }
  };

  const isVictory = title.includes('通关') || title.includes('胜利') || title.includes('成功') || title.includes('赢');

  return (
    <div
      className="game-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-modal-title"
    >
      <div className="game-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '2.5rem',
              lineHeight: 1,
              marginBottom: '0.65rem',
              filter: isVictory ? 'drop-shadow(0 4px 12px rgba(255, 215, 0, 0.4))' : undefined,
            }}
          >
            {isVictory ? '🏆' : '🎮'}
          </div>
          <h2
            id="game-over-modal-title"
            className="game-modal-title"
            style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="game-modal-stats-grid">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`game-modal-stat-card ${stat.highlight ? 'highlight' : ''}`}
              >
                <div className="game-modal-stat-label">{stat.label}</div>
                <div
                  className="game-modal-stat-value"
                  style={stat.highlight ? { color: 'var(--accent-color)' } : undefined}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="game-modal-actions"
          style={{ flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}
        >
          {onRestart && (
            <button
              type="button"
              className="game-btn game-btn-primary"
              onClick={onRestart}
              style={{ width: '100%', height: '42px', fontSize: '0.95rem' }}
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
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>再玩一局</span>
            </button>
          )}

          <button
            type="button"
            className="game-btn"
            onClick={handleBackHome}
            style={{ width: '100%', height: '38px', color: 'var(--text-secondary)' }}
          >
            返回小游戏大厅
          </button>
        </div>
      </div>
    </div>
  );
}
