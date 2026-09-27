import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader, { formatGameTime } from '../../components/games/GameHeader.jsx';
import GameHelpModal from '../../components/games/GameHelpModal.jsx';
import GameOverModal from '../../components/games/GameOverModal.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import {
  generateCards,
  checkMatch,
  isAllMatched,
} from '../../utils/games/memoryLogic.js';
import { gameAudio } from '../../utils/gameAudio.js';
import { getGameRecord, updateRecord } from '../../utils/gameStorage.js';
import './GamesCommon.css';

const TOTAL_PAIRS = 8;

/**
 * 记忆翻牌益智小游戏页面 (MemoryMatchGame)
 *
 * 特性：
 * 1. 4×4 网格，8 对精选极客科技 Emoji 图案（🚀 💻 ⚡ 🦄 ☕ 🎮 🛡️ 💎）；
 * 2. 纯 CSS 3D 立体翻转动效（perspective + preserve-3d）；
 * 3. 严格卡片状态机：防误触、连续快速点击拦截、750ms 优雅自动回弹；
 * 4. 配对成功翡翠绿呼吸光晕（Emerald Glow）与 60FPS 原生 Canvas 粒子礼花系统；
 * 5. 全通关结算弹窗、个人最佳步数与最短用时本地持久化；
 * 6. Apple HIG 磨砂玻璃科技拟态，完美自适应大屏与窄屏移动端。
 */
export default function MemoryMatchGame() {
  usePageTitle('记忆翻牌');
  const navigate = useNavigate();

  // 游戏核心状态
  const [cards, setCards] = useState(() => generateCards(TOTAL_PAIRS));
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'won'
  const [selectedIndices, setSelectedIndices] = useState([]); // 当前轮次已翻开的卡片索引 [idxA, idxB]
  const [isLocked, setIsLocked] = useState(false); // 判定中防点击交互锁
  const [turns, setTurns] = useState(0); // 翻牌步数
  const [elapsedTime, setElapsedTime] = useState(0); // 秒表耗时
  const [justMatchedIndices, setJustMatchedIndices] = useState([]); // 刚配对成功的卡片，触发高光微动效

  // 本地战绩与弹窗状态
  const [records, setRecords] = useState(() => getGameRecord('memory'));
  const [isNewBest, setIsNewBest] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // 定时器与引用 Refs
  const elapsedTimeRef = useRef(0);
  elapsedTimeRef.current = elapsedTime;

  const mismatchTimerRef = useRef(null);
  const victoryTimerRef = useRef(null);
  const pulseClearTimerRef = useRef(null);
  const cardElementsRef = useRef([]);

  // Canvas 粒子礼花特效 Refs
  const particleCanvasRef = useRef(null);
  const stageCardRef = useRef(null);
  const particlesRef = useRef([]);
  const rafIdRef = useRef(null);

  // 统计已成功配对数
  const matchedPairCount = useMemo(() => {
    return Math.floor(cards.filter((c) => c.isMatched).length / 2);
  }, [cards]);

  // 秒表计时心跳定时器
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setElapsedTime((prev) => {
          const next = prev + 1;
          elapsedTimeRef.current = next;
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // 组件卸载时安全清理所有延时与动画定时器
  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
      if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
      if (pulseClearTimerRef.current) clearTimeout(pulseClearTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // 自适应 Canvas 尺寸监听
  const resizeCanvas = useCallback(() => {
    const canvas = particleCanvasRef.current;
    const stage = stageCardRef.current;
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  /**
   * 粒子物理步进与渲染循环
   */
  const animateParticles = useCallback(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > logicalHeight + 30) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        // 极客星芒粒子
        const spikes = 4;
        const outerRadius = p.size;
        const innerRadius = p.size * 0.38;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(0, -outerRadius);
        for (let s = 0; s < spikes; s++) {
          let x = Math.cos(rot) * outerRadius;
          let y = Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;
          x = Math.cos(rot) * innerRadius;
          y = Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(0, -outerRadius);
        ctx.closePath();
        ctx.fill();
      } else {
        // 科技微彩纸切片
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
      }
      ctx.restore();
    }

    if (particles.length > 0) {
      rafIdRef.current = requestAnimationFrame(animateParticles);
    } else {
      rafIdRef.current = null;
    }
  }, []);

  /**
   * 配对成功粒子爆发
   */
  const spawnParticlesForIndices = useCallback((indices) => {
    resizeCanvas();
    const stage = stageCardRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();

    const colors = ['#10b981', '#34d399', '#6ee7b7', '#38bdf8', '#fbbf24', '#ffffff'];

    indices.forEach((idx) => {
      const cardEl = cardElementsRef.current[idx];
      if (!cardEl) return;
      const cardRect = cardEl.getBoundingClientRect();
      const centerX = cardRect.left - stageRect.left + cardRect.width / 2;
      const centerY = cardRect.top - stageRect.top + cardRect.height / 2;

      const count = 16;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 2.2 + Math.random() * 3.8;
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          gravity: 0.12,
          size: 4 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          shape: Math.random() > 0.4 ? 'star' : 'rect',
        });
      }
    });

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(animateParticles);
    }
  }, [animateParticles, resizeCanvas]);

  /**
   * 通关胜利全屏粒子礼花狂欢
   */
  const spawnVictoryConfetti = useCallback(() => {
    resizeCanvas();
    const stage = stageCardRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();

    const colors = [
      '#10b981',
      '#06b6d4',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#ef4444',
      '#fbbf24',
    ];

    const count = 88;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * stageRect.width;
      const y = stageRect.height * 0.4 + Math.random() * 80;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 4.5 + Math.random() * 6.5;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.14,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.008 + Math.random() * 0.012,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        shape: Math.random() > 0.5 ? 'star' : 'rect',
      });
    }

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(animateParticles);
    }
  }, [animateParticles, resizeCanvas]);

  /**
   * 重新开局 / 洗牌
   */
  const handleRestart = useCallback(() => {
    if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    if (pulseClearTimerRef.current) clearTimeout(pulseClearTimerRef.current);

    setCards(generateCards(TOTAL_PAIRS));
    setSelectedIndices([]);
    setJustMatchedIndices([]);
    setIsLocked(false);
    setTurns(0);
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    setGameState('idle');
    setIsGameOverModalOpen(false);
    setIsNewBest(false);
    particlesRef.current = [];

    const canvas = particleCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  /**
   * 卡片点击翻转核心处理
   */
  const handleCardClick = useCallback((index) => {
    // 防误触与交互锁校验
    if (isLocked) return;
    if (gameState === 'won') return;

    const currentCard = cards[index];
    if (!currentCard || currentCard.isFlipped || currentCard.isMatched) return;
    if (selectedIndices.includes(index)) return;

    // 首次翻牌时自动开启秒表进入 playing 状态
    if (gameState === 'idle') {
      setGameState('playing');
    }

    // 播放清脆翻牌音效
    gameAudio.playFlip();

    if (selectedIndices.length === 0) {
      // 翻开本轮第一张卡片
      setCards((prev) =>
        prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
      );
      setSelectedIndices([index]);
    } else if (selectedIndices.length === 1) {
      // 翻开本轮第二张卡片
      const firstIndex = selectedIndices[0];
      const secondIndex = index;
      const nextTurns = turns + 1;
      setTurns(nextTurns);

      const firstCard = cards[firstIndex];
      const secondCard = currentCard;
      const isMatch = checkMatch(firstCard, secondCard);

      if (isMatch) {
        // 配对成功！
        gameAudio.playEat();
        const nextCards = cards.map((c, i) =>
          i === firstIndex || i === secondIndex
            ? { ...c, isFlipped: true, isMatched: true }
            : c
        );
        setCards(nextCards);
        setSelectedIndices([]);

        // 触发高光微动效与粒子礼花
        setJustMatchedIndices([firstIndex, secondIndex]);
        if (pulseClearTimerRef.current) clearTimeout(pulseClearTimerRef.current);
        pulseClearTimerRef.current = setTimeout(() => {
          setJustMatchedIndices([]);
        }, 1100);

        spawnParticlesForIndices([firstIndex, secondIndex]);

        // 终局检测：是否所有 8 对均已完成匹配
        if (isAllMatched(nextCards)) {
          setGameState('won');
          gameAudio.playWin();
          spawnVictoryConfetti();

          const finalTime = elapsedTimeRef.current;
          const updated = updateRecord('memory', {
            turns: nextTurns,
            time: finalTime,
          });

          // 判断是否打破纪录
          const wasNewTurns = !records.bestTurns || nextTurns < records.bestTurns;
          const wasNewTime = !records.bestTime || finalTime < records.bestTime;
          setIsNewBest(wasNewTurns || wasNewTime);
          setRecords(updated);

          // 留出 650ms 欣赏全场翡翠高光与礼花飞扬，随后展示结算弹窗
          if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
          victoryTimerRef.current = setTimeout(() => {
            setIsGameOverModalOpen(true);
          }, 650);
        }
      } else {
        // 配对失败：短暂锁定 750ms 供记忆观察，随后平滑翻回背面
        setIsLocked(true);
        setCards((prev) =>
          prev.map((c, i) => (i === secondIndex ? { ...c, isFlipped: true } : c))
        );
        setSelectedIndices([firstIndex, secondIndex]);

        if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              (i === firstIndex || i === secondIndex) && !c.isMatched
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedIndices([]);
          setIsLocked(false);
        }, 750);
      }
    }
  }, [
    cards,
    isLocked,
    gameState,
    selectedIndices,
    turns,
    records,
    spawnParticlesForIndices,
    spawnVictoryConfetti,
  ]);

  // 全键盘快捷键：R 键重开，严格避让浏览器修饰键 (Ctrl+R / Cmd+R)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRestart]);

  return (
    <div className="game-page-container">
      <div className="game-stage-wrapper">
        {/* 顶部通用导航、操作按钮与时间/步数指示 */}
        <GameHeader
          title="记忆翻牌"
          time={elapsedTime}
          turns={turns}
          onRestart={handleRestart}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* 记忆翻牌主舞台卡片 */}
        <div ref={stageCardRef} className="game-board-card memory-stage-card">
          {/* Canvas 粒子礼花浮层 (无阻碍交互) */}
          <canvas
            ref={particleCanvasRef}
            className="memory-particle-canvas"
            aria-hidden="true"
          />

          {/* 顶部战绩与配对进度微控条 */}
          <div className="memory-toolbar">
            <div className="memory-progress-box">
              <div className="memory-progress-info">
                <span className="memory-progress-title">配对进度</span>
                <span className="memory-progress-val">
                  {matchedPairCount} / {TOTAL_PAIRS} 对
                </span>
              </div>
              <div
                className="memory-progress-track"
                role="progressbar"
                aria-valuenow={matchedPairCount}
                aria-valuemin={0}
                aria-valuemax={TOTAL_PAIRS}
              >
                <div
                  className="memory-progress-fill"
                  style={{ width: `${(matchedPairCount / TOTAL_PAIRS) * 100}%` }}
                />
              </div>
            </div>

            <div className="memory-bests-box" title="本地历史最佳战绩">
              <span className="memory-best-item">
                <span className="memory-best-label">最佳步数:</span>
                <strong className="memory-best-val">
                  {records.bestTurns ? `${records.bestTurns} 步` : '--'}
                </strong>
              </span>
              <span className="memory-best-divider">·</span>
              <span className="memory-best-item">
                <span className="memory-best-label">最佳用时:</span>
                <strong className="memory-best-val">
                  {records.bestTime ? formatGameTime(records.bestTime) : '--'}
                </strong>
              </span>
            </div>
          </div>

          {/* 4×4 经典卡片网格 */}
          <div
            className="memory-grid"
            role="grid"
            aria-label="4×4 记忆翻牌网格"
          >
            {cards.map((card, index) => {
              const isSelected = selectedIndices.includes(index);
              const isJustMatched = justMatchedIndices.includes(index);
              const isCardFlipped = card.isFlipped || card.isMatched;

              return (
                <div
                  key={card.id}
                  ref={(el) => (cardElementsRef.current[index] = el)}
                  className={`game-flip-card-container memory-card-item ${
                    card.isMatched ? 'is-matched' : ''
                  } ${isJustMatched ? 'just-matched' : ''}`}
                  onClick={() => handleCardClick(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(index);
                    }
                  }}
                  tabIndex={card.isMatched ? -1 : 0}
                  role="button"
                  aria-label={
                    isCardFlipped
                      ? `卡片 ${index + 1}：${card.symbol}${card.isMatched ? '，已配对' : ''}`
                      : `卡片 ${index + 1}：背面，点击翻开`
                  }
                  aria-pressed={isCardFlipped}
                >
                  <div
                    className={`game-flip-card-inner ${
                      isCardFlipped ? 'is-flipped' : ''
                    }`}
                  >
                    {/* 卡片背面 (未翻开 / 科技微芯片质感) */}
                    <div className="game-flip-card-front memory-card-cover">
                      <div className="memory-cover-pattern" aria-hidden="true">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="memory-chip-icon"
                        >
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                          <rect x="9" y="9" width="6" height="6" />
                          <line x1="9" y1="1" x2="9" y2="4" />
                          <line x1="15" y1="1" x2="15" y2="4" />
                          <line x1="9" y1="20" x2="9" y2="23" />
                          <line x1="15" y1="20" x2="15" y2="23" />
                          <line x1="20" y1="9" x2="23" y2="9" />
                          <line x1="20" y1="14" x2="23" y2="14" />
                          <line x1="1" y1="9" x2="4" y2="9" />
                          <line x1="1" y1="14" x2="4" y2="14" />
                        </svg>
                      </div>
                      <span className="memory-card-id-hint" aria-hidden="true">
                        {index + 1}
                      </span>
                    </div>

                    {/* 卡片正面 (翻开图案 / 极客科技 Emoji) */}
                    <div
                      className={`game-flip-card-back memory-card-revealed ${
                        card.isMatched ? 'card-matched' : ''
                      } ${isSelected && !card.isMatched ? 'card-selected' : ''}`}
                    >
                      <span className="memory-card-symbol" aria-hidden="true">
                        {card.symbol}
                      </span>

                      {/* 配对成功的翡翠绿色对勾微角标 */}
                      {card.isMatched && (
                        <div
                          className="memory-matched-badge"
                          title="已配对成功"
                          aria-hidden="true"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部操作快捷提示 */}
          <div className="memory-footer-hint">
            <span>💡 点击翻开 2 张相同图案进行配对 · 步数越少耗时越短战绩越佳 · 按 R 键重开</span>
          </div>
        </div>
      </div>

      {/* 通关胜利结算弹窗 */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        title="通关胜利！"
        subtitle={
          isNewBest
            ? '🎉 精彩绝伦！你成功刷新了个人最佳纪录！'
            : '记忆力超群！所有 8 对科技卡片已全部配对成功！'
        }
        stats={[
          { label: '本局步数', value: `${turns} 步`, highlight: true },
          { label: '通关耗时', value: formatGameTime(elapsedTime) },
          {
            label: '最佳步数',
            value: records.bestTurns ? `${records.bestTurns} 步` : `${turns} 步`,
          },
          {
            label: '最佳用时',
            value: records.bestTime
              ? formatGameTime(records.bestTime)
              : formatGameTime(elapsedTime),
          },
        ]}
        onRestart={handleRestart}
        onBackHome={() => navigate('/games')}
      />

      {/* 游戏玩法指南模态弹窗 */}
      <GameHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="记忆翻牌"
        rules={[
          {
            label: '核心目标',
            desc: '找出 4×4 网格中全部 8 对相同的极客科技 Emoji 图案，用最少的翻牌步数与最短时间通关！',
          },
          {
            label: '翻牌机制',
            desc: '点击任意背面向上的卡片翻开。每次连续翻开 2 张卡片进行图形匹配比对。',
          },
          {
            label: '配对判定',
            desc: '若两张卡片图案一致，则成功锁定消除并高亮显示；若不一致，卡片将在 750ms 后平滑翻回背面。',
          },
          {
            label: '战绩持久化',
            desc: '游戏将在本地安全记录你的最低通关步数与最短用时，随时挑战大脑极限记忆！',
          },
        ]}
        keys={[
          { key: '点击 / 触控', desc: '翻转卡片' },
          { key: 'Enter / Space', desc: '键盘翻牌' },
          { key: 'R', desc: '重新洗牌开局' },
          { key: 'Esc', desc: '关闭弹窗' },
        ]}
      />

      {/* 记忆翻牌页面专属样式表 */}
      <style>{`
        .memory-stage-card {
          max-width: 520px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        /* 顶部 Canvas 粒子全屏无阻碍图层 */
        .memory-particle-canvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
          border-radius: var(--radius-lg);
        }

        /* 顶部战绩与微进度条 */
        .memory-toolbar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.25rem;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.65rem 1rem;
          box-sizing: border-box;
        }

        .memory-progress-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .memory-progress-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
        }

        .memory-progress-title {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .memory-progress-val {
          color: var(--text-primary);
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        }

        .memory-progress-track {
          width: 100%;
          height: 6px;
          background: var(--bg-surface);
          border-radius: var(--radius-pill);
          overflow: hidden;
          border: 1px solid var(--border-subtle);
        }

        .memory-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-color), #10b981);
          border-radius: var(--radius-pill);
          transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .memory-bests-box {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.775rem;
          color: var(--text-secondary);
          white-space: nowrap;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          padding: 0.35rem 0.75rem;
        }

        .memory-best-item {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .memory-best-label {
          color: var(--text-tertiary);
        }

        .memory-best-val {
          color: var(--text-primary);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        }

        .memory-best-divider {
          color: var(--text-tertiary);
          opacity: 0.5;
        }

        /* 4×4 卡片网格 */
        .memory-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }

        .memory-card-item {
          aspect-ratio: 1 / 1;
          outline: none;
          border-radius: var(--radius-md);
        }

        .memory-card-item:focus-visible {
          box-shadow: 0 0 0 2px var(--accent-color);
        }

        .memory-card-item.is-matched {
          cursor: default;
        }

        /* 刚匹配成功的高光脉冲 */
        .memory-card-item.just-matched {
          animation: memoryMatchPulse 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes memoryMatchPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        /* 卡片背面 (未翻开) */
        .memory-card-cover {
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.2s ease,
                      box-shadow 0.2s ease;
          position: relative;
        }

        .memory-card-item:not(.is-matched):hover .memory-card-cover {
          border-color: var(--accent-color);
          box-shadow: 0 6px 16px var(--accent-light);
          transform: translateY(-2px);
        }

        .memory-cover-pattern {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .memory-card-item:not(.is-matched):hover .memory-cover-pattern {
          color: var(--accent-color);
          transform: scale(1.12);
        }

        .memory-chip-icon {
          opacity: 0.55;
        }

        .memory-card-item:not(.is-matched):hover .memory-chip-icon {
          opacity: 0.9;
        }

        .memory-card-id-hint {
          position: absolute;
          bottom: 5px;
          right: 7px;
          font-size: 0.65rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
          color: var(--text-tertiary);
          opacity: 0.35;
          user-select: none;
        }

        /* 卡片正面 (翻开图案) */
        .memory-card-revealed {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: var(--shadow-sm);
        }

        .memory-card-symbol {
          font-size: clamp(1.85rem, 5.5vw, 2.5rem);
          line-height: 1;
          user-select: none;
          transform: scale(1);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .memory-card-revealed.card-selected {
          border-color: var(--accent-color);
          box-shadow: 0 0 16px var(--accent-light);
        }

        /* 配对成功高光翡翠绿样式 */
        .memory-card-revealed.card-matched {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.35),
                      inset 0 0 12px rgba(16, 185, 129, 0.12);
        }

        .memory-card-revealed.card-matched .memory-card-symbol {
          filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4));
        }

        /* 配对成功的翡翠绿色对勾微角标 */
        .memory-matched-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.18);
          border: 1px solid rgba(16, 185, 129, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
          animation: badgePop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes badgePop {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* 底部操作快捷提示 */
        .memory-footer-hint {
          margin-top: 1.25rem;
          font-size: 0.775rem;
          color: var(--text-tertiary);
          text-align: center;
          user-select: none;
        }

        /* 移动端窄屏适配 */
        @media (max-width: 640px) {
          .memory-stage-card {
            padding: 1rem 0.85rem;
          }

          .memory-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.65rem;
            padding: 0.6rem 0.75rem;
            margin-bottom: 0.85rem;
          }

          .memory-bests-box {
            justify-content: center;
            font-size: 0.725rem;
          }

          .memory-grid {
            gap: 8px;
          }

          .memory-card-symbol {
            font-size: clamp(1.6rem, 7.5vw, 2.1rem);
          }

          .memory-matched-badge {
            top: 4px;
            right: 4px;
            width: 16px;
            height: 16px;
          }
        }

        @media (max-width: 380px) {
          .memory-grid {
            gap: 6px;
          }

          .memory-cover-pattern svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}
