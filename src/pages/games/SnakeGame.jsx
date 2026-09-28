import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../../components/games/GameHeader.jsx';
import VirtualDpad from '../../components/games/VirtualDpad.jsx';
import GameHelpModal from '../../components/games/GameHelpModal.jsx';
import GameOverModal from '../../components/games/GameOverModal.jsx';
import { useTouchSwipe } from '../../hooks/useTouchSwipe.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import {
  getNextHead,
  checkCollision,
  generateFood,
  isOppositeDirection,
} from '../../utils/games/snakeLogic.js';
import { gameAudio } from '../../utils/gameAudio.js';
import { getGameRecord, updateRecord } from '../../utils/gameStorage.js';
import './GamesCommon.css';

const GRID_SIZE = 20;
const INITIAL_SPEED = 160;
const MIN_SPEED = 70;
const SPEED_STEP = 10;
const POINTS_PER_FOOD = 10;
const POINTS_PER_SPEED_RAMP = 50;

const DIRECTION_MAP = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * 计算动态移动速度 (ms/step)
 */
function calculateSpeed(currentScore) {
  const rampSteps = Math.floor(currentScore / POINTS_PER_SPEED_RAMP);
  return Math.max(MIN_SPEED, INITIAL_SPEED - rampSteps * SPEED_STEP);
}

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
 * 贪吃蛇小游戏页面 (SnakeGame)
 *
 * 采用 HTML5 Canvas 60FPS 双缓冲微动效渲染与 devicePixelRatio Retina 级消锯齿；
 * 支持全键盘方向键/WASD、移动端滑动手势与 VirtualDpad 控制；
 * 集成 Web Audio 原生音效与战绩本地持久化。
 */
export default function SnakeGame() {
  usePageTitle('贪吃蛇');
  const navigate = useNavigate();

  // 响应式状态管理
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'paused' | 'gameover'
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const record = getGameRecord('snake');
    return record.bestScore || 0;
  });
  const [snakeLength, setSnakeLength] = useState(3);
  const [isNewBest, setIsNewBest] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Canvas 与舞台 Ref
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const canvasSizeRef = useRef(400);

  // 游戏核心状态 Ref (解耦渲染帧率与 React 重新渲染开销)
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const lastTickTimeRef = useRef(0);
  const rafIdRef = useRef(null);

  const snakeRef = useRef([
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ]);
  const foodRef = useRef({ x: 14, y: 10 });
  const currentDirRef = useRef(DIRECTION_MAP.right);
  const directionQueueRef = useRef([]);
  const particlesRef = useRef([]);
  const isHelpOpenRef = useRef(isHelpOpen);
  isHelpOpenRef.current = isHelpOpen;

  /**
   * 生成粒子爆炸特效 (进食时触发)
   */
  const spawnFoodParticles = useCallback((gridX, gridY) => {
    const cellSize = (canvasSizeRef.current || 400) / GRID_SIZE;
    const centerX = (gridX + 0.5) * cellSize;
    const centerY = (gridY + 0.5) * cellSize;
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const speed = (Math.random() * 2.2 + 1.2) * (cellSize / 20);
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.8,
        alpha: 1,
        decay: Math.random() * 0.035 + 0.025,
        color: i % 2 === 0 ? '#ff3b30' : '#34c759',
      });
    }
  }, []);

  /**
   * 游戏结束结算
   */
  const handleGameOver = useCallback(() => {
    gameStateRef.current = 'gameover';
    setGameState('gameover');

    const finalScore = scoreRef.current;
    const previousBest = bestScore;
    const updated = updateRecord('snake', { score: finalScore });

    const isNew = finalScore > previousBest && finalScore > 0;
    setIsNewBest(isNew);
    setBestScore(updated.bestScore);
    setSnakeLength(snakeRef.current.length);
  }, [bestScore]);

  /**
   * 单步逻辑心跳 (Step Tick)
   */
  const executeGameStep = useCallback(() => {
    // 1. 处理缓冲队列中的转向输入
    if (directionQueueRef.current.length > 0) {
      currentDirRef.current = directionQueueRef.current.shift();
    }

    const currentSnake = snakeRef.current;
    const currentDir = currentDirRef.current;
    const head = currentSnake[0];
    const nextHead = getNextHead(head, currentDir);

    // 2. 边界出界与自咬碰撞检测
    if (checkCollision(nextHead, currentSnake, GRID_SIZE)) {
      gameAudio.playExplosion();
      handleGameOver();
      return;
    }

    // 3. 进食检测
    const food = foodRef.current;
    const hasEatenFood = nextHead.x === food.x && nextHead.y === food.y;

    if (hasEatenFood) {
      // 蛇身加长 (保留尾部)
      const newSnake = [nextHead, ...currentSnake];
      snakeRef.current = newSnake;

      // 音效与粒子
      gameAudio.playEat();
      spawnFoodParticles(food.x, food.y);

      // 分数增长与变速
      const nextScore = scoreRef.current + POINTS_PER_FOOD;
      scoreRef.current = nextScore;
      speedRef.current = calculateSpeed(nextScore);
      setScore(nextScore);
      setSnakeLength(newSnake.length);

      // 生成新食物 (排除自身)
      foodRef.current = generateFood(newSnake, GRID_SIZE);
    } else {
      // 正常前移 (推入新头，丢弃尾部)
      const newSnake = [nextHead, ...currentSnake.slice(0, -1)];
      snakeRef.current = newSnake;
    }
  }, [handleGameOver, spawnFoodParticles]);

  /**
   * 启动游戏
   */
  const handleStart = useCallback((initialDirKey = 'right') => {
    const dir = DIRECTION_MAP[initialDirKey] || DIRECTION_MAP.right;
    let initialSnake;

    if (dir.x === 1) {
      initialSnake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    } else if (dir.x === -1) {
      initialSnake = [{ x: 12, y: 10 }, { x: 13, y: 10 }, { x: 14, y: 10 }];
    } else if (dir.y === -1) {
      initialSnake = [{ x: 10, y: 12 }, { x: 10, y: 13 }, { x: 10, y: 14 }];
    } else {
      initialSnake = [{ x: 10, y: 8 }, { x: 10, y: 7 }, { x: 10, y: 6 }];
    }

    snakeRef.current = initialSnake;
    currentDirRef.current = dir;
    directionQueueRef.current = [];
    particlesRef.current = [];

    const initialFood = generateFood(initialSnake, GRID_SIZE);
    foodRef.current = initialFood;

    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    lastTickTimeRef.current = performance.now();

    setScore(0);
    setSnakeLength(initialSnake.length);
    setIsNewBest(false);
    gameStateRef.current = 'playing';
    setGameState('playing');
  }, []);

  /**
   * 暂停 / 继续控制
   */
  const handleTogglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'paused';
      setGameState('paused');
    } else if (gameStateRef.current === 'paused') {
      lastTickTimeRef.current = performance.now();
      gameStateRef.current = 'playing';
      setGameState('playing');
    }
  }, []);

  const handleResume = useCallback(() => {
    if (gameStateRef.current === 'paused') {
      lastTickTimeRef.current = performance.now();
      gameStateRef.current = 'playing';
      setGameState('playing');
    }
  }, []);

  /**
   * 重新开始游戏
   */
  const handleRestart = useCallback(() => {
    handleStart('right');
  }, [handleStart]);

  /**
   * 统一转向输入处理 (带防急转反向自咬保护与缓冲队列)
   */
  const handleDirection = useCallback((dirKey) => {
    const newDir = DIRECTION_MAP[dirKey];
    if (!newDir) return;

    if (gameStateRef.current === 'idle') {
      handleStart(dirKey);
      return;
    }

    if (gameStateRef.current !== 'playing') return;

    const queue = directionQueueRef.current;
    const referenceDir = queue.length > 0 ? queue[queue.length - 1] : currentDirRef.current;

    // 严禁 180 度瞬时调头反向自咬
    if (isOppositeDirection(newDir, referenceDir)) {
      return;
    }

    // 忽略同一方向的冗余输入
    if (newDir.x === referenceDir.x && newDir.y === referenceDir.y) {
      return;
    }

    // 最多允许 2 级预输入缓冲
    if (queue.length < 2) {
      queue.push(newDir);
      gameAudio.playMove();
    }
  }, [handleStart]);

  // 绑定移动端触摸滑动识别
  useTouchSwipe(handleDirection, canvasContainerRef, { threshold: 25, preventDefault: true });

  /**
   * 全局键盘快捷键监听
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 玩法指南开启时，Esc 关闭指南，其它按键不干扰
      if (isHelpOpenRef.current) return;

      // R 键重新开始
      if (e.key === 'r' || e.key === 'R') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleRestart();
          return;
        }
      }

      // 空格键暂停 / 继续 / 开始
      if (e.code === 'Space' || e.key === ' ') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (gameStateRef.current === 'idle') {
            handleStart('right');
          } else if (gameStateRef.current === 'playing' || gameStateRef.current === 'paused') {
            handleTogglePause();
          }
          return;
        }
      }

      // 方向键与 WASD 控制
      let dirKey = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dirKey = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dirKey = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dirKey = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dirKey = 'right';
          break;
        default:
          break;
      }

      if (dirKey) {
        e.preventDefault();
        handleDirection(dirKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirection, handleRestart, handleStart, handleTogglePause]);

  /**
   * Canvas 尺寸动态监听与高清 Retina 初始化
   */
  useEffect(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const cssSize = Math.floor(rect.width);
      if (cssSize <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      canvasSizeRef.current = cssSize;
    };

    resizeCanvas();
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  /**
   * 60FPS Canvas 渲染循环与心跳步进控制
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (currentTime) => {
      // 1. 步进心跳检测 (仅在 playing 状态推进逻辑)
      if (gameStateRef.current === 'playing') {
        if (!lastTickTimeRef.current) {
          lastTickTimeRef.current = currentTime;
        }
        const delta = currentTime - lastTickTimeRef.current;
        if (delta >= speedRef.current) {
          executeGameStep();
          lastTickTimeRef.current = currentTime;
        }
      }

      // 2. 更新粒子生命周期
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // 3. 高清缩放与清空画布
      const dpr = window.devicePixelRatio || 1;
      const size = canvasSizeRef.current || 400;
      const cellSize = size / GRID_SIZE;
      const isDark = isDarkModeActive();

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // 4. 背景与微弱网格线
      ctx.fillStyle = isDark ? '#161618' : '#f5f5f7';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.038)' : 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < GRID_SIZE; i++) {
        const pos = Math.round(i * cellSize) + 0.5;
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
      }
      ctx.stroke();

      // 5. 渲染发光食物 (带呼吸动画与高光叶片)
      const food = foodRef.current;
      if (food) {
        const fx = (food.x + 0.5) * cellSize;
        const fy = (food.y + 0.5) * cellSize;
        const pulse = 1 + 0.08 * Math.sin(currentTime / 180);
        const radius = cellSize * 0.38 * pulse;

        ctx.save();
        ctx.shadowColor = 'rgba(255, 69, 58, 0.65)';
        ctx.shadowBlur = 12 * pulse;

        const foodGrad = ctx.createRadialGradient(
          fx - radius * 0.3,
          fy - radius * 0.3,
          radius * 0.1,
          fx,
          fy,
          radius
        );
        foodGrad.addColorStop(0, '#ff6961');
        foodGrad.addColorStop(0.65, '#ff3b30');
        foodGrad.addColorStop(1, '#d70015');

        ctx.fillStyle = foodGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 食物镜面高光小圆点
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(fx - radius * 0.35, fy - radius * 0.35, radius * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // 嫩绿小叶片装饰
        ctx.fillStyle = '#34c759';
        ctx.beginPath();
        ctx.ellipse(
          fx + radius * 0.25,
          fy - radius * 0.7,
          radius * 0.3,
          radius * 0.14,
          Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // 6. 渲染蛇身 (平滑圆润连线 + 渐变微光)
      const snake = snakeRef.current;
      if (snake.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = snake.length - 1; i > 0; i--) {
          const p1 = snake[i];
          const p2 = snake[i - 1];
          const ratio = i / snake.length;

          // 从翡翠绿渐变至科技蓝绿
          const r = Math.round(52 - ratio * 16);
          const g = Math.round(199 - ratio * 55);
          const b = Math.round(89 + ratio * 35);
          ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

          const lineWidth = cellSize * 0.76 * (1 - ratio * 0.16);
          ctx.lineWidth = Math.max(lineWidth, cellSize * 0.35);

          ctx.beginPath();
          ctx.moveTo((p1.x + 0.5) * cellSize, (p1.y + 0.5) * cellSize);
          ctx.lineTo((p2.x + 0.5) * cellSize, (p2.y + 0.5) * cellSize);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 绘制身体节点平滑圆弧
      for (let i = snake.length - 1; i >= 1; i--) {
        const seg = snake[i];
        const ratio = i / snake.length;
        const r = Math.round(52 - ratio * 16);
        const g = Math.round(199 - ratio * 55);
        const b = Math.round(89 + ratio * 35);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        const nodeRadius = cellSize * 0.38 * (1 - ratio * 0.16);
        ctx.beginPath();
        ctx.arc(
          (seg.x + 0.5) * cellSize,
          (seg.y + 0.5) * cellSize,
          Math.max(nodeRadius, cellSize * 0.2),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // 7. 渲染蛇头与立体眼睛
      if (snake.length > 0) {
        const head = snake[0];
        const hx = (head.x + 0.5) * cellSize;
        const hy = (head.y + 0.5) * cellSize;
        const headRadius = cellSize * 0.42;

        ctx.save();
        ctx.shadowColor = 'rgba(52, 199, 89, 0.45)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#34c759';
        ctx.beginPath();
        ctx.arc(hx, hy, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 蛇头圆润微高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(hx, hy - headRadius * 0.25, headRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛朝向计算
        const dir = currentDirRef.current;
        const perpX = -dir.y;
        const perpY = dir.x;

        const eyeFwd = cellSize * 0.16;
        const eyeSide = cellSize * 0.2;
        const eyeWhiteR = cellSize * 0.11;
        const pupilR = cellSize * 0.055;

        const eyePositions = [
          {
            x: hx + dir.x * eyeFwd + perpX * eyeSide,
            y: hy + dir.y * eyeFwd + perpY * eyeSide,
          },
          {
            x: hx + dir.x * eyeFwd - perpX * eyeSide,
            y: hy + dir.y * eyeFwd - perpY * eyeSide,
          },
        ];

        eyePositions.forEach((pos) => {
          // 眼白
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, eyeWhiteR, 0, Math.PI * 2);
          ctx.fill();

          // 瞳孔指向移动方向
          const pupilX = pos.x + dir.x * (eyeWhiteR * 0.35);
          const pupilY = pos.y + dir.y * (eyeWhiteR * 0.35);
          ctx.fillStyle = '#1c1c1e';
          ctx.beginPath();
          ctx.arc(pupilX, pupilY, pupilR, 0, Math.PI * 2);
          ctx.fill();

          // 灵动眼神反光小点
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(
            pupilX - eyeWhiteR * 0.12,
            pupilY - eyeWhiteR * 0.12,
            pupilR * 0.45,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      }

      // 8. 渲染消散粒子
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      // 维持渲染循环
      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [executeGameStep]);

  return (
    <div className="game-page-container">
      <div className="game-stage-wrapper">
        {/* 顶部操作与战绩栏 */}
        <GameHeader
          title="贪吃蛇"
          score={score}
          bestScore={bestScore}
          isPaused={gameState === 'paused'}
          onTogglePause={
            gameState === 'playing' || gameState === 'paused' ? handleTogglePause : undefined
          }
          onRestart={handleRestart}
          onOpenHelp={() => {
            if (gameStateRef.current === 'playing') {
              gameStateRef.current = 'paused';
              setGameState('paused');
            }
            setIsHelpOpen(true);
          }}
        />

        {/* 游戏主舞台卡片 */}
        <div className="game-board-card">
          <div
            ref={canvasContainerRef}
            style={{
              width: '100%',
              maxWidth: '440px',
              aspectRatio: '1 / 1',
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-secondary)',
              touchAction: 'none',
              boxSizing: 'border-box',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />

            {/* 未开局引导浮层 */}
            {gameState === 'idle' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.48)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  gap: '1rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  userSelect: 'none',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35))',
                  }}
                >
                  🐍
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  经典贪吃蛇
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.78)',
                    maxWidth: '240px',
                    lineHeight: 1.5,
                  }}
                >
                  滑动屏幕、按方向键或使用手柄开启挑战
                </p>
                <button
                  type="button"
                  className="game-btn game-btn-primary"
                  onClick={() => handleStart('right')}
                  style={{
                    height: '40px',
                    padding: '0 1.75rem',
                    fontSize: '0.95rem',
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
                  background: 'rgba(0, 0, 0, 0.52)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  gap: '0.85rem',
                  userSelect: 'none',
                  zIndex: 2,
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

          {/* 移动端虚拟方向十字手柄 */}
          <VirtualDpad onDirection={handleDirection} />
        </div>

        {/* 玩法指引说明弹窗 */}
        <GameHelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="贪吃蛇"
          rules={[
            { label: '核心目标', desc: '操控小蛇吞食地图中发光的苹果以增加身体长度与累积分数。' },
            {
              label: '速度阶梯',
              desc: '初始速度为 160ms，每吃 5 颗苹果（50 分）移动速度提升 10ms，考验敏捷反应。',
            },
            { label: '淘汰规则', desc: '触碰网格四周边界或撞击自己的蛇身将直接判定失败。' },
          ]}
          keys={[
            { key: '↑ / W', desc: '向上转向' },
            { key: '↓ / S', desc: '向下转向' },
            { key: '← / A', desc: '向左转向' },
            { key: '→ / D', desc: '向右转向' },
            { key: 'Space', desc: '暂停 / 继续' },
            { key: 'R', desc: '重新开始' },
            { key: 'Esc', desc: '关闭弹窗' },
          ]}
        />

        {/* 游戏结束结算弹窗 */}
        <GameOverModal
          isOpen={gameState === 'gameover'}
          title="游戏结束"
          subtitle={isNewBest ? '🎉 太棒了！刷新了历史最高分纪录！' : '撞到障碍物啦，再接再厉！'}
          stats={[
            { label: '本局得分', value: score, highlight: true },
            { label: '历史最高', value: bestScore },
            { label: '最终身长', value: snakeLength },
          ]}
          onRestart={handleRestart}
          onBackHome={() => navigate('/games')}
        />
      </div>
    </div>
  );
}
