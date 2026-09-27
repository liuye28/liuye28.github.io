import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../../components/games/GameHeader.jsx';
import VirtualDpad from '../../components/games/VirtualDpad.jsx';
import GameHelpModal from '../../components/games/GameHelpModal.jsx';
import GameOverModal from '../../components/games/GameOverModal.jsx';
import { useTouchSwipe } from '../../hooks/useTouchSwipe.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import {
  createEmptyBoard,
  addRandomTile,
  moveBoard,
  hasMovesAvailable,
  hasWon,
  getMaxTile,
} from '../../utils/games/game2048Logic.js';
import { gameAudio } from '../../utils/gameAudio.js';
import { getGameRecord, updateRecord } from '../../utils/gameStorage.js';
import './GamesCommon.css';

const MAX_UNDO_STEPS = 5;

/**
 * 计算单行合并后产生的输出索引位置
 * @param {number[]} line
 * @returns {number[]} 发生合并的输出位置数组
 */
function getMergedIndicesInLine(line) {
  const filtered = line.filter((val) => val !== 0);
  const mergedIndices = [];
  let outIdx = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      mergedIndices.push(outIdx);
      outIdx++;
      i++; // 跳过已合并的相邻项
    } else {
      outIdx++;
    }
  }
  return mergedIndices;
}

/**
 * 依据移动前棋盘与滑动方向，精确计算所有因合并产生新方块的坐标集合
 * @param {number[][]} board
 * @param {'up' | 'down' | 'left' | 'right'} direction
 * @returns {Set<string>} 形如 'r-c' 的坐标字符串 Set
 */
function getMergedCoordinates(board, direction) {
  const mergedSet = new Set();
  const size = board.length;

  if (direction === 'left') {
    for (let r = 0; r < size; r++) {
      const indices = getMergedIndicesInLine(board[r]);
      for (const col of indices) {
        mergedSet.add(`${r}-${col}`);
      }
    }
  } else if (direction === 'right') {
    for (let r = 0; r < size; r++) {
      const reversed = [...board[r]].reverse();
      const indices = getMergedIndicesInLine(reversed);
      for (const col of indices) {
        mergedSet.add(`${r}-${size - 1 - col}`);
      }
    }
  } else if (direction === 'up') {
    for (let c = 0; c < size; c++) {
      const colLine = [board[0][c], board[1][c], board[2][c], board[3][c]];
      const indices = getMergedIndicesInLine(colLine);
      for (const row of indices) {
        mergedSet.add(`${row}-${c}`);
      }
    }
  } else if (direction === 'down') {
    for (let c = 0; c < size; c++) {
      const colLine = [board[3][c], board[2][c], board[1][c], board[0][c]];
      const indices = getMergedIndicesInLine(colLine);
      for (const row of indices) {
        mergedSet.add(`${size - 1 - row}-${c}`);
      }
    }
  }

  return mergedSet;
}

/**
 * 对比滑动合并后与新增随机方块后的棋盘，找出新增方块坐标
 * @param {number[][]} movedBoard
 * @param {number[][]} finalBoard
 * @returns {{ r: number, c: number } | null}
 */
function getSpawnedCoordinate(movedBoard, finalBoard) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (movedBoard[r][c] === 0 && finalBoard[r][c] !== 0) {
        return { r, c };
      }
    }
  }
  return null;
}

/**
 * 获取方块对应的 CSS 样式类名
 * @param {number} val
 * @returns {string}
 */
function getTileClass(val) {
  if (val <= 2048) {
    return `tile-${val}`;
  }
  return 'tile-super';
}

/**
 * 初始化 2048 初始开局棋盘（包含 2 个初始随机方块）
 * @returns {number[][]}
 */
function createInitialBoard() {
  const empty = createEmptyBoard(4);
  const first = addRandomTile(empty);
  return addRandomTile(first);
}

/**
 * 2048 数字方块合成游戏页面
 *
 * 核心特性：
 * 1. 4×4 CSS Grid 响应式 Apple HIG 卡片磨砂玻璃质感；
 * 2. 丰富多彩、深浅色无缝自适应的方块色彩与微光光晕系统；
 * 3. 动画：新方块诞生弹性放大（Pop-in）与方块碰撞合并脉冲（Pulse）；
 * 4. 控制：支持方向键、WASD、屏幕触摸滑动手势与 VirtualDpad 十字手柄；
 * 5. 悔棋：贴心支持最多 5 步状态撤销（Undo）；
 * 6. 音效：原生 Web Audio 驱动滑动、合并、胜利凯旋与失败降调；
 * 7. 战绩：最高分与最大合成方块数据本地持久化。
 */
export default function Game2048() {
  usePageTitle('2048');
  const navigate = useNavigate();

  // 游戏核心状态
  const [board, setBoard] = useState(createInitialBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const record = getGameRecord('game2048');
    return record.bestScore || 0;
  });
  const [maxTile, setMaxTile] = useState(() => {
    const record = getGameRecord('game2048');
    return record.maxTile || 0;
  });

  // 历史快照（用于悔棋撤销）
  const [history, setHistory] = useState([]);
  const [moveCount, setMoveCount] = useState(0);

  // 动画状态追踪
  const [mergedCells, setMergedCells] = useState(() => new Set());
  const [spawnedCell, setSpawnedCell] = useState(null);

  // 弹窗与胜利检测状态
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  // Ref 避免闭包旧值与触发多重弹窗
  const hasReached2048Ref = useRef(false);
  const initialBestRef = useRef(bestScore);
  const boardContainerRef = useRef(null);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const boardRef = useRef(board);
  boardRef.current = board;

  // 页面卸载时安全持久化未保存的高分与最大方块
  useEffect(() => {
    return () => {
      if (scoreRef.current > 0) {
        const curMax = getMaxTile(boardRef.current);
        updateRecord('game2048', { score: scoreRef.current, maxTile: curMax });
      }
    };
  }, []);

  /**
   * 重新开始一局全新游戏
   */
  const handleRestart = useCallback(() => {
    if (scoreRef.current > 0 || history.length > 0) {
      const curMax = getMaxTile(boardRef.current);
      updateRecord('game2048', { score: scoreRef.current, maxTile: curMax });
    }

    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setScore(0);
    setHistory([]);
    setIsGameOver(false);
    setIsVictoryOpen(false);
    setIsNewBest(false);
    setMergedCells(new Set());
    setSpawnedCell(null);
    setMoveCount(0);
    hasReached2048Ref.current = false;
    initialBestRef.current = Math.max(bestScore, scoreRef.current);

    const initialMax = getMaxTile(newBoard);
    setMaxTile((prev) => Math.max(prev, initialMax));
    gameAudio.playMove();
  }, [bestScore, history.length]);

  /**
   * 撤销上一步操作 (Undo)
   */
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    setBoard(previous.board);
    setScore(previous.score);
    setHistory((prev) => prev.slice(0, -1));
    setIsGameOver(false);
    setMergedCells(new Set());
    setSpawnedCell(null);
    gameAudio.playMove();

    const currentMax = getMaxTile(previous.board);
    setMaxTile((prev) => Math.max(prev, currentMax));
  }, [history]);

  /**
   * 核心四向移动处理逻辑
   */
  const handleMove = useCallback(
    (direction) => {
      if (isGameOver || isVictoryOpen || isHelpOpen) return;

      const { board: nextBoard, score: addedScore, moved } = moveBoard(board, direction);
      if (!moved) return;

      // 1. 计算合并方块坐标（触发 Pulse 脉冲动效）
      const mergedCoordSet = getMergedCoordinates(board, direction);

      // 2. 随机生成一个新方块 (2 或 4)
      const finalBoard = addRandomTile(nextBoard);

      // 3. 记录新增方块坐标（触发 Pop-in 弹出动效）
      const spawnedCoord = getSpawnedCoordinate(nextBoard, finalBoard);

      // 4. 更新历史快照与棋盘状态
      const newScore = score + addedScore;
      setHistory((prev) => [...prev, { board, score }].slice(-MAX_UNDO_STEPS));
      setBoard(finalBoard);
      setScore(newScore);
      setMoveCount((prev) => prev + 1);

      setMergedCells(mergedCoordSet);
      setSpawnedCell(spawnedCoord);

      // 5. 原生音效触发
      if (addedScore > 0) {
        gameAudio.playMerge();
      } else {
        gameAudio.playMove();
      }

      // 6. 最高分与最大方块追踪
      const currentMaxTile = getMaxTile(finalBoard);
      setMaxTile((prev) => Math.max(prev, currentMaxTile));

      if (newScore > initialBestRef.current && initialBestRef.current > 0) {
        setIsNewBest(true);
      }
      if (newScore > bestScore) {
        setBestScore(newScore);
      }

      // 7. 检测 2048 胜利（单局首次达成触发）
      if (!hasReached2048Ref.current && hasWon(finalBoard, 2048)) {
        hasReached2048Ref.current = true;
        const updated = updateRecord('game2048', { score: newScore, maxTile: currentMaxTile });
        setBestScore(updated.bestScore);
        setMaxTile(updated.maxTile);
        gameAudio.playWin();
        setIsVictoryOpen(true);
        return;
      }

      // 8. 检测游戏结束（棋盘已满且无路可走）
      if (!hasMovesAvailable(finalBoard)) {
        setIsGameOver(true);
        const updated = updateRecord('game2048', { score: newScore, maxTile: currentMaxTile });
        setBestScore(updated.bestScore);
        setMaxTile(updated.maxTile);
        gameAudio.playLose();
      }
    },
    [board, score, isGameOver, isVictoryOpen, isHelpOpen, bestScore]
  );

  // 绑定移动端滑动手势
  useTouchSwipe(handleMove, boardContainerRef, { threshold: 30, preventDefault: true });

  // 绑定键盘全局按键监听 (Arrow, WASD, Undo, Restart)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 弹窗激活时暂缓游戏按键响应
      if (isHelpOpen || isVictoryOpen || isGameOver) return;

      const key = e.key;

      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        e.preventDefault();
        handleMove('up');
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        e.preventDefault();
        handleMove('down');
      } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        e.preventDefault();
        handleMove('left');
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        e.preventDefault();
        handleMove('right');
      } else if (key === 'z' || key === 'Z') {
        e.preventDefault();
        handleUndo();
      } else if (key === 'r' || key === 'R') {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleUndo, handleRestart, isHelpOpen, isVictoryOpen, isGameOver]);

  const currentHighestTile = Math.max(maxTile, getMaxTile(board));

  return (
    <div className="game-page-container">
      <div className="game-stage-wrapper">
        {/* 顶部通用导航与成绩栏 */}
        <GameHeader
          title="2048"
          score={score}
          bestScore={Math.max(bestScore, score)}
          onRestart={handleRestart}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* 2048 游戏主舞台卡片 */}
        <div className="game-board-card game2048-card">
          {/* 工具控制条 (最大方块、撤销上一步、重新开始) */}
          <div className="game2048-toolbar">
            <div className="game2048-stat-pill" title="当前达到的最高方块">
              <span className="game2048-stat-label">最高方块</span>
              <span className="game2048-stat-val">{currentHighestTile}</span>
            </div>

            <div className="game2048-toolbar-actions">
              <button
                type="button"
                className="game-btn"
                onClick={handleUndo}
                disabled={history.length === 0}
                title="撤销上一步 (Z)"
                style={{
                  opacity: history.length === 0 ? 0.4 : 1,
                  cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
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
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>撤销{history.length > 0 ? ` (${history.length})` : ''}</span>
              </button>

              <button
                type="button"
                className="game-btn"
                onClick={handleRestart}
                title="重新开局 (R)"
              >
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
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>新游戏</span>
              </button>
            </div>
          </div>

          {/* 4×4 棋盘网格容器 */}
          <div
            ref={boardContainerRef}
            className="game2048-board"
            role="region"
            aria-label="2048 棋盘网格"
          >
            {board.map((row, r) =>
              row.map((val, c) => {
                const isSpawned = spawnedCell && spawnedCell.r === r && spawnedCell.c === c;
                const isMerged = mergedCells.has(`${r}-${c}`);
                const tileClass = val > 0 ? getTileClass(val) : '';
                const animClass = isMerged ? 'tile-merged' : isSpawned ? 'tile-spawn' : '';

                return (
                  <div key={`${r}-${c}`} className="game2048-cell">
                    {val > 0 && (
                      <div
                        key={`${r}-${c}-${val}-${moveCount}`}
                        className={`game2048-tile ${tileClass} ${animClass}`}
                        aria-label={`方块 ${val}`}
                      >
                        {val}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 底部操作快捷提示 */}
          <div className="game2048-hint">
            <span>💡 方向键/WASD滑动 · 触屏滑动或十字手柄 · Z 键撤销</span>
          </div>
        </div>

        {/* 移动端虚拟十字手柄 */}
        <VirtualDpad onDirection={handleMove} />
      </div>

      {/* 首次达成 2048 胜利结算弹窗（支持继续挑战更高分） */}
      {isVictoryOpen && (
        <div
          className="game-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-victory-modal-title"
        >
          <div className="game-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '3rem',
                  lineHeight: 1,
                  marginBottom: '0.65rem',
                  filter: 'drop-shadow(0 4px 16px rgba(255, 215, 0, 0.6))',
                }}
              >
                🏆
              </div>
              <h2
                id="game-victory-modal-title"
                className="game-modal-title"
                style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}
              >
                恭喜达成 2048！
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                太不可思议了！你成功合成了传奇 2048 黄金方块！
              </p>
            </div>

            <div className="game-modal-stats-grid">
              <div className="game-modal-stat-card highlight">
                <div className="game-modal-stat-label">本局得分</div>
                <div className="game-modal-stat-value" style={{ color: 'var(--accent-color)' }}>
                  {score}
                </div>
              </div>
              <div className="game-modal-stat-card">
                <div className="game-modal-stat-label">历史最高</div>
                <div className="game-modal-stat-value">
                  {Math.max(bestScore, score)}
                </div>
              </div>
              <div className="game-modal-stat-card">
                <div className="game-modal-stat-label">达成方块</div>
                <div className="game-modal-stat-value">2048</div>
              </div>
            </div>

            <div
              className="game-modal-actions"
              style={{ flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}
            >
              <button
                type="button"
                className="game-btn game-btn-primary"
                onClick={() => setIsVictoryOpen(false)}
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
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>继续挑战（探索 4096+）</span>
              </button>

              <button
                type="button"
                className="game-btn"
                onClick={handleRestart}
                style={{ width: '100%', height: '38px' }}
              >
                重新开始新局
              </button>

              <button
                type="button"
                className="game-btn"
                onClick={() => navigate('/games')}
                style={{ width: '100%', height: '36px', color: 'var(--text-secondary)' }}
              >
                返回小游戏大厅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 游戏结束结算弹窗 */}
      <GameOverModal
        isOpen={isGameOver}
        title="游戏结束"
        subtitle={isNewBest ? '🎉 太棒了！刷新了历史最高分纪录！' : '棋盘已满且无法再合并，再接再厉！'}
        stats={[
          { label: '本局得分', value: score, highlight: true },
          { label: '历史最高', value: Math.max(bestScore, score) },
          { label: '最高方块', value: currentHighestTile },
        ]}
        onRestart={handleRestart}
        onBackHome={() => navigate('/games')}
      />

      {/* 玩法指引说明弹窗 */}
      <GameHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="2048"
        rules={[
          { label: '核心目标', desc: '滑动棋盘使相同数值的方块相撞合并，合力合成 2048 黄金方块！' },
          {
            label: '滑动与合并',
            desc: '每次滑动，所有方块向指定方向靠拢并挤压；相邻且数值相同的两个方块合并为一个两倍数值的新方块，并将新数值计入总分。',
          },
          {
            label: '新方块生成',
            desc: '每次有效移动后，棋盘空闲格子中会随机生成一个 2（90% 概率）或 4（10% 概率）。',
          },
          {
            label: '悔棋撤销 (Undo)',
            desc: '支持最多 5 步历史回溯，走错或失误时可一键撤销恢复。',
          },
          {
            label: '胜负判定',
            desc: '合成 2048 即获胜利，可选择“继续挑战”冲击 4096 / 8192 高峰；棋盘全满且无任何可合并方向时游戏结束。',
          },
        ]}
        keys={[
          { key: '↑ / W', desc: '向上滑动' },
          { key: '↓ / S', desc: '向下滑动' },
          { key: '← / A', desc: '向左滑动' },
          { key: '→ / D', desc: '向右滑动' },
          { key: 'Z', desc: '撤销上一步' },
          { key: 'R', desc: '重新开局' },
          { key: 'Esc', desc: '关闭说明' },
        ]}
      />

      {/* 2048 专属视觉与深浅色模式自适应样式 */}
      <style>{`
        .game2048-card {
          max-width: 440px;
          width: 100%;
          gap: 1.25rem;
          box-sizing: border-box;
        }

        .game2048-toolbar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .game2048-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-pill);
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-sm);
        }

        .game2048-stat-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .game2048-stat-val {
          font-size: 1.1rem;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: var(--accent-color);
        }

        .game2048-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .game2048-board {
          width: 100%;
          aspect-ratio: 1 / 1;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(4, 1fr);
          gap: 10px;
          box-sizing: border-box;
          position: relative;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .game2048-cell {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-md);
          background: rgba(125, 125, 125, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-sizing: border-box;
        }

        .game2048-tile {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          font-weight: 800;
          user-select: none;
          -webkit-user-select: none;
          box-sizing: border-box;
          letter-spacing: -0.02em;
          will-change: transform, opacity;
        }

        .game2048-tile.tile-spawn {
          animation: tilePopIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .game2048-tile.tile-merged {
          animation: tileMergePulse 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes tilePopIn {
          0% {
            opacity: 0;
            transform: scale(0.25);
          }
          65% {
            opacity: 1;
            transform: scale(1.12);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes tileMergePulse {
          0% {
            transform: scale(0.92);
          }
          50% {
            transform: scale(1.18);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Tile 2 */
        .tile-2 {
          background: #eee4da;
          color: #655447;
          font-size: clamp(1.4rem, 5vw, 2.2rem);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        :root:not([data-theme='light']) .tile-2 {
          background: #3a3a3c;
          color: #f2f2f7;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        /* Tile 4 */
        .tile-4 {
          background: #ede0c8;
          color: #655447;
          font-size: clamp(1.4rem, 5vw, 2.2rem);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }
        :root:not([data-theme='light']) .tile-4 {
          background: #48484a;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }

        /* Tile 8 */
        .tile-8 {
          background: #f2b179;
          color: #ffffff;
          font-size: clamp(1.4rem, 5vw, 2.2rem);
          box-shadow: 0 3px 8px rgba(242, 177, 121, 0.45);
        }
        :root:not([data-theme='light']) .tile-8 {
          background: #e67e22;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(230, 126, 34, 0.45);
        }

        /* Tile 16 */
        .tile-16 {
          background: #f59563;
          color: #ffffff;
          font-size: clamp(1.3rem, 4.8vw, 2rem);
          box-shadow: 0 3px 10px rgba(245, 149, 99, 0.45);
        }
        :root:not([data-theme='light']) .tile-16 {
          background: #d35400;
          color: #ffffff;
          box-shadow: 0 0 14px rgba(211, 84, 0, 0.5);
        }

        /* Tile 32 */
        .tile-32 {
          background: #f67c5f;
          color: #ffffff;
          font-size: clamp(1.3rem, 4.8vw, 2rem);
          box-shadow: 0 4px 12px rgba(246, 124, 95, 0.5);
        }
        :root:not([data-theme='light']) .tile-32 {
          background: #e74c3c;
          color: #ffffff;
          box-shadow: 0 0 16px rgba(231, 76, 60, 0.55);
        }

        /* Tile 64 */
        .tile-64 {
          background: #f65e3b;
          color: #ffffff;
          font-size: clamp(1.3rem, 4.8vw, 2rem);
          box-shadow: 0 4px 14px rgba(246, 94, 59, 0.55);
        }
        :root:not([data-theme='light']) .tile-64 {
          background: #c0392b;
          color: #ffffff;
          box-shadow: 0 0 18px rgba(192, 57, 43, 0.6);
        }

        /* Tile 128 */
        .tile-128 {
          background: #edcf72;
          color: #ffffff;
          font-size: clamp(1.15rem, 4.2vw, 1.75rem);
          box-shadow: 0 4px 14px rgba(237, 207, 114, 0.5);
        }
        :root:not([data-theme='light']) .tile-128 {
          background: #f1c40f;
          color: #1c1c1e;
          box-shadow: 0 0 20px rgba(241, 196, 15, 0.6);
        }

        /* Tile 256 */
        .tile-256 {
          background: #edcc61;
          color: #ffffff;
          font-size: clamp(1.15rem, 4.2vw, 1.75rem);
          box-shadow: 0 5px 16px rgba(237, 204, 97, 0.6);
        }
        :root:not([data-theme='light']) .tile-256 {
          background: #f39c12;
          color: #ffffff;
          box-shadow: 0 0 22px rgba(243, 156, 18, 0.65);
        }

        /* Tile 512 */
        .tile-512 {
          background: #edc850;
          color: #ffffff;
          font-size: clamp(1.15rem, 4.2vw, 1.75rem);
          box-shadow: 0 6px 18px rgba(237, 200, 80, 0.65);
        }
        :root:not([data-theme='light']) .tile-512 {
          background: #e67e22;
          color: #ffffff;
          box-shadow: 0 0 24px rgba(230, 126, 34, 0.7);
        }

        /* Tile 1024 */
        .tile-1024 {
          background: #34c759;
          color: #ffffff;
          font-size: clamp(0.95rem, 3.5vw, 1.45rem);
          box-shadow: 0 6px 20px rgba(52, 199, 89, 0.6);
        }
        :root:not([data-theme='light']) .tile-1024 {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          box-shadow: 0 0 26px rgba(16, 185, 129, 0.75);
        }

        /* Tile 2048 */
        .tile-2048 {
          background: linear-gradient(135deg, #ff9500 0%, #ff2d55 100%);
          color: #ffffff;
          font-size: clamp(0.95rem, 3.5vw, 1.45rem);
          box-shadow: 0 8px 24px rgba(255, 45, 85, 0.65);
        }
        :root:not([data-theme='light']) .tile-2048 {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.85);
        }

        /* Tile 4096+ */
        .tile-super {
          background: linear-gradient(135deg, #5856d6 0%, #af52de 100%);
          color: #ffffff;
          font-size: clamp(0.85rem, 3vw, 1.3rem);
          box-shadow: 0 8px 26px rgba(175, 82, 222, 0.65);
        }
        :root:not([data-theme='light']) .tile-super {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 32px rgba(236, 72, 153, 0.85);
        }

        .game2048-hint {
          font-size: 0.8rem;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.5;
          user-select: none;
        }

        @media (max-width: 480px) {
          .game2048-board {
            padding: 8px;
            gap: 7px;
          }
          .game2048-toolbar {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
