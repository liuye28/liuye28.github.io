import React from 'react';
import { labQuotes } from '../../data/profileData';
import { HologramCard } from './lab/HologramCard';
import { ParticleCanvas } from './lab/ParticleCanvas';
import { QuoteTyper } from './lab/QuoteTyper';

/**
 * 创意实验室容器组件 (LabSection)
 *
 * 遵循 Apple HIG 极客展厅与微交互美学：
 * 1. 实验一：3D 悬浮流光极客通行证（CSS 3D 透视倾斜 + 菲涅尔反光 + 3 款材质皮肤）
 * 2. 实验二：原生 Canvas 极光微光粒子与黑客帝国代码雨（流体扰动 + 爆炸 + 后台休眠）
 * 3. 实验三：极客灵感打字机与 Web Audio 物理频率合成（击键轻音 + 落地颂钵和弦）
 *
 * @param {object} props
 * @param {Array} [props.quotes=labQuotes] 灵感名言数据源
 */
export function LabSection({ quotes = labQuotes }) {
  return (
    <div className="lab-section-wrapper" aria-label="创意实验室">
      <style>{`
        .lab-section-wrapper {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        .lab-header-group {
          margin-bottom: 0.5rem;
        }

        .lab-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.4rem;
        }

        .lab-title-indicator {
          width: 4px;
          height: 22px;
          border-radius: var(--radius-pill, 9999px);
          background: linear-gradient(180deg, #00f0ff 0%, #0071e3 50%, #5856d6 100%);
          flex-shrink: 0;
        }

        .lab-section-title {
          font-size: 1.55rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--text-primary, #1d1d1f);
          margin: 0;
          font-family: var(--font-sans);
        }

        .lab-section-subtitle {
          font-size: 0.94rem;
          color: var(--text-secondary, #86868b);
          margin: 0;
          line-height: 1.6;
          padding-left: calc(4px + 0.65rem);
        }

        .lab-experiments-grid {
          display: flex;
          flex-direction: column;
          gap: 2.8rem;
          width: 100%;
        }

        /* 独立实验卡片外框 */
        .lab-item-card {
          background-color: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          border-radius: var(--radius-lg, 18px);
          padding: 1.75rem 1.6rem;
          box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.03));
          transition: var(--transition-normal, all 0.3s cubic-bezier(0.16, 1, 0.3, 1));
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
        }

        .lab-item-card:hover {
          border-color: var(--border-hover, rgba(0, 0, 0, 0.12));
          box-shadow: var(--shadow-card-hover, 0 12px 30px rgba(0, 0, 0, 0.06));
        }

        .lab-item-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.05));
        }

        .lab-item-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .lab-item-title-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        .lab-item-title {
          font-size: 1.18rem;
          font-weight: 700;
          letter-spacing: -0.015em;
          color: var(--text-primary, #1d1d1f);
          margin: 0;
        }

        .lab-tech-pill {
          font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-pill, 9999px);
          background-color: var(--bg-surface-secondary, #f0f0f2);
          color: var(--text-secondary, #86868b);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
        }

        .lab-tech-pill-accent {
          background-color: rgba(0, 113, 227, 0.08);
          color: var(--accent-color, #0071e3);
          border-color: rgba(0, 113, 227, 0.2);
        }

        .lab-item-desc {
          font-size: 0.88rem;
          color: var(--text-secondary, #86868b);
          margin: 0;
          line-height: 1.5;
        }

        .lab-experiment-stage {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* 移动端间距适配 */
        @media (max-width: 640px) {
          .lab-section-wrapper {
            gap: 2.25rem;
          }

          .lab-item-card {
            padding: 1.25rem 1rem;
            border-radius: var(--radius-md, 14px);
          }

          .lab-section-title {
            font-size: 1.35rem;
          }

          .lab-section-subtitle {
            font-size: 0.88rem;
          }
        }
      `}</style>

      {/* 实验室区块导言 */}
      <div className="lab-header-group">
        <div className="lab-section-title-wrap">
          <div className="lab-title-indicator" />
          <h2 className="lab-section-title">创意实验室 (Playground)</h2>
        </div>
        <p className="lab-section-subtitle">
          基于纯原生 Web API（Canvas 2D、CSS 3D 变换、Web Audio 物理频率合成）打造的客户端交互实验，零外部重依赖，极致流畅，探索人机界面的交互美学。
        </p>
      </div>

      <div className="lab-experiments-grid">
        {/* 实验 1: 3D 悬浮流光极客通行证 */}
        <section className="lab-item-card" aria-label="实验一：3D 悬浮流光极客通行证">
          <div className="lab-item-header">
            <div className="lab-item-meta">
              <div className="lab-item-title-row">
                <h3 className="lab-item-title">3D 悬浮流光极客通行证</h3>
                <span className="lab-tech-pill lab-tech-pill-accent">CSS 3D · 菲涅尔衍射</span>
              </div>
              <p className="lab-item-desc">
                三维空间物理透视倾斜、光标坐标菲涅尔高光追踪与 3 款自研质感皮肤切换
              </p>
            </div>
          </div>
          <div className="lab-experiment-stage">
            <HologramCard />
          </div>
        </section>

        {/* 实验 2: 原生极光粒子流与代码雨矩阵 */}
        <section className="lab-item-card" aria-label="实验二：原生极光粒子流与代码雨矩阵">
          <div className="lab-item-header">
            <div className="lab-item-meta">
              <div className="lab-item-title-row">
                <h3 className="lab-item-title">极光微光粒子流与代码雨矩阵</h3>
                <span className="lab-tech-pill lab-tech-pill-accent">Canvas 2D · 流体力学</span>
              </div>
              <p className="lab-item-desc">
                原生 HTML5 Canvas 渲染引擎、Retina 级像素密度抗锯齿、流体斥力扰动与后台节能休眠
              </p>
            </div>
          </div>
          <div className="lab-experiment-stage">
            <ParticleCanvas />
          </div>
        </section>

        {/* 实验 3: 极客灵感打字机与原生和弦合成 */}
        <section className="lab-item-card" aria-label="实验三：极客灵感打字机与原生和弦合成">
          <div className="lab-item-header">
            <div className="lab-item-meta">
              <div className="lab-item-title-row">
                <h3 className="lab-item-title">极客灵感打字机与原生和弦合成</h3>
                <span className="lab-tech-pill lab-tech-pill-accent">Web Audio · 物理拟真</span>
              </div>
              <p className="lab-item-desc">
                原生 Web Audio API 物理敲击滴答音与大七和弦合成，打字机拟真节奏逐字输出
              </p>
            </div>
          </div>
          <div className="lab-experiment-stage">
            <QuoteTyper quotes={quotes} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default LabSection;
