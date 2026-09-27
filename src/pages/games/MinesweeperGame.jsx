import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../../components/games/GameHeader.jsx';
import GameHelpModal from '../../components/games/GameHelpModal.jsx';
import GameOverModal from '../../components/games/GameOverModal.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import {
  createInitialBoard,
  placeMines,
  revealCell,
  toggleFlag,
  checkVictory,
} from '../../utils/games/minesweeperLogic.js';
import { gameAudio } from '../../utils/gameAudio.js';
import { getGameRecord, updateRecord } from '../../utils/gameStorage.js';
import './GamesCommon.css';

/**
 * 扫雷难度级别预设规范
 */
const DIFFICULTIES = {
  beginner: {
    key: 'beginner',
    name: '初级',
    desc: '9×9 网格 · 10 颗雷',
    rows: 9,
    cols: 9,
    mines: 10,
  },
  intermediate: {
    key: 'intermediate',
    name: '中级',
    desc: '16×16 网格 · 40 颗雷',
    rows: 16,
    cols: 16,
    mines: 40,
  },
};

/**
 * 扫雷益智小游戏页面 (MinesweeperGame)
 *
 * 特性：
 * 1. Apple HIG 磨砂玻璃科技拟态与分段难度控制（初级 9×9 / 中级 16×16）；
 * 2. 首击绝对安全机制（首击点及周围 8 邻域绝无地雷），触发 BFS Flood Fill 自动连片开荒；
 * 3. 双击/点击已揭开数字格智能开荒（Chord）；
 * 4. 移动端触屏单手优化：模式切换胶囊（⛏️ 挖掘 / 🚩 插旗）与 ~350ms 长按插旗防误触；
 * 5. 16×16 大棋盘移动端专属视口平滑横向滚动；
 * 6. 经典复古数码管剩余雷数、状态表情（😊/😮/😎/💥）与精准计时秒表；
 * 7. 原生 Web Audio 交互音效与战绩本地持久化。
 */
export default function MinesweeperGame() {
  usePageTitle('扫雷');
  const navigate = useNavigate();

  // 游戏基础与状态管理
  const [difficulty, setDifficulty] = useState('beginner');
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'
  const [mobileMode, setMobileMode] = useState('dig'); // 'dig' | 'flag'
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // 棋盘数据与本地战绩
  const [board, setBoard] = useState(() => {
    const config = DIFFICULTIES.beginner;
    return createInitialBoard(config.rows, config.cols);
  });
  const [records, setRecords] = useState(() => getGameRecord('minesweeper'));

  // 引用与定时器 Ref
  const elapsedTimeRef = useRef(0);
  elapsedTimeRef.current = elapsedTime;

  const modalTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const touchHandledRef = useRef(false);

  const currentConfig = DIFFICULTIES[difficulty];

  // 战绩数据计算
  const currentBestTime = useMemo(() => {
    if (difficulty === 'beginner') {
      return records.bestTimeBeginner;
    }
    return records.bestTimeIntermediate;
  }, [difficulty, records]);

  // 统计剩余未标记雷数（允许负数展示）
  const flaggedCount = useMemo(() => {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.isFlagged) count++;
      }
    }
    return count;
  }, [board]);

  const remainingMines = currentConfig.mines - flaggedCount;

  // 正确插旗数统计 (用于失败结算展示)
  const correctFlags = useMemo(() => {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.isFlagged && cell.isMine) count++;
      }
    }
    return count;
  }, [board]);

  // 秒表心跳定时器
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // 清理延迟弹窗定时器
  useEffect(() => {
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  /**
   * 游戏重开
   */
  const handleRestart = useCallback(() => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    setIsGameOverModalOpen(false);
    setGameState('idle');
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    const config = DIFFICULTIES[difficulty];
    setBoard(createInitialBoard(config.rows, config.cols));
  }, [difficulty]);

  /**
   * 切换难度
   */
  const handleDifficultyChange = useCallback((newDiff) => {
    if (newDiff === difficulty && gameState === 'idle') return;
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    setIsGameOverModalOpen(false);
    setDifficulty(newDiff);
    setGameState('idle');
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    const config = DIFFICULTIES[newDiff];
    setBoard(createInitialBoard(config.rows, config.cols));
  }, [difficulty, gameState]);

  /**
   * 游戏触雷失败
   */
  const handleGameOver = useCallback((currentBoard, hitR, hitC) => {
    setGameState('lost');
    gameAudio.playExplosion();
    gameAudio.playLose();

    // 翻开全场地雷并高亮踩爆的地雷与误插的旗帜
    const revealedBoard = currentBoard.map((row, r) =>
      row.map((cell, c) => {
        if (cell.isMine) {
          return {
            ...cell,
            isRevealed: true,
            isDetonated: r === hitR && c === hitC,
          };
        }
        if (cell.isFlagged && !cell.isMine) {
          return {
            ...cell,
            isWrongFlag: true,
          };
        }
        return cell;
      })
    );
    setBoard(revealedBoard);

    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    modalTimerRef.current = setTimeout(() => {
      setIsGameOverModalOpen(true);
    }, 600);
  }, []);

  /**
   * 游戏通关胜利
   */
  const handleGameVictory = useCallback((finalBoard) => {
    setGameState('won');
    gameAudio.playWin();

    // 自动将所有未插旗的地雷补插胜利旗帜
    const completedBoard = finalBoard.map((row) =>
      row.map((cell) => {
        if (cell.isMine && !cell.isFlagged) {
          return { ...cell, isFlagged: true };
        }
        return cell;
      })
    );
    setBoard(completedBoard);

    // 持久化最佳战绩
    const finalSeconds = Math.max(1, elapsedTimeRef.current);
    const updated = updateRecord('minesweeper', {
      level: difficulty,
      time: finalSeconds,
    });
    setRecords(updated);

    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    modalTimerRef.current = setTimeout(() => {
      setIsGameOverModalOpen(true);
    }, 600);
  }, [difficulty]);

  /**
   * 标记 / 取消插旗
   */
  const handleToggleFlag = useCallback((r, c) => {
    if (gameState === 'won' || gameState === 'lost') return;
    const target = board[r][c];
    if (target.isRevealed) return;

    gameAudio.playFlip();
    setBoard((prev) => toggleFlag(prev, r, c));
  }, [board, gameState]);

  /**
   * 点击挖掘格子（包含首击安全保证与连片展开）
   */
  const handleReveal = useCallback((r, c) => {
    if (gameState === 'won' || gameState === 'lost') return;

    const target = board[r][c];
    if (target.isRevealed || target.isFlagged) return;

    const config = DIFFICULTIES[difficulty];

    // 首击安全保证：第一次挖掘时才随机布雷，确保点击点及 8 邻域绝对安全
    if (gameState === 'idle') {
      const minedBoard = placeMines(board, config.rows, config.cols, config.mines, r, c);
      const { board: nextBoard, exploded } = revealCell(minedBoard, r, c);

      gameAudio.playMove();
      setBoard(nextBoard);
      setGameState('playing');

      if (checkVictory(nextBoard, config.mines)) {
        handleGameVictory(nextBoard);
      }
      return;
    }

    // 游戏中正常挖掘
    const { board: nextBoard, exploded } = revealCell(board, r, c);

    if (exploded) {
      handleGameOver(nextBoard, r, c);
    } else {
      gameAudio.playMove();
      setBoard(nextBoard);
      if (checkVictory(nextBoard, config.mines)) {
        handleGameVictory(nextBoard);
      }
    }
  }, [board, difficulty, gameState, handleGameOver, handleGameVictory]);

  /**
   * 双击/再次点击已揭开数字格智能开荒 (Chord)
   * 若周围标记的旗帜数等于该数字，自动揭开周围未标记的空格
   */
  const handleChord = useCallback((r, c) => {
    if (gameState !== 'playing') return;
    const target = board[r][c];
    if (!target.isRevealed || target.neighborMines === 0) return;

    const config = DIFFICULTIES[difficulty];
    const rows = config.rows;
    const cols = config.cols;

    let flagCount = 0;
    const unrevealedNeighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const neighbor = board[nr][nc];
          if (neighbor.isFlagged) {
            flagCount++;
          } else if (!neighbor.isRevealed) {
            unrevealedNeighbors.push({ r: nr, c: nc });
          }
        }
      }
    }

    // 仅当周围插旗数与数字严格一致且有可展开邻居时开荒
    if (flagCount !== target.neighborMines || unrevealedNeighbors.length === 0) {
      return;
    }

    let currentBoard = board;
    let explodedCell = null;

    for (const neighbor of unrevealedNeighbors) {
      const res = revealCell(currentBoard, neighbor.r, neighbor.c);
      currentBoard = res.board;
      if (res.exploded) {
        explodedCell = neighbor;
        break;
      }
    }

    if (explodedCell) {
      handleGameOver(currentBoard, explodedCell.r, explodedCell.c);
    } else {
      gameAudio.playMove();
      setBoard(currentBoard);
      if (checkVictory(currentBoard, config.mines)) {
        handleGameVictory(currentBoard);
      }
    }
  }, [board, difficulty, gameState, handleGameOver, handleGameVictory]);

  /**
   * 单元格统一点击入口
   */
  const handleCellClick = (r, c) => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    if (gameState === 'won' || gameState === 'lost') return;

    const cell = board[r][c];

    // 若已揭开且有邻域雷数，尝试双击智能开荒
    if (cell.isRevealed) {
      if (cell.neighborMines > 0) {
        handleChord(r, c);
      }
      return;
    }

    // 移动端插旗模式下，点击直接插旗
    if (mobileMode === 'flag') {
      handleToggleFlag(r, c);
      return;
    }

    // 挖掘模式下，已插旗格保护不被挖掘
    if (cell.isFlagged) {
      return;
    }

    handleReveal(r, c);
  };

  /**
   * 鼠标右键插旗
   */
  const handleContextMenu = (r, c, e) => {
    e.preventDefault();
    if (gameState === 'won' || gameState === 'lost') return;
    const cell = board[r][c];
    if (cell.isRevealed) return;
    handleToggleFlag(r, c);
  };

  /**
   * 移动端长按插旗触控处理 (~350ms)
   */
  const handleTouchStart = (r, c, e) => {
    if (gameState === 'won' || gameState === 'lost') return;
    if (!e.touches || e.touches.length === 0) return;

    touchStartPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isLongPressRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      touchHandledRef.current = true;
      if (navigator.vibrate) {
        try {
          navigator.vibrate(25);
        } catch {
          // 容错降级
        }
      }
      handleToggleFlag(r, c);
    }, 350);
  };

  const handleTouchMove = (e) => {
    if (!longPressTimerRef.current) return;
    if (!e.touches || e.touches.length === 0) return;
    const curX = e.touches[0].clientX;
    const curY = e.touches[0].clientY;
    const dist = Math.hypot(curX - touchStartPosRef.current.x, curY - touchStartPosRef.current.y);
    if (dist > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 键盘快捷键监听体系（严格避让 Ctrl+R / Cmd+R 浏览器刷新）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isHelpOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setMobileMode((prev) => (prev === 'dig' ? 'flag' : 'dig'));
      } else if (e.key === '1') {
        e.preventDefault();
        handleDifficultyChange('beginner');
      } else if (e.key === '2') {
        e.preventDefault();
        handleDifficultyChange('intermediate');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, handleRestart, handleDifficultyChange]);

  /**
   * 表情按钮根据游戏状态动态呈现
   */
  const getFaceEmoji = () => {
    if (gameState === 'won') return '😎';
    if (gameState === 'lost') return '💥';
    if (isPointerDown) return '😮';
    return '😊';
  };

  // 模态弹窗统计数据
  const isWin = gameState === 'won';
  const totalSafeCells = currentConfig.rows * currentConfig.cols - currentConfig.mines;

  const modalStats = isWin
    ? [
        { label: '难度', value: difficulty === 'beginner' ? '初级 (9×9)' : '中级 (16×16)' },
        { label: '通关耗时', value: `${elapsedTime} 秒`, highlight: true },
        { label: '最佳纪录', value: currentBestTime ? `${currentBestTime} 秒` : `${elapsedTime} 秒` },
        { label: '安全格子', value: `${totalSafeCells} 格` },
      ]
    : [
        { label: '难度', value: difficulty === 'beginner' ? '初级 (9×9)' : '中级 (16×16)' },
        { label: '坚持时间', value: `${elapsedTime} 秒` },
        { label: '排除地雷', value: `${correctFlags} / ${currentConfig.mines}` },
      ];

  return (
    <div className="game-page-container">
      {/* 统一顶部导航栏 */}
      <GameHeader
        title="扫雷"
        time={elapsedTime}
        onRestart={handleRestart}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="game-stage-wrapper">
        <div className="game-board-card minesweeper-card">
          {/* Apple HIG 分段难度选择器 */}
          <div className="minesweeper-diff-control" role="tablist" aria-label="难度选择">
            {Object.values(DIFFICULTIES).map((diff) => {
              const isSelected = difficulty === diff.key;
              return (
                <button
                  key={diff.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`minesweeper-diff-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleDifficultyChange(diff.key)}
                >
                  <span className="diff-name">{diff.name}</span>
                  <span className="diff-spec">{diff.rows}×{diff.cols}</span>
                </button>
              );
            })}
          </div>

          {/* 经典数码管与状态表情控制面板 */}
          <div className="minesweeper-dashboard">
            {/* 剩余雷数数码管 */}
            <div className="minesweeper-lcd-panel" title="剩余地雷计数 (地雷总数 - 插旗数)">
              <span className="minesweeper-lcd-label">MINES</span>
              <span className="minesweeper-lcd-digits">
                {remainingMines < 0
                  ? `-${String(Math.abs(remainingMines)).padStart(2, '0')}`
                  : String(Math.min(999, Math.max(0, remainingMines))).padStart(3, '0')}
              </span>
            </div>

            {/* 状态重置表情按钮 */}
            <button
              type="button"
              className="minesweeper-face-btn"
              onClick={handleRestart}
              title="重新开局 (快捷键: R)"
              aria-label="重新开局"
            >
              <span>{getFaceEmoji()}</span>
            </button>

            {/* 耗时秒表数码管 */}
            <div className="minesweeper-lcd-panel" title="本局耗时秒数">
              <span className="minesweeper-lcd-label">TIME</span>
              <span className="minesweeper-lcd-digits">
                {String(Math.min(999, elapsedTime)).padStart(3, '0')}
              </span>
            </div>
          </div>

          {/* 移动端单手模式切换胶囊 */}
          <div className="minesweeper-mode-toggle" role="group" aria-label="操作模式切换">
            <button
              type="button"
              className={`minesweeper-mode-btn ${mobileMode === 'dig' ? 'active-dig' : ''}`}
              onClick={() => setMobileMode('dig')}
              title="切换为挖掘模式 (快捷键: F)"
            >
              <span className="mode-icon">⛏️</span>
              <span className="mode-label">挖掘模式</span>
            </button>
            <button
              type="button"
              className={`minesweeper-mode-btn ${mobileMode === 'flag' ? 'active-flag' : ''}`}
              onClick={() => setMobileMode('flag')}
              title="切换为插旗模式 (快捷键: F)"
            >
              <span className="mode-icon">🚩</span>
              <span className="mode-label">插旗模式</span>
            </button>
          </div>

          {/* 棋盘视口（16×16 支持移动端平滑横向滚动） */}
          <div className="minesweeper-viewport">
            <div
              className={`minesweeper-grid grid-${difficulty}`}
              role="grid"
              aria-label="扫雷网格"
              onMouseLeave={() => setIsPointerDown(false)}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  let cellContent = null;
                  let cellClass = 'minesweeper-cell';

                  if (cell.isRevealed) {
                    cellClass += ' cell-revealed';
                    if (cell.isMine) {
                      if (cell.isDetonated) {
                        cellClass += ' cell-detonated';
                        cellContent = '💥';
                      } else {
                        cellClass += ' cell-mine';
                        cellContent = '💣';
                      }
                    } else if (cell.neighborMines > 0) {
                      cellClass += ` num-${cell.neighborMines}`;
                      cellContent = cell.neighborMines;
                    } else {
                      cellClass += ' cell-empty';
                    }
                  } else {
                    cellClass += ' cell-unrevealed';
                    if (cell.isWrongFlag) {
                      cellClass += ' cell-wrong-flag';
                      cellContent = '❌';
                    } else if (cell.isFlagged) {
                      cellClass += ' cell-flagged';
                      cellContent = '🚩';
                    }
                  }

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className={cellClass}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleContextMenu(r, c, e)}
                      onMouseDown={() => {
                        if (!cell.isRevealed && gameState !== 'won' && gameState !== 'lost') {
                          setIsPointerDown(true);
                        }
                      }}
                      onMouseUp={() => setIsPointerDown(false)}
                      onTouchStart={(e) => handleTouchStart(r, c, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchCancel}
                      aria-label={`第 ${r + 1} 行，第 ${c + 1} 列 ${cell.isRevealed ? (cell.isMine ? '地雷' : `${cell.neighborMines} 邻雷`) : (cell.isFlagged ? '已插旗' : '未揭开')}`}
                    >
                      {cellContent}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 底部战绩与快捷键指南说明 */}
          <div className="minesweeper-footer-info">
            <div className="minesweeper-record-badge">
              <span className="record-trophy">🏆</span>
              <span>
                {difficulty === 'beginner' ? '初级最佳: ' : '中级最佳: '}
                {currentBestTime !== null ? `${currentBestTime} 秒` : '暂无纪录'}
              </span>
            </div>

            <div className="minesweeper-shortcuts-hint">
              <span>💡 快捷键: <strong>R</strong> 重新开始 · <strong>F</strong> 切换模式 · <strong>1/2</strong> 切换难度</span>
            </div>
          </div>
        </div>
      </main>

      {/* 玩法说明模态弹窗 */}
      <GameHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="扫雷 (Minesweeper)"
        rules={[
          { label: '找出所有地雷', desc: '点击格子进行排查挖掘，当所有非地雷格子全部被揭开时即获胜。' },
          { label: '数字线索提示', desc: '格子中的数字代表其周围 8 个相邻格子中隐藏的地雷总数。' },
          { label: '首击绝对安全', desc: '开局首次点击绝对不会踩雷，并会自动展开连片安全区域。' },
          { label: '双击快捷开荒', desc: '点击已揭开的数字格，若周围标记的旗帜数等于该数字，将自动揭开其余未标记的相邻格。' },
          { label: '移动端支持', desc: '支持单手模式切换（⛏️ 挖掘 / 🚩 插旗），在挖掘模式下长按格子亦可快速插旗。' },
        ]}
        keys={[
          { key: '左键 / 点击', desc: '挖掘或点击数字智能开荒' },
          { key: '右键 / 长按', desc: '标记 / 取消插旗' },
          { key: 'F', desc: '切换挖掘 / 插旗模式' },
          { key: 'R', desc: '重新开局' },
          { key: '1 / 2', desc: '切换初级 / 中级难度' },
          { key: 'Esc', desc: '关闭弹窗指南' },
        ]}
      />

      {/* 游戏结束 / 通关胜利模态弹窗 */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        title={isWin ? '恭喜通关！' : '触雷爆炸'}
        subtitle={isWin ? '敏锐的逻辑推理！已成功排除所有危险地雷' : '踩到地雷了！调整心态，重新理清线索再来一局'}
        stats={modalStats}
        onRestart={handleRestart}
        onBackHome={() => navigate('/games')}
      />

      {/* 扫雷页面专用内嵌样式 */}
      <style>{`
        .minesweeper-card {
          max-width: 580px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Apple HIG 分段难度选择器 */
        .minesweeper-diff-control {
          display: inline-flex;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          padding: 3px;
          gap: 4px;
          margin-bottom: 1.15rem;
        }

        .minesweeper-diff-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          -webkit-tap-highlight-color: transparent;
        }

        .minesweeper-diff-btn:hover {
          color: var(--text-primary);
        }

        .minesweeper-diff-btn.active {
          background: var(--bg-surface);
          color: var(--accent-color);
          box-shadow: var(--shadow-sm);
          font-weight: 600;
        }

        .diff-spec {
          font-size: 0.725rem;
          color: var(--text-tertiary);
          font-family: ui-monospace, SFMono-Regular, monospace;
        }

        .minesweeper-diff-btn.active .diff-spec {
          color: var(--accent-color);
          opacity: 0.85;
        }

        /* 经典数码管与状态表情控制面板 */
        .minesweeper-dashboard {
          width: 100%;
          max-width: 440px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.65rem 1.25rem;
          margin-bottom: 0.95rem;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
        }

        .minesweeper-lcd-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .minesweeper-lcd-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          margin-bottom: 3px;
        }

        .minesweeper-lcd-digits {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 1.35rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.12em;
          padding: 4px 8px;
          border-radius: var(--radius-xs);
          background: #090d16;
          color: #ef4444;
          text-shadow: 0 0 8px rgba(239, 68, 68, 0.65);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
          user-select: none;
        }

        :root[data-theme='light'] .minesweeper-lcd-digits {
          background: #1e293b;
          color: #f87171;
        }

        .minesweeper-face-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .minesweeper-face-btn:hover {
          transform: scale(1.08);
          box-shadow: var(--shadow-md);
        }

        .minesweeper-face-btn:active {
          transform: scale(0.92);
        }

        /* 移动端单手模式切换胶囊 */
        .minesweeper-mode-toggle {
          display: inline-flex;
          align-items: center;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          padding: 3px;
          gap: 4px;
          margin-bottom: 1.15rem;
        }

        .minesweeper-mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.825rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          -webkit-tap-highlight-color: transparent;
        }

        .minesweeper-mode-btn.active-dig {
          background: var(--accent-light, rgba(59, 130, 246, 0.15));
          color: var(--accent-color, #3b82f6);
          font-weight: 600;
          box-shadow: var(--shadow-sm);
        }

        .minesweeper-mode-btn.active-flag {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          font-weight: 600;
          box-shadow: var(--shadow-sm);
        }

        /* 棋盘滚动视口与自适应 Grid */
        .minesweeper-viewport {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          display: flex;
          justify-content: center;
          padding: 6px;
          box-sizing: border-box;
          border-radius: var(--radius-md);
        }

        .minesweeper-grid {
          display: grid;
          gap: 4px;
          user-select: none;
          -webkit-touch-callout: none;
          box-sizing: border-box;
          margin: 0 auto;
        }

        .grid-beginner {
          grid-template-columns: repeat(9, 38px);
          grid-template-rows: repeat(9, 38px);
        }

        .grid-intermediate {
          grid-template-columns: repeat(16, 28px);
          grid-template-rows: repeat(16, 28px);
          gap: 3px;
        }

        /* 单元格外观与状态体系 */
        .minesweeper-cell {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-xs, 5px);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 1.05rem;
          font-weight: 800;
          cursor: pointer;
          box-sizing: border-box;
          transition: background-color 0.12s ease, transform 0.08s ease, border-color 0.12s ease;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          -webkit-touch-callout: none;
          padding: 0;
          outline: none;
        }

        .grid-intermediate .minesweeper-cell {
          font-size: 0.85rem;
          border-radius: 4px;
        }

        /* 未揭开格子（磨砂微凸质感） */
        .cell-unrevealed {
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .cell-unrevealed:hover {
          background: var(--bg-hover);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }

        .cell-unrevealed:active {
          transform: translateY(1px);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        /* 已揭开格子（微凹平整质感） */
        .cell-revealed {
          background: rgba(0, 0, 0, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.22);
          cursor: default;
        }

        :root[data-theme='light'] .cell-revealed {
          background: #e2e8f0;
          border: 1px solid #cbd5e1;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
        }

        .cell-revealed.cell-empty {
          opacity: 0.65;
        }

        /* 踩雷爆炸动效 */
        .cell-detonated {
          background: #ef4444 !important;
          color: #ffffff !important;
          animation: explodePulse 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 18px rgba(239, 68, 68, 0.85) !important;
        }

        @keyframes explodePulse {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .cell-mine {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
        }

        .cell-wrong-flag {
          background: rgba(239, 68, 68, 0.2) !important;
          border-color: #ef4444 !important;
        }

        .cell-flagged {
          color: #ef4444;
          filter: drop-shadow(0 1px 2px rgba(239, 68, 68, 0.4));
        }

        /* 数字 1-8 科技高亮色彩体系 */
        .num-1 { color: #3b82f6; text-shadow: 0 0 8px rgba(59, 130, 246, 0.35); }
        .num-2 { color: #10b981; text-shadow: 0 0 8px rgba(16, 185, 129, 0.35); }
        .num-3 { color: #ef4444; text-shadow: 0 0 8px rgba(239, 68, 68, 0.35); }
        .num-4 { color: #8b5cf6; text-shadow: 0 0 8px rgba(139, 92, 246, 0.35); }
        .num-5 { color: #f59e0b; text-shadow: 0 0 8px rgba(245, 158, 11, 0.35); }
        .num-6 { color: #06b6d4; text-shadow: 0 0 8px rgba(6, 182, 212, 0.35); }
        .num-7 { color: #ec4899; text-shadow: 0 0 8px rgba(236, 72, 153, 0.35); }
        .num-8 { color: #94a3b8; text-shadow: 0 0 8px rgba(148, 163, 184, 0.35); }

        /* 底部战绩与提示信息 */
        .minesweeper-footer-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          margin-top: 1.25rem;
          width: 100%;
          user-select: none;
        }

        .minesweeper-record-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.85rem;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          font-size: 0.825rem;
          color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
        }

        .record-trophy {
          font-size: 0.95rem;
        }

        .minesweeper-shortcuts-hint {
          font-size: 0.775rem;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.4;
        }

        .minesweeper-shortcuts-hint strong {
          color: var(--text-secondary);
        }

        /* 移动端响应式断点微调 */
        @media (max-width: 480px) {
          .minesweeper-card {
            padding: 1rem 0.75rem;
          }

          .grid-beginner {
            grid-template-columns: repeat(9, 33px);
            grid-template-rows: repeat(9, 33px);
            gap: 3px;
          }

          .grid-intermediate {
            grid-template-columns: repeat(16, 27px);
            grid-template-rows: repeat(16, 27px);
            gap: 2.5px;
          }

          .minesweeper-dashboard {
            padding: 0.5rem 0.85rem;
          }

          .minesweeper-lcd-digits {
            font-size: 1.15rem;
            padding: 3px 6px;
          }

          .minesweeper-face-btn {
            width: 38px;
            height: 38px;
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
