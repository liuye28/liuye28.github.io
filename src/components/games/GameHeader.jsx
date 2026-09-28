import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { gameAudio } from '../../utils/gameAudio.js';
import { formatGameTime } from '../../hooks/useTouchSwipe.js';
import '../../pages/games/GamesCommon.css';

export { formatGameTime };

/**
 * 游戏通用顶部栏组件
 *
 * @param {{
 *   title: string,
 *   score?: number,
 *   bestScore?: number,
 *   time?: number,
 *   turns?: number,
 *   onRestart?: () => void,
 *   isPaused?: boolean,
 *   onTogglePause?: () => void,
 *   onOpenHelp?: () => void
 * }} props
 */
export default function GameHeader({
  title,
  score,
  bestScore,
  time,
  turns,
  onRestart,
  isPaused = false,
  onTogglePause,
  onOpenHelp,
}) {
  const [muted, setMuted] = useState(() => gameAudio.isMuted());

  const handleToggleSound = () => {
    const nextMuted = gameAudio.toggleMute();
    setMuted(nextMuted);
  };

  const hasScore = typeof score === 'number';
  const hasBestScore = typeof bestScore === 'number';
  const hasTime = typeof time === 'number';
  const hasTurns = typeof turns === 'number';
  const showStatsBar = hasScore || hasBestScore || hasTime || hasTurns;

  return (
    <header className="game-header">
      <div className="game-header-top">
        <div className="game-header-left">
          <Link to="/games" className="game-back-link" title="返回小游戏大厅">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>返回大厅</span>
          </Link>
          <h1 className="game-header-title">{title}</h1>
        </div>

        <div className="game-header-actions">
          {onOpenHelp && (
            <button
              type="button"
              className="game-btn game-btn-icon"
              onClick={onOpenHelp}
              title="玩法说明"
              aria-label="玩法说明"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          )}

          {onTogglePause && (
            <button
              type="button"
              className="game-btn game-btn-icon"
              onClick={onTogglePause}
              title={isPaused ? '继续游戏' : '暂停游戏'}
              aria-label={isPaused ? '继续游戏' : '暂停游戏'}
            >
              {isPaused ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          )}

          <button
            type="button"
            className="game-btn game-btn-icon"
            onClick={handleToggleSound}
            title={muted ? '开启音效' : '静音'}
            aria-label={muted ? '开启音效' : '静音'}
          >
            {muted ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {onRestart && (
            <button
              type="button"
              className="game-btn game-btn-icon"
              onClick={onRestart}
              title="重新开始"
              aria-label="重新开始"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showStatsBar && (
        <div className="game-stats-bar">
          {hasScore && (
            <div className="game-stat-badge">
              <span className="game-stat-label">得分</span>
              <span className="game-stat-value">{score}</span>
            </div>
          )}
          {hasBestScore && (
            <div className="game-stat-badge">
              <span className="game-stat-label">最高分</span>
              <span className="game-stat-value">{bestScore}</span>
            </div>
          )}
          {hasTime && (
            <div className="game-stat-badge">
              <span className="game-stat-label">时间</span>
              <span className="game-stat-value">{formatGameTime(time)}</span>
            </div>
          )}
          {hasTurns && (
            <div className="game-stat-badge">
              <span className="game-stat-label">步数</span>
              <span className="game-stat-value">{turns}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
