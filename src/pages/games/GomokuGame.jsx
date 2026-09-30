import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../../components/games/GameHeader.jsx';
import GameHelpModal from '../../components/games/GameHelpModal.jsx';
import GameOverModal from '../../components/games/GameOverModal.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import {
  BOARD_SIZE,
  EMPTY,
  BLACK,
  WHITE,
  createEmptyBoard,
  checkGomokuWin,
  getBestMove,
  undoLastMove,
} from '../../utils/games/gomokuLogic.js';
import { gameAudio } from '../../utils/gameAudio.js';
import { getGameRecord, updateRecord } from '../../utils/gameStorage.js';
import './GamesCommon.css';

/**
 * 棋盘几何常数 (SVG Coordinate System)
 * 15×15 棋盘，边距 40px，单元格间距 40px，总尺寸 640×640px
 */
const PADDING = 40;
const CELL_SIZE = 40;
const SVG_SIZE = 640;
const STONE_RADIUS = 17;

/**
 * 5 处关键星位与天元坐标 (3,3), (3,11), (7,7), (11,3), (11,11)
 */
const STAR_POINTS = [
  [3, 3],
  [3, 11],
  [7, 7],
  [11, 3],
  [11, 11],
];

/**
 * 难度配置
 */
const DIFFICULTIES = [
  { key: 'beginner', label: '入门', title: '1层贪心评估 · 轻松上手' },
  { key: 'intermediate', label: '进阶', title: '2层 Minimax · 攻守兼备' },
  { key: 'master', label: '大师', title: '3层 Alpha-Beta 剪枝 · 算无遗策' },
];

/**
 * 执子选择配置
 */
const SIDES = [
  { key: BLACK, label: '执黑先手', stone: '●' },
  { key: WHITE, label: '执白后手', stone: '○' },
];

/**
 * 五子棋人机对弈主组件 (GomokuGame)
 *
 * 核心特性：
 * 1. 15×15 雅致拟真棋盘：黑曜石/暗木纹玻璃质感，高精度网格线与天元星位；
 * 2. 拟真 3D 棋子：SVG 径向渐变（黑子墨曜质感高光，白子温润如玉透光），柔和落子投影；
 * 3. 悬停反馈与准星：鼠标悬停显示十字交叉虚线准星与半透明虚影（Ghost Stone）；
 * 4. 关键标记：最新一手棋带有呼吸动效红点指示，胜利 5 连珠有高光金线与光晕串联；
 * 5. 异步 AI 推演：内置 150ms 推演延迟与呼吸提示，防止主线程阻塞卡顿；
 * 6. 悔棋 (Undo)：支持一步回退两手（AI + 玩家），支持从终局悔棋重算；
 * 7. 响应式视口：基于 SVG viewBox 实现 340px ~ 640px 全平台自适应与防误触触控。
 */
export default function GomokuGame() {
  usePageTitle('五子棋');
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const aiTimeoutRef = useRef(null);

  // 对局配置与核心状态
  const [difficulty, setDifficulty] = useState('intermediate');
  const [playerColor, setPlayerColor] = useState(BLACK);
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [history, setHistory] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(BLACK);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'won' | 'lost' | 'draw'
  const [winningLine, setWinningLine] = useState([]);
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [hoverCoord, setHoverCoord] = useState(null);

  // 弹窗与战绩管理
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [record, setRecord] = useState(() => getGameRecord('gomoku'));

  const aiColor = playerColor === BLACK ? WHITE : BLACK;

  // 组件卸载时清理未完成的 AI 计时器
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  /**
   * 启动新对局
   */
  const handleRestart = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsAiThinking(false);
    setGameState('playing');
    setWinner(null);
    setWinningLine([]);
    setHoverCoord(null);
    setIsGameOverModalOpen(false);

    if (playerColor === WHITE) {
      // 执白后手时，AI 执黑先手落子于天元 (7, 7)
      const initialBoard = createEmptyBoard();
      initialBoard[7][7] = BLACK;
      setBoard(initialBoard);
      setHistory([{ row: 7, col: 7, color: BLACK }]);
      setLastMove([7, 7]);
      setCurrentTurn(WHITE);
      gameAudio.playGomokuStone();
    } else {
      setBoard(createEmptyBoard());
      setHistory([]);
      setLastMove(null);
      setCurrentTurn(BLACK);
    }
  }, [playerColor]);

  /**
   * 切换执子阵营
   */
  const handleSelectSide = useCallback(
    (newColor) => {
      if (newColor === playerColor && gameState === 'playing' && history.length > 0) return;
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      setPlayerColor(newColor);
      setIsAiThinking(false);
      setGameState('playing');
      setWinner(null);
      setWinningLine([]);
      setHoverCoord(null);
      setIsGameOverModalOpen(false);

      if (newColor === WHITE) {
        // AI 执黑先手落子天元
        const initialBoard = createEmptyBoard();
        initialBoard[7][7] = BLACK;
        setBoard(initialBoard);
        setHistory([{ row: 7, col: 7, color: BLACK }]);
        setLastMove([7, 7]);
        setCurrentTurn(WHITE);
        gameAudio.playGomokuStone();
      } else {
        setBoard(createEmptyBoard());
        setHistory([]);
        setLastMove(null);
        setCurrentTurn(BLACK);
      }
    },
    [playerColor, gameState, history.length]
  );

  /**
   * 悔棋逻辑：回退 2 步（回退自身与 AI 上一手落子）
   */
  const canUndo = useMemo(() => {
    if (isAiThinking) return false;
    if (playerColor === WHITE) {
      return history.length >= 3;
    }
    return history.length >= 2;
  }, [isAiThinking, playerColor, history.length]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsAiThinking(false);

    const { newBoard, newHistory } = undoLastMove(history);
    setBoard(newBoard);
    setHistory(newHistory);
    setLastMove(
      newHistory.length > 0
        ? [newHistory[newHistory.length - 1].row, newHistory[newHistory.length - 1].col]
        : null
    );
    setGameState('playing');
    setWinner(null);
    setWinningLine([]);
    setHoverCoord(null);
    setIsGameOverModalOpen(false);
    setCurrentTurn(playerColor);
    gameAudio.playMove();
  }, [canUndo, history, playerColor]);

  /**
   * 玩家落子响应
   */
  const handleCellClick = useCallback(
    (row, col) => {
      if (
        gameState !== 'playing' ||
        isAiThinking ||
        currentTurn !== playerColor ||
        board[row][col] !== EMPTY
      ) {
        return;
      }

      setHoverCoord(null);

      // 1. 玩家落子并更新棋盘
      const nextBoard = board.map((r) => [...r]);
      nextBoard[row][col] = playerColor;
      const nextHistory = [...history, { row, col, color: playerColor }];

      setBoard(nextBoard);
      setHistory(nextHistory);
      setLastMove([row, col]);
      gameAudio.playGomokuStone();

      // 2. 检查玩家是否获胜
      const playerWinRes = checkGomokuWin(nextBoard, row, col);
      if (playerWinRes.win) {
        setGameState('won');
        setWinner(playerColor);
        setWinningLine(playerWinRes.winningLine);
        const updated = updateRecord('gomoku', { isWin: true });
        setRecord(updated);
        gameAudio.playWin();
        setIsGameOverModalOpen(true);
        return;
      }

      // 3. 检查是否棋盘下满和棋
      if (nextHistory.length >= BOARD_SIZE * BOARD_SIZE) {
        setGameState('draw');
        const updated = updateRecord('gomoku', { isWin: false });
        setRecord(updated);
        setIsGameOverModalOpen(true);
        return;
      }

      // 4. 切换为 AI 回合，展示推演动画并异步运算
      setCurrentTurn(aiColor);
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        const aiMove = getBestMove(nextBoard, aiColor, difficulty);
        if (!aiMove) {
          setIsAiThinking(false);
          return;
        }

        const [aiRow, aiCol] = aiMove;
        const aiBoard = nextBoard.map((r) => [...r]);
        aiBoard[aiRow][aiCol] = aiColor;
        const aiHistory = [...nextHistory, { row: aiRow, col: aiCol, color: aiColor }];

        setBoard(aiBoard);
        setHistory(aiHistory);
        setLastMove([aiRow, aiCol]);
        gameAudio.playGomokuStone();

        // 5. 检查 AI 是否获胜
        const aiWinRes = checkGomokuWin(aiBoard, aiRow, aiCol);
        if (aiWinRes.win) {
          setGameState('lost');
          setWinner(aiColor);
          setWinningLine(aiWinRes.winningLine);
          const updated = updateRecord('gomoku', { isWin: false });
          setRecord(updated);
          gameAudio.playLose();
          setIsGameOverModalOpen(true);
          setIsAiThinking(false);
          return;
        }

        if (aiHistory.length >= BOARD_SIZE * BOARD_SIZE) {
          setGameState('draw');
          const updated = updateRecord('gomoku', { isWin: false });
          setRecord(updated);
          setIsGameOverModalOpen(true);
          setIsAiThinking(false);
          return;
        }

        setCurrentTurn(playerColor);
        setIsAiThinking(false);
      }, 150);
    },
    [gameState, isAiThinking, currentTurn, playerColor, board, history, aiColor, difficulty]
  );

  /**
   * 将屏幕鼠标或触控坐标换算为 15×15 棋盘索引
   */
  const getBoardCoordFromEvent = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null);
    if (clientX === null || clientY === null) return null;

    const svgX = ((clientX - rect.left) / rect.width) * SVG_SIZE;
    const svgY = ((clientY - rect.top) / rect.height) * SVG_SIZE;

    const col = Math.round((svgX - PADDING) / CELL_SIZE);
    const row = Math.round((svgY - PADDING) / CELL_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      // 容差判定：距离交叉点半径 22px 内判定为有效瞄准，防止偏误
      const centerX = PADDING + col * CELL_SIZE;
      const centerY = PADDING + row * CELL_SIZE;
      const distSq = (svgX - centerX) ** 2 + (svgY - centerY) ** 2;
      if (distSq <= 24 * 24) {
        return { row, col };
      }
    }
    return null;
  }, []);

  const handleSvgMouseMove = useCallback(
    (e) => {
      if (gameState !== 'playing' || isAiThinking || currentTurn !== playerColor) {
        if (hoverCoord) setHoverCoord(null);
        return;
      }
      const coord = getBoardCoordFromEvent(e);
      if (coord && board[coord.row][coord.col] === EMPTY) {
        if (!hoverCoord || hoverCoord.row !== coord.row || hoverCoord.col !== coord.col) {
          setHoverCoord(coord);
        }
      } else {
        if (hoverCoord) setHoverCoord(null);
      }
    },
    [gameState, isAiThinking, currentTurn, playerColor, getBoardCoordFromEvent, board, hoverCoord]
  );

  const handleSvgMouseLeave = useCallback(() => {
    setHoverCoord(null);
  }, []);

  const handleSvgClick = useCallback(
    (e) => {
      const coord = getBoardCoordFromEvent(e);
      if (coord) {
        handleCellClick(coord.row, coord.col);
      }
    },
    [getBoardCoordFromEvent, handleCellClick]
  );

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isHelpOpen || isGameOverModalOpen) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
      } else if (e.key === 'u' || e.key === 'U' || ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z'))) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === '1') {
        setDifficulty('beginner');
      } else if (e.key === '2') {
        setDifficulty('intermediate');
      } else if (e.key === '3') {
        setDifficulty('master');
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, isGameOverModalOpen, handleRestart, handleUndo]);

  // 战绩衍生数据
  const winRate = useMemo(() => {
    if (!record || !record.playCount) return 0;
    return Math.round(((record.wins || 0) / record.playCount) * 100);
  }, [record]);

  // 连五获胜线首尾坐标
  const winningLineEndpoints = useMemo(() => {
    if (!winningLine || winningLine.length < 2) return null;
    const sorted = [...winningLine].sort((a, b) =>
      a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]
    );
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    return {
      x1: PADDING + start[1] * CELL_SIZE,
      y1: PADDING + start[0] * CELL_SIZE,
      x2: PADDING + end[1] * CELL_SIZE,
      y2: PADDING + end[0] * CELL_SIZE,
    };
  }, [winningLine]);

  return (
    <div className="game-page-container">
      {/* 顶部通用导航与控制栏 */}
      <GameHeader
        title="五子棋"
        turns={history.length}
        onRestart={handleRestart}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="game-stage-wrapper">
        <div className="game-board-card gomoku-card">
          {/* 对局配置栏：难度切换、执子选择、悔棋与重开 */}
          <div className="gomoku-controls-wrapper" role="toolbar" aria-label="对弈设置与操作栏">
            {/* 难度选择 Segmented Control */}
            <div className="gomoku-control-group" role="group" aria-label="难度选择">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.key}
                  type="button"
                  className={`gomoku-control-btn ${difficulty === diff.key ? 'active' : ''}`}
                  onClick={() => setDifficulty(diff.key)}
                  title={diff.title}
                >
                  {diff.label}
                </button>
              ))}
            </div>

            {/* 执子选择 Segmented Control */}
            <div className="gomoku-control-group" role="group" aria-label="执子选择">
              {SIDES.map((side) => (
                <button
                  key={side.key}
                  type="button"
                  className={`gomoku-control-btn ${playerColor === side.key ? 'active' : ''}`}
                  onClick={() => handleSelectSide(side.key)}
                  title={`切换为${side.label}`}
                >
                  <span style={{ fontSize: '0.85rem' }}>{side.stone}</span>
                  <span>{side.label}</span>
                </button>
              ))}
            </div>

            {/* 悔棋与重开按钮组 */}
            <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="gomoku-action-btn"
                onClick={handleUndo}
                disabled={!canUndo}
                title="悔棋 (快捷键 U / Ctrl+Z)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
                <span>悔棋</span>
              </button>

              <button
                type="button"
                className="gomoku-action-btn"
                onClick={handleRestart}
                title="重新开始 (快捷键 R)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>重开</span>
              </button>
            </div>
          </div>

          {/* 回合与推演状态呼吸条 */}
          <div className="gomoku-status-bar" aria-live="polite">
            {isAiThinking ? (
              <div className="gomoku-turn-badge ai-thinking">
                <span className="gomoku-thinking-dot" />
                <span>AI 正在推演棋局...</span>
              </div>
            ) : gameState === 'won' ? (
              <div className="gomoku-turn-badge victory">
                <span>🏆 恭喜获胜！五子连珠！</span>
              </div>
            ) : gameState === 'lost' ? (
              <div className="gomoku-turn-badge defeat">
                <span>🤖 AI 技高一筹，胜负已分！</span>
              </div>
            ) : gameState === 'draw' ? (
              <div className="gomoku-turn-badge">
                <span>🤝 势均力敌 · 和棋！</span>
              </div>
            ) : (
              <div className="gomoku-turn-badge player-turn">
                <span
                  className="gomoku-turn-stone-dot"
                  style={{
                    backgroundColor: currentTurn === BLACK ? '#171717' : '#f5f5f5',
                    boxShadow:
                      currentTurn === BLACK
                        ? '0 0 0 1.5px #525252, 0 1px 3px rgba(0,0,0,0.5)'
                        : '0 0 0 1.5px #d4d4d8, 0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
                <span>轮到您落子 ({playerColor === BLACK ? '执黑' : '执白'})</span>
              </div>
            )}
          </div>

          {/* 15×15 雅致 SVG 棋盘 */}
          <div className="gomoku-svg-wrap">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              className="gomoku-board-svg"
              onClick={handleSvgClick}
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={handleSvgMouseLeave}
              role="region"
              aria-label="五子棋对弈棋盘"
            >
              <defs>
                {/* 棋盘底纹径向暗木纹/黑曜石质感渐变 */}
                <radialGradient id="gomokuBoardGrad" cx="50%" cy="50%" r="75%">
                  <stop offset="0%" stopColor="#2c221a" />
                  <stop offset="55%" stopColor="#1e1712" />
                  <stop offset="100%" stopColor="#140f0c" />
                </radialGradient>

                {/* 黑子渐变：黑曜石墨光、柔和漫反射 */}
                <radialGradient id="blackStoneGrad" cx="30%" cy="26%" r="68%" fx="26%" fy="22%">
                  <stop offset="0%" stopColor="#5f6670" />
                  <stop offset="20%" stopColor="#32363d" />
                  <stop offset="60%" stopColor="#17191c" />
                  <stop offset="90%" stopColor="#0d0e10" />
                  <stop offset="100%" stopColor="#050506" />
                </radialGradient>

                {/* 白子渐变：温润白玉透光、晶莹质感 */}
                <radialGradient id="whiteStoneGrad" cx="30%" cy="26%" r="70%" fx="26%" fy="22%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#f4f4f6" />
                  <stop offset="68%" stopColor="#d8dce2" />
                  <stop offset="92%" stopColor="#b4b9c2" />
                  <stop offset="100%" stopColor="#8e949e" />
                </radialGradient>

                {/* 棋子拟真软阴影 */}
                <filter id="stoneShadow" x="-30%" y="-30%" width="165%" height="165%">
                  <feDropShadow dx="0" dy="3.5" stdDeviation="3.2" floodColor="rgba(0,0,0,0.65)" />
                </filter>

                {/* 获胜 5 连珠发光特效 */}
                <filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. 棋盘底板 */}
              <rect
                x="4"
                y="4"
                width={SVG_SIZE - 8}
                height={SVG_SIZE - 8}
                rx="16"
                fill="url(#gomokuBoardGrad)"
                stroke="rgba(218, 165, 32, 0.35)"
                strokeWidth="2"
              />

              {/* 外圈装饰细边框 */}
              <rect
                x="18"
                y="18"
                width={SVG_SIZE - 36}
                height={SVG_SIZE - 36}
                rx="10"
                fill="none"
                stroke="rgba(218, 165, 32, 0.2)"
                strokeWidth="1.2"
              />

              {/* 2. 坐标刻度标示 (外边距 1-15, A-O) */}
              {Array.from({ length: BOARD_SIZE }).map((_, i) => {
                const pos = PADDING + i * CELL_SIZE;
                const colChar = String.fromCharCode(65 + i); // A - O
                const rowNum = 15 - i; // 15 - 1
                return (
                  <React.Fragment key={`label-${i}`}>
                    {/* 顶部与底部字母坐标 */}
                    <text
                      x={pos}
                      y="14"
                      textAnchor="middle"
                      fill="rgba(218, 165, 32, 0.45)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {colChar}
                    </text>
                    <text
                      x={pos}
                      y={SVG_SIZE - 8}
                      textAnchor="middle"
                      fill="rgba(218, 165, 32, 0.45)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {colChar}
                    </text>
                    {/* 左侧与右侧数字坐标 */}
                    <text
                      x="11"
                      y={pos + 3}
                      textAnchor="middle"
                      fill="rgba(218, 165, 32, 0.45)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {rowNum}
                    </text>
                    <text
                      x={SVG_SIZE - 11}
                      y={pos + 3}
                      textAnchor="middle"
                      fill="rgba(218, 165, 32, 0.45)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {rowNum}
                    </text>
                  </React.Fragment>
                );
              })}

              {/* 3. 棋盘 15×15 网格线 */}
              {Array.from({ length: BOARD_SIZE }).map((_, i) => {
                const pos = PADDING + i * CELL_SIZE;
                return (
                  <React.Fragment key={`grid-${i}`}>
                    {/* 水平线 */}
                    <line
                      x1={PADDING}
                      y1={pos}
                      x2={SVG_SIZE - PADDING}
                      y2={pos}
                      stroke="rgba(218, 165, 32, 0.32)"
                      strokeWidth={i === 0 || i === BOARD_SIZE - 1 ? '1.6' : '1'}
                    />
                    {/* 垂直线 */}
                    <line
                      x1={pos}
                      y1={PADDING}
                      x2={pos}
                      y2={SVG_SIZE - PADDING}
                      stroke="rgba(218, 165, 32, 0.32)"
                      strokeWidth={i === 0 || i === BOARD_SIZE - 1 ? '1.6' : '1'}
                    />
                  </React.Fragment>
                );
              })}

              {/* 4. 天元与 4 处星位定位圆点 */}
              {STAR_POINTS.map(([sr, sc]) => (
                <circle
                  key={`star-${sr}-${sc}`}
                  cx={PADDING + sc * CELL_SIZE}
                  cy={PADDING + sr * CELL_SIZE}
                  r="4.2"
                  fill="rgba(218, 165, 32, 0.85)"
                />
              ))}

              {/* 5. 鼠标悬停十字准星线与半透明虚影 (Ghost Stone) */}
              {hoverCoord && (
                <g pointerEvents="none">
                  {/* 水平瞄准指示虚线 */}
                  <line
                    x1={PADDING}
                    y1={PADDING + hoverCoord.row * CELL_SIZE}
                    x2={SVG_SIZE - PADDING}
                    y2={PADDING + hoverCoord.row * CELL_SIZE}
                    stroke="var(--accent-color, #3b82f6)"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    opacity="0.45"
                  />
                  {/* 垂直瞄准指示虚线 */}
                  <line
                    x1={PADDING + hoverCoord.col * CELL_SIZE}
                    y1={PADDING}
                    x2={PADDING + hoverCoord.col * CELL_SIZE}
                    y2={SVG_SIZE - PADDING}
                    stroke="var(--accent-color, #3b82f6)"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    opacity="0.45"
                  />
                  {/* 准星落点圆环 */}
                  <circle
                    cx={PADDING + hoverCoord.col * CELL_SIZE}
                    cy={PADDING + hoverCoord.row * CELL_SIZE}
                    r="8.5"
                    fill="none"
                    stroke="var(--accent-color, #3b82f6)"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                  {/* 半透明落子虚影 */}
                  <circle
                    cx={PADDING + hoverCoord.col * CELL_SIZE}
                    cy={PADDING + hoverCoord.row * CELL_SIZE}
                    r={STONE_RADIUS}
                    fill={playerColor === BLACK ? 'url(#blackStoneGrad)' : 'url(#whiteStoneGrad)'}
                    opacity="0.42"
                  />
                </g>
              )}

              {/* 6. 已下棋子渲染 */}
              {board.map((rowArr, r) =>
                rowArr.map((cell, c) => {
                  if (cell === EMPTY) return null;
                  const cx = PADDING + c * CELL_SIZE;
                  const cy = PADDING + r * CELL_SIZE;
                  const isBlack = cell === BLACK;
                  const isLastPlaced = lastMove && lastMove[0] === r && lastMove[1] === c;
                  const isInWinningLine = winningLine.some(
                    ([wr, wc]) => wr === r && wc === c
                  );

                  return (
                    <g key={`stone-${r}-${c}`}>
                      {/* 棋子主体及立体阴影 */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={STONE_RADIUS}
                        fill={isBlack ? 'url(#blackStoneGrad)' : 'url(#whiteStoneGrad)'}
                        filter="url(#stoneShadow)"
                      />

                      {/* 3D 凸面月牙高光 (Specular Highlight) */}
                      {isBlack ? (
                        <ellipse
                          cx={cx - 4.8}
                          cy={cy - 5.2}
                          rx={5}
                          ry={2.8}
                          fill="rgba(255, 255, 255, 0.22)"
                          transform={`rotate(-35 ${cx - 4.8} ${cy - 5.2})`}
                          pointerEvents="none"
                        />
                      ) : (
                        <ellipse
                          cx={cx - 4.8}
                          cy={cy - 5.2}
                          rx={5.5}
                          ry={3.2}
                          fill="rgba(255, 255, 255, 0.75)"
                          transform={`rotate(-35 ${cx - 4.8} ${cy - 5.2})`}
                          pointerEvents="none"
                        />
                      )}

                      {/* 最后一步落子呼吸红点标记 */}
                      {isLastPlaced && !isInWinningLine && (
                        <g pointerEvents="none">
                          <circle cx={cx} cy={cy} r="3.6" fill="#ef4444" />
                          <circle
                            cx={cx}
                            cy={cy}
                            r="8"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.6"
                            className="last-move-ripple"
                          />
                        </g>
                      )}

                      {/* 获胜 5 连珠棋子闪耀光圈 */}
                      {isInWinningLine && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={STONE_RADIUS + 3.5}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="2.8"
                          filter="url(#glowGold)"
                          className="winning-stone-halo"
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  );
                })
              )}

              {/* 7. 获胜 5 连珠金色发光串联线 */}
              {winningLineEndpoints && (
                <line
                  x1={winningLineEndpoints.x1}
                  y1={winningLineEndpoints.y1}
                  x2={winningLineEndpoints.x2}
                  y2={winningLineEndpoints.y2}
                  stroke="#fbbf24"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  filter="url(#glowGold)"
                  className="winning-line-glow"
                  pointerEvents="none"
                />
              )}
            </svg>
          </div>

          {/* 底部对弈统计与快捷键说明 */}
          <div className="gomoku-footer-info">
            <div className="gomoku-stats-row">
              <span className="gomoku-stat-pill">
                <span>胜率:</span>
                <strong>{winRate}%</strong>
              </span>
              <span className="gomoku-stat-pill">
                <span>胜场:</span>
                <strong>{record.wins || 0} 胜</strong>
              </span>
              <span className="gomoku-stat-pill">
                <span>总对局:</span>
                <strong>{record.playCount || 0} 局</strong>
              </span>
              <span className="gomoku-stat-pill">
                <span>当前手数:</span>
                <strong>{history.length} 手</strong>
              </span>
            </div>

            <div className="gomoku-shortcuts-hint">
              <span>💡 快捷键: <strong>R</strong> 重开 · <strong>U</strong> 悔棋 · <strong>1/2/3</strong> 难度 · <strong>?</strong> 帮助指南</span>
            </div>
          </div>
        </div>
      </main>

      {/* 玩法说明模态弹窗 */}
      <GameHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="五子棋 (Gomoku)"
        rules={[
          { label: '核心胜利条件', desc: '在 15×15 棋盘的横、竖、正斜、反斜任一轴向率先达成连续 5 颗相同颜色棋子即宣告获胜。' },
          { label: '执黑先手开局', desc: '标准对局默认执黑先行；若选择执白后手，AI 将执黑先手落子于天元中心 (7,7)。' },
          { label: '人机推演引擎', desc: '入门级采用快速贪心启发式，进阶与大师级采用多层 Minimax 极大极小博弈树与 Alpha-Beta 剪枝。' },
          { label: '悔棋与落子辅助', desc: '支持悔棋回退 2 步（回退自身及 AI 上一步）；鼠标悬停空位时有十字准星与半透明虚影预览。' },
        ]}
        keys={[
          { key: '左键 / 点击', desc: '在交叉点落子' },
          { key: 'U / Z', desc: '悔棋 (撤回最近两手)' },
          { key: 'R', desc: '重新开始新对局' },
          { key: '1 / 2 / 3', desc: '切换入门 / 进阶 / 大师难度' },
          { key: 'Esc', desc: '关闭弹窗指南' },
        ]}
      />

      {/* 游戏结束 / 通关胜利结算弹窗 */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        title={
          gameState === 'won'
            ? '旗开得胜 · 恭喜获胜！'
            : gameState === 'lost'
            ? '遗憾落败'
            : '和棋 · 势均力敌'
        }
        subtitle={
          gameState === 'won'
            ? '五子连珠！精妙绝伦的攻防推演对弈！'
            : gameState === 'lost'
            ? 'AI 技高一筹，棋逢对手，复盘再战！'
            : '全盘棋子尽数落定，难分伯仲！'
        }
        stats={[
          { label: '本局手数', value: `${history.length} 手`, highlight: true },
          { label: '历史胜率', value: `${winRate}%` },
          { label: '累计胜场', value: `${record.wins || 0} 场` },
          { label: '累计对局', value: `${record.playCount || 0} 局` },
        ]}
        onRestart={handleRestart}
        onBackHome={() => navigate('/games')}
      />

      {/* 五子棋专属内嵌样式 */}
      <style>{`
        .gomoku-card {
          max-width: 620px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .gomoku-controls-wrapper {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.65rem;
          width: 100%;
        }

        .gomoku-control-group {
          display: inline-flex;
          align-items: center;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          padding: 3px;
          gap: 3px;
        }

        .gomoku-control-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          border-radius: var(--radius-pill);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.825rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .gomoku-control-btn:hover:not(:disabled) {
          color: var(--text-primary);
        }

        .gomoku-control-btn.active {
          background: var(--bg-surface);
          color: var(--accent-color);
          box-shadow: var(--shadow-sm);
          font-weight: 600;
        }

        .gomoku-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 32px;
          padding: 0 11px;
          font-size: 0.825rem;
          font-weight: 500;
          border-radius: var(--radius-pill);
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }

        .gomoku-action-btn:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-hover);
          transform: scale(1.02);
        }

        .gomoku-action-btn:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .gomoku-status-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .gomoku-turn-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: var(--radius-pill);
          font-size: 0.85rem;
          font-weight: 600;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease;
        }

        .gomoku-turn-badge.ai-thinking {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.4);
          color: #3b82f6;
          animation: gomokuBadgeBreath 1.5s ease-in-out infinite alternate;
        }

        @keyframes gomokuBadgeBreath {
          0% { box-shadow: 0 0 6px rgba(59, 130, 246, 0.2); }
          100% { box-shadow: 0 0 16px rgba(59, 130, 246, 0.45); }
        }

        .gomoku-turn-badge.victory {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.4);
          color: #10b981;
        }

        .gomoku-turn-badge.defeat {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }

        .gomoku-thinking-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3b82f6;
          animation: gomokuDotPulse 1s ease-in-out infinite;
        }

        @keyframes gomokuDotPulse {
          0%, 100% { transform: scale(0.75); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        .gomoku-turn-stone-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: inline-block;
        }

        .gomoku-svg-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          user-select: none;
          touch-action: manipulation;
          -webkit-touch-callout: none;
          filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.32));
        }

        .gomoku-board-svg {
          width: 100%;
          max-width: 580px;
          height: auto;
          display: block;
          border-radius: 16px;
          cursor: crosshair;
        }

        .last-move-ripple {
          transform-origin: center;
          animation: lastMoveRippleAnim 1.4s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        @keyframes lastMoveRippleAnim {
          0% { transform: scale(0.8); opacity: 0.95; }
          60% { transform: scale(1.45); opacity: 0.15; }
          100% { transform: scale(1.45); opacity: 0; }
        }

        .winning-line-glow {
          animation: winLinePulse 1.2s ease-in-out infinite alternate;
        }

        @keyframes winLinePulse {
          0% { opacity: 0.8; stroke-width: 4.5px; }
          100% { opacity: 1; stroke-width: 6.5px; }
        }

        .winning-stone-halo {
          transform-origin: center;
          animation: winHaloPulse 1.2s ease-in-out infinite alternate;
        }

        @keyframes winHaloPulse {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .gomoku-footer-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          width: 100%;
        }

        .gomoku-stats-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .gomoku-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-pill);
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          font-size: 0.775rem;
          color: var(--text-secondary);
        }

        .gomoku-stat-pill strong {
          color: var(--text-primary);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .gomoku-shortcuts-hint {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-align: center;
        }

        @media (max-width: 480px) {
          .gomoku-card {
            padding: 0.85rem 0.65rem;
            gap: 0.75rem;
          }

          .gomoku-controls-wrapper {
            justify-content: center;
          }

          .gomoku-control-btn {
            padding: 4px 8px;
            font-size: 0.775rem;
          }

          .gomoku-action-btn {
            height: 28px;
            padding: 0 8px;
            font-size: 0.775rem;
          }

          .gomoku-stat-pill {
            padding: 0.25rem 0.5rem;
            font-size: 0.725rem;
          }
        }
      `}</style>
    </div>
  );
}
