import React, { useEffect, useRef, useState, useCallback } from 'react';

// 代码雨字符集：半角片假名 + 数字 + 常用代码符号
const MATRIX_CHARS =
  'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ1234567890ABCDEF{}[]<>=/*+!~';

// 极光粒子预设光色
const AURORA_COLORS = [
  '#00f0ff', // 荧光青
  '#10b981', // 翡翠绿
  '#8b5cf6', // 极光紫
  '#38bdf8', // 霓虹天蓝
  '#f43f5e', // 绚烂粉绯
  '#34d399'  // 薄荷绿
];

/**
 * 原生 Canvas 极光粒子与黑客帝国代码雨微交互组件 (ParticleCanvas)
 *
 * 核心特性：
 * 1. 原生 HTML5 Canvas 自适应 Retina 高分屏（DPI 动态缩放抗锯齿）
 * 2. 双模式切换：【极光微光粒子流】（流体漂移 + 鼠标斥力扰动 + 点击粒子爆炸）与【黑客帝国代码雨】（Matrix Rain）
 * 3. 性能与生命周期保障：组件卸载或切入后台（document.visibilityState === 'hidden'）时自动挂起 requestAnimationFrame，消除能耗泄露
 * 4. 控制药丸：模式切换、粒子迸发、重绘与高矮视图切换
 */
export function ParticleCanvas({ initialMode = 'aurora' }) {
  const [mode, setMode] = useState(initialMode); // 'aurora' | 'matrix'
  const [isExpanded, setIsExpanded] = useState(false);
  const [particleCount, setParticleCount] = useState(85);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafIdRef = useRef(null);
  const isRunningRef = useRef(true);

  // 交互指针坐标
  const mouseRef = useRef({
    x: -9999,
    y: -9999,
    active: false,
    radius: 120
  });

  // 粒子与代码雨状态缓存 (避免重新渲染重置物理系统)
  const particlesRef = useRef([]);
  const burstParticlesRef = useRef([]);
  const matrixColsRef = useRef({
    drops: [],
    fontSize: 15,
    columns: 0
  });

  /**
   * 触发向外放射的粒子爆炸
   */
  const triggerBurst = useCallback((burstX, burstY, count = 36) => {
    const burstColors = ['#ffffff', '#00f0ff', '#10b981', '#f59e0b', '#ec4899'];
    const newBursts = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2.5 + Math.random() * 5.5;
      newBursts.push({
        x: burstX,
        y: burstY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        color: burstColors[Math.floor(Math.random() * burstColors.length)],
        alpha: 1,
        decay: 0.016 + Math.random() * 0.02
      });
    }

    burstParticlesRef.current = [...burstParticlesRef.current, ...newBursts];
  }, []);

  /**
   * 初始化极光粒子流
   */
  const initAuroraParticles = useCallback((width, height, count = 85) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.85,
        vy: (Math.random() - 0.5) * 0.85,
        baseVx: (Math.random() - 0.5) * 0.85,
        baseVy: (Math.random() - 0.5) * 0.85,
        radius: 1.6 + Math.random() * 2.4,
        color: AURORA_COLORS[Math.floor(Math.random() * AURORA_COLORS.length)],
        alpha: 0.35 + Math.random() * 0.55,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    particlesRef.current = arr;
    burstParticlesRef.current = [];
  }, []);

  /**
   * 初始化代码雨列
   */
  const initMatrixRain = useCallback((width) => {
    const fontSize = 15;
    const columns = Math.ceil(width / fontSize);
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -30);
    }
    matrixColsRef.current = {
      drops,
      fontSize,
      columns
    };
  }, []);

  // 重置画布
  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (mode === 'aurora') {
      initAuroraParticles(rect.width, rect.height, particleCount);
      // 在中心位置触发一次轻快爆炸
      triggerBurst(rect.width / 2, rect.height / 2, 28);
    } else {
      initMatrixRain(rect.width);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#050a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [mode, particleCount, initAuroraParticles, initMatrixRain, triggerBurst]);

  // 主物理与渲染循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (mode === 'aurora') {
        if (particlesRef.current.length === 0) {
          initAuroraParticles(width, height, particleCount);
        }
      } else {
        initMatrixRain(width);
        ctx.fillStyle = '#050a0f';
        ctx.fillRect(0, 0, width, height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 帧渲染逻辑
    let lastTime = performance.now();

    const render = (time) => {
      if (!isRunningRef.current) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (mode === 'aurora') {
        // 极光微光模式：柔和半透明尾迹清除
        ctx.clearRect(0, 0, width, height);

        // 绘制连线网格
        const pts = particlesRef.current;
        const maxDist = 72;
        ctx.lineWidth = 0.75;

        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            const dist = Math.hypot(dx, dy);

            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.18;
              ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }

        // 更新与绘制粒子
        const mouse = mouseRef.current;

        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];

          // 鼠标斥力扰动
          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < mouse.radius && dist > 0.001) {
              const force = (1 - dist / mouse.radius) * 7.5;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }
          }

          // 物理平滑巡弋与边缘反弹
          p.pulsePhase += p.pulseSpeed;
          p.x += p.vx;
          p.y += p.vy;

          if (p.x <= 0 || p.x >= width) p.vx *= -1;
          if (p.y <= 0 || p.y >= height) p.vy *= -1;

          // 粒子呼吸微光
          const currentAlpha = Math.max(
            0.15,
            p.alpha + Math.sin(p.pulsePhase) * 0.2
          );

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
        }

        // 绘制迸发爆炸粒子
        const bursts = burstParticlesRef.current;
        for (let i = bursts.length - 1; i >= 0; i--) {
          const b = bursts[i];
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= 0.96;
          b.vy *= 0.96;
          b.alpha -= b.decay;

          if (b.alpha <= 0) {
            bursts.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.globalAlpha = b.alpha;
          ctx.shadowBlur = 12;
          ctx.shadowColor = b.color;
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      } else {
        // 黑客帝国代码雨：半透明黑色背景叠加制造下落光斑拖尾
        ctx.fillStyle = 'rgba(5, 10, 16, 0.16)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${matrixColsRef.current.fontSize}px ui-monospace, SFMono-Regular, monospace`;

        const { drops, fontSize, columns } = matrixColsRef.current;
        const mouse = mouseRef.current;

        for (let i = 0; i < drops.length; i++) {
          const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // 鼠标近距离扰动：加速下落并闪烁
          const isNearMouse =
            mouse.active && Math.abs(mouse.x - x) < 36 && Math.abs(mouse.y - y) < 60;

          if (isNearMouse) {
            ctx.fillStyle = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f0ff';
          } else if (Math.random() > 0.88) {
            // 前导首字符高亮白亮
            ctx.fillStyle = '#f0fdf4';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#10b981';
          } else {
            // 经典赛博绿色渐进
            ctx.fillStyle = '#10b981';
            ctx.shadowBlur = 0;
          }

          ctx.fillText(char, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i] += isNearMouse ? 1.6 : 0.85;
        }

        ctx.shadowBlur = 0;
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    // 启动渲染循环
    isRunningRef.current = true;
    rafIdRef.current = requestAnimationFrame(render);

    // 页面可见性感知：后台标签页休眠，彻底消除 GPU/CPU 能耗
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isRunningRef.current = false;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      } else if (document.visibilityState === 'visible') {
        if (!isRunningRef.current) {
          isRunningRef.current = true;
          lastTime = performance.now();
          rafIdRef.current = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isRunningRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mode, initAuroraParticles, initMatrixRain, particleCount]);

  // 鼠标交互事件监听
  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
      radius: mode === 'aurora' ? 120 : 60
    };
  };

  const handlePointerLeave = () => {
    mouseRef.current.active = false;
  };

  // 点击画布触发粒子爆炸
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (mode === 'aurora') {
      triggerBurst(clickX, clickY, 32);
    } else {
      // 代码雨点击时震荡该列
      const col = Math.floor(clickX / matrixColsRef.current.fontSize);
      if (matrixColsRef.current.drops[col] !== undefined) {
        matrixColsRef.current.drops[col] = 0;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="particle-canvas-container"
      aria-label="极光粒子与代码雨交互画布"
    >
      <style>{`
        .particle-canvas-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 0.9rem;
          position: relative;
        }

        .particle-viewport-card {
          width: 100%;
          height: ${isExpanded ? '460px' : '320px'};
          border-radius: 18px;
          background: #06090e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.6), 0 8px 30px rgba(0, 0, 0, 0.25);
          transition: height 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: crosshair;
        }

        .particle-canvas-element {
          width: 100%;
          height: 100%;
          display: block;
        }

        .particle-hud-overlay {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          pointer-events: none;
          z-index: 5;
        }

        .particle-hud-tag {
          font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: ${mode === 'aurora' ? '#00f0ff' : '#10b981'};
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .particle-fps-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: ${mode === 'aurora' ? '#00f0ff' : '#10b981'};
          box-shadow: 0 0 6px ${mode === 'aurora' ? '#00f0ff' : '#10b981'};
        }

        /* 控制药丸工具条 */
        .particle-control-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.35rem 0.4rem;
          border-radius: var(--radius-pill, 9999px);
          background-color: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
          box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04));
        }

        .particle-mode-group {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .particle-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.85rem;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-secondary, #86868b);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .particle-pill-btn:hover {
          color: var(--text-primary, #1d1d1f);
        }

        .particle-pill-btn.is-active {
          background-color: var(--bg-surface-secondary, #f0f0f2);
          color: var(--text-primary, #1d1d1f);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .particle-action-group {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .particle-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.38rem 0.75rem;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary, #86868b);
          background: transparent;
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .particle-action-btn:hover {
          color: var(--text-primary, #1d1d1f);
          border-color: var(--border-hover, rgba(0, 0, 0, 0.15));
          background-color: var(--bg-hover, rgba(0, 0, 0, 0.03));
        }

        .particle-action-btn:active {
          transform: scale(0.96);
        }

        .particle-instruction-hint {
          font-size: 0.78rem;
          color: var(--text-tertiary, #a1a1a6);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding-left: 0.4rem;
        }
      `}</style>

      {/* 渲染画布视口 */}
      <div className="particle-viewport-card">
        {/* HUD 状态小标 */}
        <div className="particle-hud-overlay">
          <span className="particle-hud-tag">
            <span className="particle-fps-dot" />
            {mode === 'aurora' ? 'AURORA FLUID // 60 FPS' : 'MATRIX RAIN // RAIN ENGINE'}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          className="particle-canvas-element"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={handleCanvasClick}
        />
      </div>

      {/* 控制药丸 */}
      <div className="particle-control-bar">
        {/* 模式选择 */}
        <div className="particle-mode-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'aurora'}
            className={`particle-pill-btn ${mode === 'aurora' ? 'is-active' : ''}`}
            onClick={() => setMode('aurora')}
          >
            <span>✨</span>
            <span>极光粒子流</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'matrix'}
            className={`particle-pill-btn ${mode === 'matrix' ? 'is-active' : ''}`}
            onClick={() => setMode('matrix')}
          >
            <span>🟢</span>
            <span>黑客代码雨</span>
          </button>
        </div>

        {/* 辅助动作组 */}
        <div className="particle-action-group">
          <button
            type="button"
            className="particle-action-btn"
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas) {
                const rect = canvas.getBoundingClientRect();
                triggerBurst(rect.width / 2, rect.height / 2, 40);
              }
            }}
            title="迸发高能粒子"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>迸发</span>
          </button>

          <button
            type="button"
            className="particle-action-btn"
            onClick={handleReset}
            title="重绘当前画布"
          >
            <svg
              width="13"
              height="13"
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
            <span>重置</span>
          </button>

          <button
            type="button"
            className="particle-action-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? '收起画布' : '展开大幅画布'}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isExpanded ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
            <span>{isExpanded ? '紧凑' : '展开'}</span>
          </button>
        </div>
      </div>

      <p className="particle-instruction-hint">
        <svg
          width="13"
          height="13"
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
        移动光标激荡流体排斥波纹，点击画布任意位置激发粒子爆裂；切出后台标签页自动休眠以捍卫能耗
      </p>
    </div>
  );
}

export default ParticleCanvas;
