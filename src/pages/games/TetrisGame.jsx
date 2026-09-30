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
  generate7Bag,
  isValidPosition,
  getGhostDropY,
  rotatePiece,
  placePiece,
  clearLines,
  calculateScore,
  getDropInterval,
  TETROMINOES,
  TETROMINO_COLORS,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from '../../utils/games/tetrisLogic.js';
import { gameAudio } from '../../utils/gameAudio.js';
import { getGameRecord, updateRecord } from '../../utils/gameStorage.js';
import './GamesCommon.css';

/**
 * 判断当前是否处于深色模式
 */
function isDarkModeActive() {
  if (typeof document === 'undefined') return true;
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

/**
 * 绘制圆角矩形路径
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 绘制单个方块 (含立体高光、圆角质感或幽灵投影)
 */
function drawBlockAt(ctx, x, y, size, color, isGhost = false) {
  const padding = 1.25;
  const px = x + padding;
  const py = y + padding;
  const w = size - padding * 2;
  const h = size - padding * 2;
  const r = Math.max(2, Math.floor(size * 0.16));

  ctx.save();
  if (isGhost) {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    drawRoundedRect(ctx, px, py, w, h, r);
    ctx.fill();

    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
  } else {
    // 基础鲜亮主题底色
    ctx.fillStyle = color;
    drawRoundedRect(ctx, px, py, w, h, r);
    ctx.fill();

    // 立体玻璃拟态高光渐变
    const grad = ctx.createLinearGradient(px, py, px, py + h);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.04)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, px, py, w, h, r);
    ctx.fill();

    // 内嵌柔光细描边
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 方块形状微型预览组件 (Hold / Next)
 */
function TetrominoPreview({ type, size = 68, height = 48, dimmed = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, height);

    if (!type || !TETROMINOES[type]) {
      return;
    }

    const pieceDef = TETROMINOES[type];
    const shape = pieceDef.shapes[0];
    const rows = shape.length;
    const cols = shape[0].length;

    let minR = rows;
    let maxR = -1;
    let minC = cols;
    let maxC = -1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c] !== 0) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }

    if (maxR === -1) return;

    const blockCountX = maxC - minC + 1;
    const blockCountY = maxR - minR + 1;
    const blockSize = Math.min(
      Math.floor((size - 8) / blockCountX),
      Math.floor((height - 8) / blockCountY),
      14
    );

    const startX = Math.round((size - blockCountX * blockSize) / 2) - minC * blockSize;
    const startY = Math.round((height - blockCountY * blockSize) / 2) - minR * blockSize;

    ctx.save();
    if (dimmed) {
      ctx.globalAlpha = 0.35;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c] !== 0) {
          drawBlockAt(
            ctx,
            startX + c * blockSize,
            startY + r * blockSize,
            blockSize,
            pieceDef.color
          );
        }
      }
    }
    ctx.restore();
  }, [type, size, height, dimmed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: `${size}px`,
        height: `${height}px`,
      }}
    />
  );
}

/**
 * 俄罗斯方块页面 (TetrisGame)
 *
 * 现代 Tetris Guideline 规范实现：
 * - HTML5 Canvas 60FPS 双缓冲微动效渲染与 devicePixelRatio Retina 级消锯齿；
 * - 7-Bag 随机器、SRS 踢墙旋转系统、幽灵投影投影与 Hold 暂存机制；
 * - Apple HIG 三栏响应式毛玻璃拟态布局；
 * - 全键盘快捷键、触控手势 (useTouchSwipe)、屏幕触控药丸与 VirtualDpad；
 * - 沉浸式 Web Audio 原声音效与战绩本地持久化。
 */
export default function TetrisGame() {
  usePageTitle('俄罗斯方块');
  const navigate = useNavigate();

  // 响应式屏幕断点适配
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 基础响应式尺寸推导
  const cellSize = isMobile ? 20 : 26;
  const canvasWidth = BOARD_WIDTH * cellSize;
  const canvasHeight = BOARD_HEIGHT * cellSize;
  const previewSize = isMobile ? 56 : 72;
  const previewHeight = isMobile ? 38 : 46;

  // React UI 呈现状态
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'paused' | 'gameover'
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [holdPiece, setHoldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [nextPieces, setNextPieces] = useState([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  const [bestScore, setBestScore] = useState(() => {
    const record = getGameRecord('tetris');
    return record.bestScore || 0;
  });

  // 核心 DOM 与舞台引用
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // 物理与状态引用 (解耦 60FPS 渲染帧与 React 重新渲染开销)
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const boardRef = useRef(createEmptyBoard());
  const currentPieceRef = useRef(null);
  const holdRef = useRef(null);
  const canHoldRef = useRef(true);
  const bagQueueRef = useRef([]);

  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);

  const lastDropTimeRef = useRef(0);
  const clearingRef = useRef(null);
  const isHelpOpenRef = useRef(isHelpOpen);
  isHelpOpenRef.current = isHelpOpen;

  /**
   * 确保 7-Bag 随机器队列充裕 (至少两套方块)
   */
  const ensureQueue = useCallback(() => {
    while (bagQueueRef.current.length < 14) {
      bagQueueRef.current.push(...generate7Bag());
    }
  }, []);

  /**
   * 游戏结束结算
   */
  const handleGameOver = useCallback(() => {
    gameStateRef.current = 'gameover';
    setGameState('gameover');

    const finalScore = scoreRef.current;
    const finalLines = linesRef.current;
    const previousRecord = getGameRecord('tetris');
    const previousBest = previousRecord.bestScore || 0;

    const isNew = finalScore > previousBest && finalScore > 0;
    setIsNewBest(isNew);

    const updated = updateRecord('tetris', { score: finalScore, lines: finalLines });
    setBestScore(updated.bestScore || 0);

    if (isNew) {
      gameAudio.playTetrisFanfare();
    } else {
      gameAudio.playLose();
    }
  }, []);

  /**
   * 生成并推进下一个方块
   */
  const spawnNextPiece = useCallback((boardToTest) => {
    ensureQueue();
    const nextType = bagQueueRef.current.shift();
    setNextPieces(bagQueueRef.current.slice(0, 3));

    const spawnX = nextType === 'O' ? 4 : 3;
    const spawnY = 0;
    const spawnRotation = 0;

    if (!isValidPosition(boardToTest, nextType, spawnX, spawnY, spawnRotation)) {
      return false; // 出场即碰撞，触顶淘汰
    }

    currentPieceRef.current = {
      type: nextType,
      x: spawnX,
      y: spawnY,
      rotation: spawnRotation,
    };
    canHoldRef.current = true;
    setCanHold(true);
    return true;
  }, [ensureQueue]);

  /**
   * 固化方块并执行消行判定
   */
  const lockPiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    const board = boardRef.current;
    const placedBoard = placePiece(board, piece.type, piece.x, piece.y, piece.rotation);
    const { newBoard, linesCleared, clearedIndices } = clearLines(placedBoard);

    if (linesCleared > 0) {
      const earned = calculateScore(linesCleared, levelRef.current);
      scoreRef.current += earned;
      linesRef.current += linesCleared;
      const nextLevel = Math.floor(linesRef.current / 10) + 1;
      levelRef.current = nextLevel;

      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(nextLevel);

      gameAudio.playTetrisClear(linesCleared);

      // 启动 160ms 白色/青色高光闪烁动画
      boardRef.current = placedBoard;
      clearingRef.current = {
        rows: clearedIndices,
        startTime: performance.now(),
        duration: 160,
        newBoard,
      };
      currentPieceRef.current = null;
    } else {
      boardRef.current = placedBoard;
      const success = spawnNextPiece(placedBoard);
      if (!success) {
        handleGameOver();
      }
    }
  }, [handleGameOver, spawnNextPiece]);

  /**
   * 左右水平平移
   */
  const movePiece = useCallback((dx) => {
    if (gameStateRef.current !== 'playing' || clearingRef.current) return;
    const piece = currentPieceRef.current;
    if (!piece) return;

    if (isValidPosition(boardRef.current, piece.type, piece.x + dx, piece.y, piece.rotation)) {
      piece.x += dx;
      gameAudio.playMove();
    }
  }, []);

  /**
   * 软降加速下落 (Soft Drop)
   */
  const softDropPiece = useCallback(() => {
    if (gameStateRef.current !== 'playing' || clearingRef.current) return;
    const piece = currentPieceRef.current;
    if (!piece) return;

    if (isValidPosition(boardRef.current, piece.type, piece.x, piece.y + 1, piece.rotation)) {
      piece.y += 1;
      scoreRef.current += 1;
      setScore(scoreRef.current);
      lastDropTimeRef.current = performance.now();
      gameAudio.playMove();
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  /**
   * 旋转方块 (含 SRS 踢墙系统)
   */
  const rotateCurrentPiece = useCallback((clockwise = true) => {
    if (gameStateRef.current !== 'playing' || clearingRef.current) return;
    const piece = currentPieceRef.current;
    if (!piece) return;

    const res = rotatePiece(
      boardRef.current,
      piece.type,
      piece.x,
      piece.y,
      piece.rotation,
      clockwise
    );

    if (res.success) {
      piece.rotation = res.newRotation;
      piece.x = res.newX;
      piece.y = res.newY;
      gameAudio.playMove();
    }
  }, []);

  /**
   * 瞬间硬降 (Hard Drop)
   */
  const hardDropPiece = useCallback(() => {
    if (gameStateRef.current !== 'playing' || clearingRef.current) return;
    const piece = currentPieceRef.current;
    if (!piece) return;

    const ghostY = getGhostDropY(
      boardRef.current,
      piece.type,
      piece.x,
      piece.y,
      piece.rotation
    );
    const dropDist = ghostY - piece.y;
    scoreRef.current += dropDist * 2;
    setScore(scoreRef.current);
    piece.y = ghostY;

    gameAudio.playTetrisDrop();
    lockPiece();
  }, [lockPiece]);

  /**
   * 暂存方块 (Hold)
   */
  const holdCurrentPiece = useCallback(() => {
    if (gameStateRef.current !== 'playing' || clearingRef.current) return;
    if (!canHoldRef.current) return;
    const piece = currentPieceRef.current;
    if (!piece) return;

    const currentType = piece.type;

    if (holdRef.current === null) {
      holdRef.current = currentType;
      setHoldPiece(currentType);
      const success = spawnNextPiece(boardRef.current);
      if (!success) {
        handleGameOver();
        return;
      }
    } else {
      const prevHold = holdRef.current;
      holdRef.current = currentType;
      setHoldPiece(currentType);

      const spawnX = prevHold === 'O' ? 4 : 3;
      const spawnY = 0;
      if (!isValidPosition(boardRef.current, prevHold, spawnX, spawnY, 0)) {
        handleGameOver();
        return;
      }
      currentPieceRef.current = {
        type: prevHold,
        x: spawnX,
        y: spawnY,
        rotation: 0,
      };
    }

    // 确保无论首次暂存还是换块均在本回合锁定 Hold，防止首回合连续触发两次暂存
    canHoldRef.current = false;
    setCanHold(false);

    // 重置下落计时器，确保新方块获得完整的一个重力下落周期
    lastDropTimeRef.current = performance.now();

    gameAudio.playMove();
  }, [handleGameOver, spawnNextPiece]);

  /**
   * 启动游戏
   */
  const handleStart = useCallback(() => {
    boardRef.current = createEmptyBoard();
    bagQueueRef.current = [...generate7Bag(), ...generate7Bag()];
    holdRef.current = null;
    setHoldPiece(null);
    canHoldRef.current = true;
    setCanHold(true);

    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    clearingRef.current = null;

    setScore(0);
    setLines(0);
    setLevel(1);
    setIsNewBest(false);

    spawnNextPiece(boardRef.current);

    lastDropTimeRef.current = performance.now();
    gameStateRef.current = 'playing';
    setGameState('playing');
  }, [spawnNextPiece]);

  const handleRestart = useCallback(() => {
    handleStart();
  }, [handleStart]);

  /**
   * 暂停 / 继续控制
   */
  const handleTogglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'paused';
      setGameState('paused');
    } else if (gameStateRef.current === 'paused') {
      lastDropTimeRef.current = performance.now();
      gameStateRef.current = 'playing';
      setGameState('playing');
    }
  }, []);

  const handleResume = useCallback(() => {
    if (gameStateRef.current === 'paused') {
      lastDropTimeRef.current = performance.now();
      gameStateRef.current = 'playing';
      setGameState('playing');
    }
  }, []);

  /**
   * 虚拟十字键输入事件映射
   */
  const handleDpadDirection = useCallback(
    (dir) => {
      if (gameStateRef.current !== 'playing') return;
      if (dir === 'left') movePiece(-1);
      else if (dir === 'right') movePiece(1);
      else if (dir === 'up') rotateCurrentPiece(true);
      else if (dir === 'down') softDropPiece();
    },
    [movePiece, rotateCurrentPiece, softDropPiece]
  );

  /**
   * 手势滑动映射
   */
  const handleSwipe = useCallback(
    (dir) => {
      if (gameStateRef.current !== 'playing') return;
      if (dir === 'left') movePiece(-1);
      else if (dir === 'right') movePiece(1);
      else if (dir === 'down') softDropPiece();
      else if (dir === 'up') hardDropPiece();
    },
    [movePiece, softDropPiece, hardDropPiece]
  );

  useTouchSwipe(handleSwipe, canvasContainerRef, { threshold: 24, preventDefault: true });

  /**
   * 键盘事件全局监听
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isHelpOpenRef.current) {
        if (e.key === 'Escape') {
          setIsHelpOpen(false);
        }
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        handleTogglePause();
        return;
      }

      if (gameStateRef.current !== 'playing') {
        if (e.key === 'Enter' || e.key === ' ') {
          if (gameStateRef.current === 'idle') {
            e.preventDefault();
            handleStart();
          } else if (gameStateRef.current === 'gameover') {
            e.preventDefault();
            handleRestart();
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePiece(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePiece(1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          softDropPiece();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'x':
        case 'X':
          e.preventDefault();
          rotateCurrentPiece(true);
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          rotateCurrentPiece(false);
          break;
        case ' ':
          e.preventDefault();
          hardDropPiece();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          holdCurrentPiece();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePause,
    handleStart,
    handleRestart,
    movePiece,
    softDropPiece,
    rotateCurrentPiece,
    hardDropPiece,
    holdCurrentPiece,
  ]);

  /**
   * 核心 Canvas 双缓冲渲染器
   */
  const drawMainCanvas = useCallback(
    (now) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(canvasWidth * dpr);
      const targetH = Math.round(canvasHeight * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isDark = isDarkModeActive();

      // 1. 清空与绘制暗夜毛玻璃背景底板
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = isDark ? '#0b0f19' : '#f8fafc';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. 绘制微弱背景网格线
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';

      ctx.beginPath();
      for (let c = 1; c < BOARD_WIDTH; c++) {
        const x = c * cellSize;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
      }
      for (let r = 1; r < BOARD_HEIGHT; r++) {
        const y = r * cellSize;
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
      }
      ctx.stroke();

      // 3. 绘制已固化方块
      const board = boardRef.current;
      for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
          const cellId = board[r][c];
          if (cellId > 0 && TETROMINO_COLORS[cellId]) {
            drawBlockAt(ctx, c * cellSize, r * cellSize, cellSize, TETROMINO_COLORS[cellId]);
          }
        }
      }

      // 4. 消行动画闪烁光波 (高光 White / Cyan Pulse)
      if (clearingRef.current) {
        const { rows, startTime, duration } = clearingRef.current;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const flashAlpha = Math.sin(progress * Math.PI) * 0.92;

        for (const row of rows) {
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, row * cellSize, canvasWidth, cellSize);
          ctx.fillStyle = `rgba(6, 182, 212, ${flashAlpha * 0.4})`;
          ctx.fillRect(0, row * cellSize, canvasWidth, cellSize);
          ctx.restore();
        }
      } else if (gameStateRef.current === 'playing' && currentPieceRef.current) {
        const piece = currentPieceRef.current;
        const pieceDef = TETROMINOES[piece.type];

        if (pieceDef) {
          const shape = pieceDef.shapes[((piece.rotation % 4) + 4) % 4];

          // 5. 绘制幽灵投影虚影 (Ghost Projection)
          const ghostY = getGhostDropY(
            board,
            piece.type,
            piece.x,
            piece.y,
            piece.rotation
          );

          if (ghostY !== piece.y) {
            for (let r = 0; r < shape.length; r++) {
              for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                  const gx = (piece.x + c) * cellSize;
                  const gy = (ghostY + r) * cellSize;
                  drawBlockAt(ctx, gx, gy, cellSize, pieceDef.color, true);
                }
              }
            }
          }

          // 6. 绘制当前正下落的活跃方块
          for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
              if (shape[r][c] !== 0) {
                const px = (piece.x + c) * cellSize;
                const py = (piece.y + r) * cellSize;
                drawBlockAt(ctx, px, py, cellSize, pieceDef.color, false);
              }
            }
          }
        }
      }
    },
    [canvasWidth, canvasHeight, cellSize]
  );

  /**
   * 60FPS 游戏动力学与下落心跳主循环
   */
  useEffect(() => {
    let animationFrameId;

    const renderLoop = (time) => {
      if (gameStateRef.current === 'playing') {
        if (clearingRef.current) {
          const { startTime, duration, newBoard } = clearingRef.current;
          if (time - startTime >= duration) {
            boardRef.current = newBoard;
            clearingRef.current = null;
            const success = spawnNextPiece(newBoard);
            if (!success) {
              handleGameOver();
            }
            lastDropTimeRef.current = time;
          }
        } else if (currentPieceRef.current) {
          const interval = getDropInterval(levelRef.current);
          if (time - lastDropTimeRef.current >= interval) {
            lastDropTimeRef.current = time;
            const piece = currentPieceRef.current;
            if (isValidPosition(boardRef.current, piece.type, piece.x, piece.y + 1, piece.rotation)) {
              piece.y += 1;
            } else {
              lockPiece();
            }
          }
        }
      }

      drawMainCanvas(time);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [drawMainCanvas, handleGameOver, lockPiece, spawnNextPiece]);

  return (
    <div className="game-page-container">
      {/* 嵌入局部样式微调保证三栏自适应完美适配 */}
      <style>{`
        .tetris-layout {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 1rem;
          width: 100%;
          user-select: none;
        }
        .tetris-side-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 104px;
          flex-shrink: 0;
        }
        .tetris-panel-card {
          background: var(--bg-surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.75rem 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: var(--shadow-sm);
        }
        .tetris-panel-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 0.45rem;
          text-transform: uppercase;
        }
        .tetris-stage-box {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-subtle);
          background: #0b0f19;
          touch-action: none;
        }
        .tetris-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-bottom: 0.4rem;
        }
        .tetris-stat-label {
          font-size: 0.65rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          font-weight: 600;
        }
        .tetris-stat-val {
          font-size: 1.15rem;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .tetris-touch-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          margin-top: 1rem;
          width: 100%;
          max-width: 380px;
        }
        .tetris-touch-btn {
          flex: 1;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-pill);
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition-fast);
          user-select: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .tetris-touch-btn:active:not(:disabled) {
          transform: scale(0.94);
          background: var(--bg-hover);
        }
        .tetris-touch-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .tetris-touch-btn.primary {
          background: var(--accent-color);
          color: #fff;
          border-color: var(--accent-color);
        }
        @media (max-width: 640px) {
          .tetris-side-panel {
            width: 72px;
            gap: 0.5rem;
          }
          .tetris-panel-card {
            padding: 0.45rem 0.2rem;
          }
          .tetris-layout {
            gap: 0.4rem;
          }
          .tetris-stat-val {
            font-size: 0.95rem;
          }
        }
      `}</style>

      {/* 顶部通用游戏栏 */}
      <GameHeader
        title="俄罗斯方块"
        score={score}
        bestScore={bestScore}
        onRestart={handleRestart}
        isPaused={gameState === 'paused'}
        onTogglePause={handleTogglePause}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <div className="game-stage-wrapper" style={{ maxWidth: '640px' }}>
        {/* Apple HIG 三栏经典核心舞台 */}
        <div className="tetris-layout">
          {/* 左栏：HOLD 暂存槽 */}
          <div className="tetris-side-panel">
            <div className="tetris-panel-card">
              <span className="tetris-panel-title">HOLD 暂存</span>
              <div
                style={{
                  minHeight: `${previewHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {holdPiece ? (
                  <TetrominoPreview
                    type={holdPiece}
                    size={previewSize}
                    height={previewHeight}
                    dimmed={!canHold}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: '0.725rem',
                      color: 'var(--text-tertiary)',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.5rem 0.6rem',
                    }}
                  >
                    暂存 [C]
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: canHold ? 'var(--accent-color)' : 'var(--text-tertiary)',
                  marginTop: '0.35rem',
                  fontWeight: 600,
                }}
              >
                {canHold ? '可以暂存' : '本轮已锁'}
              </span>
            </div>

            {/* 键盘操作便捷提示卡片 (桌面端展示) */}
            {!isMobile && (
              <div
                className="tetris-panel-card"
                style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                  快捷指南
                </div>
                <div style={{ lineHeight: 1.6, textAlign: 'center' }}>
                  Space 硬降<br />
                  ↑ / X 旋转<br />
                  ↓ 软降<br />
                  C 暂存
                </div>
              </div>
            )}
          </div>

          {/* 中央：10×20 核心舞台 Canvas */}
          <div
            ref={canvasContainerRef}
            className="tetris-stage-box"
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
              }}
            />

            {/* 初始待机遮罩浮层 */}
            {gameState === 'idle' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  gap: '0.85rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))',
                  }}
                >
                  🧱
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  经典俄罗斯方块
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.825rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    maxWidth: '220px',
                    lineHeight: 1.5,
                  }}
                >
                  旋转方块消除满行，挑战无极限速度与历史最高分！
                </p>
                <button
                  type="button"
                  className="game-btn game-btn-primary"
                  onClick={handleStart}
                  style={{
                    height: '40px',
                    padding: '0 1.6rem',
                    fontSize: '0.925rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(0, 113, 227, 0.4)',
                  }}
                >
                  开始游戏
                </button>
              </div>
            )}

            {/* 暂停状态遮罩浮层 */}
            {gameState === 'paused' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  gap: '0.85rem',
                  zIndex: 3,
                }}
              >
                <div style={{ fontSize: '2rem', lineHeight: 1 }}>⏸️</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>游戏已暂停</div>
                <button
                  type="button"
                  className="game-btn game-btn-primary"
                  onClick={handleResume}
                  style={{
                    height: '38px',
                    padding: '0 1.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  继续游戏
                </button>
              </div>
            )}
          </div>

          {/* 右栏：NEXT 下一个预览与实时指标 */}
          <div className="tetris-side-panel">
            {/* NEXT 序列预览 */}
            <div className="tetris-panel-card">
              <span className="tetris-panel-title">NEXT 下一个</span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                {nextPieces.slice(0, 3).map((item, idx) => (
                  <TetrominoPreview
                    key={idx}
                    type={item}
                    size={previewSize}
                    height={previewHeight}
                  />
                ))}
              </div>
            </div>

            {/* 实时局势看板 */}
            <div className="tetris-panel-card" style={{ gap: '0.35rem' }}>
              <div className="tetris-stat-item">
                <span className="tetris-stat-label">得分</span>
                <span className="tetris-stat-val" style={{ color: 'var(--accent-color)' }}>
                  {score}
                </span>
              </div>
              <div className="tetris-stat-item">
                <span className="tetris-stat-label">消除行数</span>
                <span className="tetris-stat-val">{lines}</span>
              </div>
              <div className="tetris-stat-item">
                <span className="tetris-stat-label">当前等级</span>
                <span className="tetris-stat-val">{level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 移动端与触控操控药丸 (旋转、暂存、硬降) */}
        <div className="tetris-touch-bar" role="group" aria-label="移动端快捷操作栏">
          <button
            type="button"
            className="tetris-touch-btn"
            onClick={() => rotateCurrentPiece(true)}
            title="顺时针旋转"
          >
            <span style={{ fontSize: '1.05rem' }}>🔄</span>
            <span>旋转</span>
          </button>
          <button
            type="button"
            className="tetris-touch-btn"
            onClick={holdCurrentPiece}
            disabled={!canHold || gameState !== 'playing'}
            title="暂存方块"
          >
            <span style={{ fontSize: '1.05rem' }}>📦</span>
            <span>暂存</span>
          </button>
          <button
            type="button"
            className="tetris-touch-btn primary"
            onClick={hardDropPiece}
            title="瞬间硬降"
          >
            <span style={{ fontSize: '1.05rem' }}>⚡</span>
            <span>硬降</span>
          </button>
        </div>

        {/* 移动端虚拟方向十字手柄 */}
        <VirtualDpad onDirection={handleDpadDirection} />
      </div>

      {/* 玩法指南模态弹窗 */}
      <GameHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="俄罗斯方块"
        rules={[
          { label: '核心目标', desc: '操控下落的方块使其填满整行消除得分，防止方块堆叠触顶。' },
          {
            label: '消行计分',
            desc: '单消 100分、双消 300分、三消 500分、Tetris（四消）800分，随当前等级乘算。',
          },
          { label: '等级提升', desc: '每累计消除 10 行提升 1 个等级，下落速度将随等级逐渐加快。' },
          { label: '暂存槽 (Hold)', desc: '按 C / Shift 或点击暂存按钮保存当前方块，每回合仅可交换一次。' },
          { label: '幽灵投影', desc: '半透明虚影实时显示垂直落点，按 Space 键可瞬间硬降锁定。' },
        ]}
        keys={[
          { key: '← / →', desc: '左右平移' },
          { key: '↓', desc: '软降加速' },
          { key: '↑ / X', desc: '顺时针旋转' },
          { key: 'Z', desc: '逆时针旋转' },
          { key: 'Space', desc: '硬降瞬间锁定' },
          { key: 'C / Shift', desc: '暂存方块 (Hold)' },
          { key: 'P / Esc', desc: '暂停 / 继续' },
        ]}
      />

      {/* 游戏结束结算弹窗 */}
      <GameOverModal
        isOpen={gameState === 'gameover'}
        title="游戏结束"
        subtitle={isNewBest ? '🎉 太棒了！刷新了历史最高得分纪录！' : '方块已堆叠触顶，再接再厉！'}
        stats={[
          { label: '最终得分', value: score, highlight: true },
          { label: '消除行数', value: lines },
          { label: '达到等级', value: level },
          { label: '历史最高', value: bestScore },
        ]}
        onRestart={handleRestart}
        onBackHome={() => navigate('/games')}
      />
    </div>
  );
}
