import React from 'react';
import { hardwareDesk, softwareStack } from '../../data/profileData';

/**
 * 硬件分类与设备图标
 */
function renderHardwareIcon(category = '', name = '') {
  const text = `${category} ${name}`.toLowerCase();

  // 计算核心 / 电脑
  if (text.includes('mac') || text.includes('计算') || text.includes('主机') || text.includes('pc') || text.includes('cpu')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M2 20h20" />
      </svg>
    );
  }

  // 显示器
  if (text.includes('显示') || text.includes('dell') || text.includes('screen') || text.includes('monitor')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }

  // 键盘外设
  if (text.includes('hhkb') || text.includes('键盘') || text.includes('keyboard')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
      </svg>
    );
  }

  // 鼠标 / 工效
  if (text.includes('mouse') || text.includes('master') || text.includes('鼠标')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6" y="3" width="12" height="18" rx="6" />
        <path d="M12 7v4" />
      </svg>
    );
  }

  // 音频 / 耳机
  if (text.includes('audio') || text.includes('音频') || text.includes('耳机') || text.includes('sony') || text.includes('wh-')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }

  // 灯具 / 桌面照明 / 默认外设
  return (
    <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

/**
 * 软件工具分类图标
 */
function renderSoftwareIcon(category = '', name = '') {
  const text = `${category} ${name}`.toLowerCase();

  // 终端环境
  if (text.includes('终端') || text.includes('terminal') || text.includes('warp') || text.includes('shell')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    );
  }

  // 效率启动器 / 快捷工具
  if (text.includes('raycast') || text.includes('效率') || text.includes('启动') || text.includes('launcher')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }

  // 知识管理 / 笔记
  if (text.includes('obsidian') || text.includes('知识') || text.includes('笔记') || text.includes('大脑') || text.includes('note')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }

  // 容器 / 基础设施
  if (text.includes('orbstack') || text.includes('docker') || text.includes('容器') || text.includes('基础')) {
    return (
      <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }

  // 开发工具 / IDE
  return (
    <svg className="uses-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/**
 * 极客装备库组件（UsesSection）
 *
 * 遵循 Apple HIG 拟物与极简美学：
 * 1. 硬件装备板块（Desk Setup）：设备名、规格型号微标、类别标签与说明文案
 * 2. 软件工具流板块（Dev & Workflow Stack）：软件名、分类标签、特性 Tag、说明文案与直达官网外链
 * 3. 优雅的 Apple 风格网格排版，完全兼容深浅色模式 CSS 变量与移动端响应式
 *
 * @param {object} props
 * @param {Array} [props.hardware=hardwareDesk] 硬件配置列表
 * @param {Array} [props.software=softwareStack] 软件配置列表
 */
export default function UsesSection({
  hardware = hardwareDesk,
  software = softwareStack
}) {
  const hardwareList = Array.isArray(hardware) ? hardware : hardwareDesk;
  const softwareList = Array.isArray(software) ? software : softwareStack;

  return (
    <div className="uses-section-wrapper" aria-label="极客装备库与工具链">
      <style>{`
        .uses-section-wrapper {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3.25rem;
        }

        .uses-block {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .uses-header-group {
          margin-bottom: 1.5rem;
        }

        .uses-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.4rem;
        }

        .uses-title-indicator {
          width: 4px;
          height: 20px;
          border-radius: var(--radius-pill, 9999px);
          background: linear-gradient(180deg, var(--accent-color, #0071e3) 0%, #5856d6 100%);
          flex-shrink: 0;
        }

        .uses-section-title {
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--text-primary, #1d1d1f);
          margin: 0;
          font-family: var(--font-sans);
        }

        .uses-section-subtitle {
          font-size: 0.92rem;
          color: var(--text-secondary, #86868b);
          margin: 0;
          line-height: 1.55;
          padding-left: calc(4px + 0.65rem);
        }

        .uses-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(295px, 1fr));
          gap: 1.25rem;
          width: 100%;
        }

        .uses-card {
          background-color: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          border-radius: var(--radius-lg, 18px);
          padding: 1.4rem;
          box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.03));
          transition: var(--transition-fast, all 0.2s cubic-bezier(0.16, 1, 0.3, 1));
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .uses-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-card-hover, 0 12px 30px rgba(0, 0, 0, 0.08));
          border-color: var(--border-hover, rgba(0, 0, 0, 0.12));
        }

        .uses-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
        }

        .uses-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md, 14px);
          background-color: var(--bg-surface-secondary, #f0f0f2);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-color, #0071e3);
          flex-shrink: 0;
        }

        .uses-type-icon {
          width: 20px;
          height: 20px;
        }

        .uses-tags-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          justify-content: flex-end;
        }

        .uses-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: var(--radius-pill, 9999px);
          line-height: 1.25;
        }

        .uses-pill-category {
          background-color: var(--bg-surface-secondary, #f0f0f2);
          color: var(--text-secondary, #86868b);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
        }

        .uses-pill-tag {
          background-color: var(--accent-light, #e8f2fc);
          color: var(--accent-color, #0071e3);
          border: 1px solid transparent;
        }

        .uses-card-title {
          font-size: 1.12rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: var(--text-primary, #1d1d1f);
          margin: 0 0 0.5rem 0;
          line-height: 1.35;
        }

        .uses-spec-box {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.78rem;
          color: var(--text-secondary, #86868b);
          background-color: var(--bg-surface-secondary, #f0f0f2);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          border-radius: var(--radius-xs, 6px);
          padding: 0.35rem 0.6rem;
          margin-bottom: 0.75rem;
          line-height: 1.45;
          word-break: break-word;
        }

        .uses-card-desc {
          font-size: 0.88rem;
          color: var(--text-secondary, #86868b);
          line-height: 1.6;
          margin: 0;
          flex-grow: 1;
        }

        .uses-card-footer {
          margin-top: 1.1rem;
          padding-top: 0.85rem;
          border-top: 1px dashed var(--border-subtle, rgba(0, 0, 0, 0.06));
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .uses-ext-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--accent-color, #0071e3);
          text-decoration: none;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-pill, 9999px);
          background-color: var(--accent-light, #e8f2fc);
          transition: var(--transition-fast, all 0.2s ease);
        }

        .uses-ext-link:hover {
          background-color: var(--accent-color, #0071e3);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .uses-ext-icon {
          width: 13px;
          height: 13px;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .uses-section-wrapper {
            gap: 2.25rem;
          }
          .uses-cards-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .uses-card {
            padding: 1.15rem;
          }
          .uses-section-title {
            font-size: 1.28rem;
          }
          .uses-section-subtitle {
            font-size: 0.86rem;
            padding-left: 0;
          }
          .uses-section-title-wrap {
            gap: 0.5rem;
          }
        }
      `}</style>

      {/* 硬件装备板块 */}
      <section className="uses-block" aria-labelledby="hardware-heading">
        <div className="uses-header-group">
          <div className="uses-section-title-wrap">
            <span className="uses-title-indicator" aria-hidden="true" />
            <h2 id="hardware-heading" className="uses-section-title">
              硬件装备 (Hardware Desk)
            </h2>
          </div>
          <p className="uses-section-subtitle">
            工欲善其事，必先利其器。打造高专注、低疲劳的深度编码与微服务集群模拟工作台。
          </p>
        </div>

        <div className="uses-cards-grid">
          {hardwareList.map((item, index) => (
            <article key={item.name || index} className="uses-card">
              <div className="uses-card-header">
                <div className="uses-icon-badge">
                  {renderHardwareIcon(item.category, item.name)}
                </div>
                <div className="uses-tags-group">
                  {item.category && (
                    <span className="uses-pill uses-pill-category">
                      {item.category}
                    </span>
                  )}
                  {item.tag && (
                    <span className="uses-pill uses-pill-tag">
                      {item.tag}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="uses-card-title">{item.name}</h3>

              {item.spec && (
                <div className="uses-spec-box" title={`规格配置：${item.spec}`}>
                  {item.spec}
                </div>
              )}

              <p className="uses-card-desc">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 软件工具流板块 */}
      <section className="uses-block" aria-labelledby="software-heading">
        <div className="uses-header-group">
          <div className="uses-section-title-wrap">
            <span className="uses-title-indicator" aria-hidden="true" />
            <h2 id="software-heading" className="uses-section-title">
              软件与工具流 (Software & Stack)
            </h2>
          </div>
          <p className="uses-section-subtitle">
            追求极致的心流体验与击键效率，严选 JVM 架构研发、终端加速与数字第二大脑。
          </p>
        </div>

        <div className="uses-cards-grid">
          {softwareList.map((item, index) => (
            <article key={item.name || index} className="uses-card">
              <div className="uses-card-header">
                <div className="uses-icon-badge">
                  {renderSoftwareIcon(item.category, item.name)}
                </div>
                <div className="uses-tags-group">
                  {item.category && (
                    <span className="uses-pill uses-pill-category">
                      {item.category}
                    </span>
                  )}
                  {item.tag && (
                    <span className="uses-pill uses-pill-tag">
                      {item.tag}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="uses-card-title">{item.name}</h3>

              <p className="uses-card-desc">{item.desc}</p>

              {item.url && (
                <div className="uses-card-footer">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="uses-ext-link"
                    aria-label={`访问 ${item.name} 官方网站（将在新窗口打开）`}
                  >
                    <span>直达官网</span>
                    <svg
                      className="uses-ext-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export { UsesSection };
