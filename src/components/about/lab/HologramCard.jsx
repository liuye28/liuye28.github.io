import React, { useState, useRef, useCallback } from 'react';

/**
 * 3 款质感皮肤预设配置
 */
const SKINS = {
  obsidian: {
    id: 'obsidian',
    name: '黑晶幽浮',
    badge: 'Obsidian Jet',
    icon: '🌌',
    accent: '#00f0ff',
    secondary: '#3b82f6',
    bg: 'linear-gradient(135deg, #090e17 0%, #0d1527 50%, #050811 100%)',
    border: 'rgba(0, 240, 255, 0.35)',
    glow: '0 12px 40px rgba(0, 240, 255, 0.18), 0 0 20px rgba(59, 130, 246, 0.25)',
    chipGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    textColor: '#f8fafc',
    subTextColor: '#94a3b8',
    gridColor: 'rgba(0, 240, 255, 0.06)'
  },
  cyber: {
    id: 'cyber',
    name: '赛博霓虹',
    badge: 'Cyber Neon',
    icon: '⚡',
    accent: '#ff007f',
    secondary: '#00f0ff',
    bg: 'linear-gradient(135deg, #180928 0%, #290d40 50%, #0c0517 100%)',
    border: 'rgba(255, 0, 128, 0.45)',
    glow: '0 12px 40px rgba(255, 0, 128, 0.25), 0 0 25px rgba(0, 240, 255, 0.2)',
    chipGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    textColor: '#ffffff',
    subTextColor: '#c084fc',
    gridColor: 'rgba(255, 0, 128, 0.08)'
  },
  silver: {
    id: 'silver',
    name: '磨砂纯银',
    badge: 'Silver Matte',
    icon: '💎',
    accent: '#0284c7',
    secondary: '#64748b',
    bg: 'linear-gradient(135deg, rgba(248, 250, 252, 0.96) 0%, rgba(226, 232, 240, 0.92) 50%, rgba(241, 245, 249, 0.96) 100%)',
    border: 'rgba(203, 213, 225, 0.7)',
    glow: '0 12px 35px rgba(100, 116, 139, 0.18), 0 4px 12px rgba(0, 0, 0, 0.05)',
    chipGradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    textColor: '#0f172a',
    subTextColor: '#475569',
    gridColor: 'rgba(100, 116, 139, 0.08)'
  }
};

const DEFAULT_BADGES = ['JVM 核心', '分布式系统', '高并发调优', '现代全栈', 'Web3 / DeFi'];

/**
 * 3D 悬浮流光极客通行证组件 (HologramCard)
 *
 * 核心微交互：
 * 1. 3D 透视倾斜（perspective: 1000px & rotate3d）
 * 2. 菲涅尔彩虹反光高光跟随光标实时游走
 * 3. 移出鼠标平滑复位阻尼动画
 * 4. 黑晶幽浮 / 赛博霓虹 / 磨砂纯银 3 款材质皮肤切换
 *
 * @param {object} props
 * @param {string} [props.name='Ly'] 通行证姓名
 * @param {string} [props.handle='@liuye28'] 极客标识
 * @param {string} [props.title='高并发架构师 · 全栈工程师'] 职能头衔
 * @param {string[]} [props.badges] 技术徽标列表
 * @param {string} [props.initialSkin='obsidian'] 初始皮肤 ID
 */
export function HologramCard({
  name = 'Ly',
  handle = '@liuye28',
  title = '高并发架构师 · 全栈开发者',
  badges = DEFAULT_BADGES,
  initialSkin = 'obsidian'
}) {
  const [currentSkinId, setCurrentSkinId] = useState(
    SKINS[initialSkin] ? initialSkin : 'obsidian'
  );
  const skin = SKINS[currentSkinId] || SKINS.obsidian;

  // 倾斜与高光状态
  const [coords, setCoords] = useState({
    rotX: 0,
    rotY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    isHovered: false
  });

  const cardRef = useRef(null);

  // 鼠标移动监听：计算透视角度与高光坐标
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const maxTilt = 14; // 最大倾斜角度 (deg)
    const rotX = Number(((0.5 - y) * 2 * maxTilt).toFixed(2));
    const rotY = Number(((x - 0.5) * 2 * maxTilt).toFixed(2));

    setCoords({
      rotX,
      rotY,
      glareX: Number((x * 100).toFixed(1)),
      glareY: Number((y * 100).toFixed(1)),
      glareOpacity: 1,
      isHovered: true
    });
  }, []);

  // 鼠标移出：平滑回弹复位
  const handleMouseLeave = useCallback(() => {
    setCoords((prev) => ({
      ...prev,
      rotX: 0,
      rotY: 0,
      glareOpacity: 0,
      isHovered: false
    }));
  }, []);

  return (
    <div className="hologram-card-container">
      <style>{`
        .hologram-card-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          gap: 1.5rem;
          user-select: none;
        }

        .hologram-perspective-wrap {
          perspective: 1000px;
          perspective-origin: center center;
          width: 100%;
          max-width: 440px;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem 0;
        }

        .hologram-card {
          width: 100%;
          border-radius: 20px;
          padding: 1.65rem 1.5rem;
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          will-change: transform, box-shadow;
          cursor: crosshair;
        }

        /* 3D 纵深层级 (Parallax) */
        .hologram-layer-base {
          position: relative;
          z-index: 10;
          transform-style: preserve-3d;
        }

        .hologram-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          transform: translateZ(28px);
        }

        .hologram-chip-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* 智能芯片金属拟物质感 */
        .hologram-chip {
          width: 42px;
          height: 32px;
          border-radius: 6px;
          position: relative;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 2px 5px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }

        .hologram-chip::before {
          content: '';
          position: absolute;
          width: 65%;
          height: 100%;
          border-left: 1px solid rgba(0, 0, 0, 0.25);
          border-right: 1px solid rgba(0, 0, 0, 0.25);
        }

        .hologram-chip::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 40%;
          border-top: 1px solid rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid rgba(0, 0, 0, 0.25);
        }

        .hologram-nfc-icon {
          width: 18px;
          height: 18px;
          opacity: 0.75;
        }

        .hologram-badge-pill {
          font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid;
          background: rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(8px);
        }

        .hologram-identity {
          margin-bottom: 1.4rem;
          transform: translateZ(36px);
        }

        .hologram-avatar-wrap {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.85rem;
        }

        .hologram-avatar-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.35rem;
          border: 2px solid;
          position: relative;
          box-shadow: 0 0 16px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .hologram-name {
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 0.15rem 0;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .hologram-handle {
          font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
          font-size: 0.82rem;
          opacity: 0.85;
          margin: 0;
        }

        .hologram-title {
          font-size: 0.88rem;
          font-weight: 600;
          margin: 0.2rem 0 0 0;
          letter-spacing: 0.01em;
        }

        /* 徽标胶囊组 */
        .hologram-badges-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 1.6rem;
          transform: translateZ(24px);
        }

        .hologram-tech-tag {
          font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
          font-size: 0.73rem;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }

        /* 底部验证条形码与状态 */
        .hologram-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
          transform: translateZ(20px);
        }

        .hologram-matrix-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.68rem;
          letter-spacing: 0.04em;
        }

        .hologram-status-verified {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 700;
        }

        .hologram-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: hologramPulse 2s infinite ease-in-out;
        }

        @keyframes hologramPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }

        /* 仿真条形码装饰 */
        .hologram-barcode {
          display: flex;
          gap: 2.5px;
          height: 24px;
          align-items: flex-end;
          opacity: 0.7;
        }

        .hologram-bar {
          background-color: currentColor;
          height: 100%;
          border-radius: 1px;
        }

        /* 极客底纹网格 */
        .hologram-grid-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background-size: 24px 24px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
        }

        /* 彩虹菲涅尔高光与衍射层 */
        .hologram-glare-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
          border-radius: inherit;
          mix-blend-mode: overlay;
          transition: opacity ${coords.isHovered ? '0.1s' : '0.5s'} ease;
        }

        .hologram-diffraction-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 19;
          border-radius: inherit;
          mix-blend-mode: color-dodge;
          transition: opacity ${coords.isHovered ? '0.12s' : '0.5s'} ease;
        }

        /* 皮肤切换胶囊控制器 */
        .hologram-skin-bar {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.4rem;
          border-radius: var(--radius-pill, 9999px);
          background-color: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
          box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04));
        }

        .hologram-skin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.95rem;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-secondary, #86868b);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hologram-skin-btn:hover {
          color: var(--text-primary, #1d1d1f);
        }

        .hologram-skin-btn.is-active {
          background-color: var(--bg-surface-secondary, #f0f0f2);
          color: var(--text-primary, #1d1d1f);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .hologram-skin-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .hologram-interactive-hint {
          font-size: 0.8rem;
          color: var(--text-tertiary, #a1a1a6);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
      `}</style>

      {/* 3D 透视工作区 */}
      <div className="hologram-perspective-wrap">
        <div
          ref={cardRef}
          className="hologram-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            background: skin.bg,
            border: `1px solid ${skin.border}`,
            boxShadow: coords.isHovered ? skin.glow : '0 8px 24px rgba(0,0,0,0.12)',
            color: skin.textColor,
            transform: `perspective(1000px) rotateX(${coords.rotX}deg) rotateY(${coords.rotY}deg) scale3d(${coords.isHovered ? 1.02 : 1}, ${coords.isHovered ? 1.02 : 1}, 1)`,
            transition: coords.isHovered
              ? 'transform 0.08s linear, box-shadow 0.2s ease'
              : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease'
          }}
          aria-label={`${name} 极客通行证 (${skin.name} 皮肤)`}
        >
          {/* 底纹网格图层 */}
          <div
            className="hologram-grid-layer"
            style={{
              backgroundImage: `radial-gradient(${skin.gridColor} 1.5px, transparent 1.5px)`
            }}
          />

          {/* 菲涅尔彩虹衍射流光 */}
          <div
            className="hologram-diffraction-layer"
            style={{
              opacity: coords.glareOpacity * 0.45,
              background: `linear-gradient(${115 + coords.rotY * 4}deg, rgba(255,0,128,0.3) 0%, rgba(0,240,255,0.3) 25%, rgba(255,220,0,0.3) 50%, rgba(138,43,226,0.3) 75%, rgba(0,255,180,0.3) 100%)`
            }}
          />

          {/* 聚光灯跟随高光 */}
          <div
            className="hologram-glare-layer"
            style={{
              opacity: coords.glareOpacity * 0.55,
              background: `radial-gradient(circle at ${coords.glareX}% ${coords.glareY}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)`
            }}
          />

          {/* 3D 纵深卡片内容 */}
          <div className="hologram-layer-base">
            {/* 顶栏：芯片与权限徽章 */}
            <div className="hologram-header">
              <div className="hologram-chip-group">
                <div
                  className="hologram-chip"
                  style={{ background: skin.chipGradient }}
                  title="智能加密安全芯片"
                />
                <svg
                  className="hologram-nfc-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 8a6 6 0 0 1 12 0" />
                  <path d="M4 12a10 10 0 0 1 16 0" />
                  <path d="M2 16a14 14 0 0 1 20 0" />
                </svg>
              </div>

              <span
                className="hologram-badge-pill"
                style={{
                  color: skin.accent,
                  borderColor: skin.accent
                }}
              >
                LEVEL-5 // {skin.badge}
              </span>
            </div>

            {/* 核心身份层 */}
            <div className="hologram-identity">
              <div className="hologram-avatar-wrap">
                <div
                  className="hologram-avatar-circle"
                  style={{
                    borderColor: skin.accent,
                    color: skin.accent,
                    background: 'rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="hologram-name">
                    {name}
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 400,
                        color: skin.accent
                      }}
                    >
                      #2026
                    </span>
                  </h3>
                  <p className="hologram-handle" style={{ color: skin.subTextColor }}>
                    {handle}
                  </p>
                </div>
              </div>
              <p className="hologram-title" style={{ color: skin.textColor }}>
                {title}
              </p>
            </div>

            {/* 技术徽章 */}
            <div className="hologram-badges-grid">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="hologram-tech-tag"
                  style={{ color: skin.subTextColor }}
                >
                  {b}
                </span>
              ))}
            </div>

            {/* 底部凭证流水号与条形码 */}
            <div
              className="hologram-footer"
              style={{ color: skin.subTextColor }}
            >
              <div className="hologram-matrix-info">
                <span className="hologram-status-verified" style={{ color: skin.textColor }}>
                  <span className="hologram-status-dot" />
                  AUTHENTICATED
                </span>
                <span>SEC: 0x7E3F...B98A // PERPETUAL</span>
              </div>

              <div className="hologram-barcode" aria-hidden="true">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1].map((w, i) => (
                  <span
                    key={i}
                    className="hologram-bar"
                    style={{
                      width: `${w}px`,
                      opacity: (i % 2 === 0 ? 0.9 : 0.4)
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 材质皮肤切换药丸控制器 */}
      <div className="hologram-skin-bar" role="tablist" aria-label="通行证皮肤选择">
        {Object.values(SKINS).map((item) => {
          const isActive = item.id === currentSkinId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`hologram-skin-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => setCurrentSkinId(item.id)}
            >
              <span
                className="hologram-skin-dot"
                style={{ backgroundColor: item.accent }}
              />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      <p className="hologram-interactive-hint">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 3h6v6" />
          <path d="M9 21H3v-6" />
          <path d="M21 3l-7 7" />
          <path d="M3 21l7-7" />
        </svg>
        晃动光标体验三维视角倾斜与菲涅尔衍射反光
      </p>
    </div>
  );
}

export default HologramCard;
