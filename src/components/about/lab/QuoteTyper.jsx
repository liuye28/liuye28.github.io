import React, { useState, useEffect, useRef, useCallback } from 'react';
import { labQuotes } from '../../../data/profileData';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

// 懒加载 Web Audio 上下文单例
let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * 合成机械键盘敲击轻音（物理拟真按键脉冲）
 */
function playKeypressAudio(isMuted) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 快速由高到低的微弱脉冲，仿机械轴微动触底
    osc.type = 'triangle';
    const baseFreq = 1600 + Math.random() * 500;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.022);

    // 细微音量，确保优雅不刺耳
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch {
    // 忽略受浏览器自动播放策略限制的异常
  }
}

/**
 * 合成打字完成舒缓和弦（仿颂钵 / Apple 舒缓大七和弦）
 */
function playCompletionChordAudio(isMuted) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // C maj9 谐和音程：C5(523.25), E5(659.25), G5(783.99), B5(987.77), D6(1174.66)
    const chordFrequencies = [523.25, 659.25, 783.99, 987.77, 1174.66];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.07, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    masterGain.connect(ctx.destination);

    chordFrequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startTime = now + index * 0.035;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + 1.6);
    });
  } catch {
    // 忽略异常
  }
}

/**
 * 极客灵感名言打字机与原生音效组件 (QuoteTyper)
 *
 * 核心交互：
 * 1. 极客名言打字机逐字输出与呼吸光标动效
 * 2. 基于原生 Web Audio API 纯代码实时频率合成（击键轻音 + 落地颂钵和弦）
 * 3. 具备静音开关、一键复制名言与抽取下一句灵感
 *
 * @param {object} props
 * @param {Array} [props.quotes=labQuotes] 名言库列表
 */
export function QuoteTyper({ quotes = labQuotes }) {
  const quoteList = Array.isArray(quotes) && quotes.length > 0 ? quotes : labQuotes;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // 剪贴板复制 Hook (2000ms 重置)
  const [copied, copy] = useCopyToClipboard(2000);

  const activeQuote = quoteList[currentIndex] || quoteList[0];
  const typingTimerRef = useRef(null);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // 逐字打字机循环
  useEffect(() => {
    const fullText = activeQuote?.quote || '';
    let currentPos = 0;
    setDisplayedText('');
    setIsTyping(true);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    const typeNextChar = () => {
      if (currentPos < fullText.length) {
        const nextChar = fullText.charAt(currentPos);
        setDisplayedText(fullText.slice(0, currentPos + 1));
        currentPos++;

        // 敲击声效
        playKeypressAudio(isMutedRef.current);

        // 标点符号稍作停顿，制造拟真人类节奏
        let delay = 35 + Math.random() * 20;
        if ([',', '.', '!', '?', ';', ':', '—'].includes(nextChar)) {
          delay = 140;
        }

        typingTimerRef.current = setTimeout(typeNextChar, delay);
      } else {
        // 完成敲击，触发落地舒缓和弦
        setIsTyping(false);
        playCompletionChordAudio(isMutedRef.current);
      }
    };

    // 延迟 120ms 开始打字，防止连续切换瞬闪
    typingTimerRef.current = setTimeout(typeNextChar, 120);

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [currentIndex, activeQuote]);

  // 抽取下一句名言
  const handleNextQuote = useCallback(() => {
    // 点击时若浏览器处于暂停音频状态，顺手唤醒
    getAudioContext();
    setCurrentIndex((prev) => (prev + 1) % quoteList.length);
  }, [quoteList.length]);

  // 复制当前名言全文
  const handleCopyQuote = useCallback(() => {
    if (!activeQuote) return;
    const textToCopy = `“${activeQuote.quote}” —— ${activeQuote.author} (${activeQuote.field})`;
    copy(textToCopy);
  }, [activeQuote, copy]);

  // 切换静音
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // 如果是解开静音，尝试轻快播放一声试音
    if (isMuted) {
      setTimeout(() => {
        playKeypressAudio(false);
      }, 50);
    }
  }, [isMuted]);

  return (
    <div className="quote-typer-wrapper" aria-label="极客灵感打字机">
      <style>{`
        .quote-typer-wrapper {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 1.1rem;
        }

        .quote-terminal-card {
          width: 100%;
          border-radius: var(--radius-lg, 18px);
          background-color: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
          padding: 1.6rem 1.6rem 1.4rem;
          box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.03));
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 220px;
          justify-content: space-between;
          transition: var(--transition-normal, all 0.3s cubic-bezier(0.16, 1, 0.3, 1));
        }

        .quote-terminal-card:hover {
          border-color: var(--border-hover, rgba(0, 0, 0, 0.15));
          box-shadow: var(--shadow-card-hover, 0 12px 30px rgba(0, 0, 0, 0.07));
        }

        /* 终端窗口顶栏装饰 */
        .quote-terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
        }

        .quote-mac-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .quote-mac-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .quote-mac-dot-red { background-color: #ff5f56; }
        .quote-mac-dot-yellow { background-color: #ffbd2e; }
        .quote-mac-dot-green { background-color: #27c93f; }

        .quote-index-badge {
          font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
          font-size: 0.76rem;
          color: var(--text-tertiary, #a1a1a6);
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .quote-sound-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: ${isMuted ? 'var(--text-tertiary)' : '#10b981'};
          box-shadow: ${isMuted ? 'none' : '0 0 6px #10b981'};
        }

        /* 正文与打字机输出 */
        .quote-body-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin: 0.5rem 0 1.25rem;
        }

        .quote-text-quote {
          font-size: 1.22rem;
          line-height: 1.6;
          font-weight: 600;
          color: var(--text-primary, #1d1d1f);
          font-family: var(--font-sans);
          letter-spacing: -0.015em;
          position: relative;
          min-height: 3.8rem;
        }

        .quote-cursor {
          display: inline-block;
          width: 2px;
          height: 1.15em;
          vertical-align: text-bottom;
          background-color: var(--accent-color, #0071e3);
          margin-left: 3px;
          animation: quoteCursorBlink 0.9s infinite cubic-bezier(1, 0, 0, 1);
        }

        @keyframes quoteCursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* 作者与领域属性 */
        .quote-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          opacity: ${isTyping ? 0.45 : 1};
          transition: opacity 0.3s ease;
        }

        .quote-author-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quote-author-name {
          font-size: 0.94rem;
          font-weight: 700;
          color: var(--text-primary, #1d1d1f);
        }

        .quote-field-pill {
          font-size: 0.74rem;
          font-weight: 500;
          padding: 0.18rem 0.55rem;
          border-radius: var(--radius-pill, 9999px);
          background-color: var(--bg-surface-secondary, #f0f0f2);
          color: var(--text-secondary, #86868b);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.05));
        }

        /* 控制药丸工具栏 */
        .quote-toolbar {
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

        .quote-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.46rem 1.15rem;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.85rem;
          font-weight: 600;
          background: linear-gradient(180deg, var(--accent-color, #0071e3) 0%, #005bb5 100%);
          color: #ffffff;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 113, 227, 0.28);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .quote-btn-primary:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .quote-btn-primary:active {
          transform: scale(0.97);
        }

        .quote-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.9rem;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary, #86868b);
          background: transparent;
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quote-btn-secondary:hover {
          color: var(--text-primary, #1d1d1f);
          border-color: var(--border-hover, rgba(0, 0, 0, 0.15));
          background-color: var(--bg-hover, rgba(0, 0, 0, 0.03));
        }

        .quote-btn-secondary.is-copied {
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.35);
          background-color: rgba(16, 185, 129, 0.08);
        }

        .quote-tools-right {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .quote-instruction-hint {
          font-size: 0.78rem;
          color: var(--text-tertiary, #a1a1a6);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding-left: 0.4rem;
        }
      `}</style>

      {/* 拟物终端主卡片 */}
      <div className="quote-terminal-card">
        <div className="quote-terminal-header">
          <div className="quote-mac-dots" aria-hidden="true">
            <span className="quote-mac-dot quote-mac-dot-red" />
            <span className="quote-mac-dot quote-mac-dot-yellow" />
            <span className="quote-mac-dot quote-mac-dot-green" />
          </div>

          <div className="quote-index-badge">
            <span className="quote-sound-indicator" />
            <span>INSPIRATION // [{String(currentIndex + 1).padStart(2, '0')} / {String(quoteList.length).padStart(2, '0')}]</span>
          </div>
        </div>

        {/* 打字机动画核心文本 */}
        <div className="quote-body-area">
          <div className="quote-text-quote">
            “{displayedText}”
            <span className="quote-cursor" aria-hidden="true" />
          </div>
        </div>

        {/* 名言作者与领域 */}
        <div className="quote-meta-row">
          <div className="quote-author-group">
            <span className="quote-author-name">—— {activeQuote.author}</span>
            {activeQuote.field && (
              <span className="quote-field-pill">{activeQuote.field}</span>
            )}
          </div>
        </div>
      </div>

      {/* 控制药丸工具条 */}
      <div className="quote-toolbar">
        <button
          type="button"
          className="quote-btn-primary"
          onClick={handleNextQuote}
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
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          <span>抽取下一句 (Next)</span>
        </button>

        <div className="quote-tools-right">
          {/* 静音开关 */}
          <button
            type="button"
            className="quote-btn-secondary"
            onClick={toggleMute}
            title={isMuted ? '点击恢复声音' : '点击切换静音'}
          >
            {isMuted ? (
              <>
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
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <span>已静音</span>
              </>
            ) : (
              <>
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
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>原生音效</span>
              </>
            )}
          </button>

          {/* 复制名言 */}
          <button
            type="button"
            className={`quote-btn-secondary ${copied ? 'is-copied' : ''}`}
            onClick={handleCopyQuote}
            title="一键复制当前名言全文"
          >
            {copied ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>已复制 ✓</span>
              </>
            ) : (
              <>
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>复制名言</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="quote-instruction-hint">
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
        声音采用 Web Audio 物理频率算法实时合成，无需加载任何音频文件；落定时合成 C maj9 颂钵和弦
      </p>
    </div>
  );
}

export default QuoteTyper;
