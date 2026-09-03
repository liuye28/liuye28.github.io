import React, { useState, useEffect, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

/**
 * 极简白噪音专注番茄钟组件 (基于 HTML5 Web Audio 原生合成音效)
 */
export default function ZenFocus() {
  const [mode, setMode] = useState('focus'); // focus (25m), shortBreak (5m), longBreak (15m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundType, setSoundType] = useState('none'); // none, rain, white, brown
  const [volume, setVolume] = useState(0.5);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Web Audio 上下文引用
  const audioCtxRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const gainNodeRef = useRef(null);

  // 模式时长映射
  const modeDuration = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // 切换模式
  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modeDuration[newMode]);
    setIsRunning(false);
  };

  // 倒计时核心计时器
  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'focus') {
        setCompletedSessions((c) => c + 1);
        alert('🎉 专注周期已达成！休息一下吧。');
        switchMode('shortBreak');
      } else {
        alert('☕ 休息结束，准备好迎接下一轮专注了吗？');
        switchMode('focus');
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  // Web Audio 原生白噪音/雨声合成器
  useEffect(() => {
    if (soundType === 'none') {
      if (noiseSourceRef.current) {
        try { noiseSourceRef.current.stop(); } catch {}
        noiseSourceRef.current = null;
      }
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 生成 2 秒循环白噪缓冲区
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      if (soundType === 'white') {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.4;
        }
      } else if (soundType === 'brown' || soundType === 'rain') {
        // 积分褐噪 / 雨声模拟
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 2.5; // 补偿增益
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      // 滤波器塑形
      const filter = ctx.createBiquadFilter();
      if (soundType === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 850; // 低通产生柔和细雨感
      } else if (soundType === 'brown') {
        filter.type = 'lowpass';
        filter.frequency.value = 400; // 深度沉浸低频
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 3000;
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = volume * 0.3;
      gainNodeRef.current = gainNode;

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start();
      noiseSourceRef.current = whiteNoise;

      return () => {
        try { whiteNoise.stop(); } catch {}
      };
    } catch {
      // 容错浏览器环境不支持
    }
  }, [soundType]);

  // 音量动态调节
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume * 0.3;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!isRunning && soundType === 'none') {
      setSoundType('rain'); // 首次开始默认伴奏雨声
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(modeDuration[mode]);
  };

  // 格式化 mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

  const totalTime = modeDuration[mode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <ToolLayout
      title="极简白噪音专注番茄钟"
      desc="基于 Apple 极简美学设计，结合 Web Audio 原生算法模拟雨声与白噪音，提供沉浸式高效专注"
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* 模式切换胶囊 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          padding: '4px',
          backgroundColor: 'var(--bg-surface-secondary)',
          borderRadius: 'var(--radius-pill)',
          marginBottom: '2rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className={`apple-btn apple-btn-sm ${mode === 'focus' ? 'apple-btn-primary' : 'apple-btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-pill)', padding: '5px 18px' }}
            onClick={() => switchMode('focus')}
          >
            专注 (25m)
          </button>
          <button
            type="button"
            className={`apple-btn apple-btn-sm ${mode === 'shortBreak' ? 'apple-btn-primary' : 'apple-btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-pill)', padding: '5px 18px' }}
            onClick={() => switchMode('shortBreak')}
          >
            短休息 (5m)
          </button>
          <button
            type="button"
            className={`apple-btn apple-btn-sm ${mode === 'longBreak' ? 'apple-btn-primary' : 'apple-btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-pill)', padding: '5px 18px' }}
            onClick={() => switchMode('longBreak')}
          >
            长休息 (15m)
          </button>
        </div>

        {/* 核心倒计时环形钟面卡片 */}
        <section className="tool-section" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{
            fontSize: '5.5rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1,
            marginBottom: '1rem',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {pad(minutes)}:{pad(seconds)}
          </div>

          {/* 细进度条 */}
          <div style={{
            width: '240px',
            height: '6px',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-pill)',
            margin: '0 auto 2.5rem auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'var(--accent-color)',
              transition: 'width 0.5s ease'
            }} />
          </div>

          {/* 核心动作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="apple-btn apple-btn-primary"
              style={{ padding: '0.75rem 2.5rem', fontSize: '1.05rem', borderRadius: 'var(--radius-pill)' }}
              onClick={togglePlay}
            >
              {isRunning ? '暂停' : '开始专注'}
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary"
              style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)' }}
              onClick={handleReset}
            >
              重置
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            今日已完成专注周期：<strong style={{ color: 'var(--accent-color)' }}>{completedSessions}</strong> 次
          </div>
        </section>

        {/* 白噪音背景音调控面板 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>沉浸环境音 (Web Audio 原生合成)</span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {[
              { id: 'none', label: '🔇 无声静音' },
              { id: 'rain', label: '🌧️ 沉浸细雨' },
              { id: 'brown', label: '🌊 深度褐噪' },
              { id: 'white', label: '📻 纯白噪音' },
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                className={`apple-btn apple-btn-sm ${soundType === snd.id ? 'apple-btn-primary' : 'apple-btn-secondary'}`}
                onClick={() => setSoundType(snd.id)}
              >
                {snd.label}
              </button>
            ))}
          </div>

          {soundType !== 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>音量：</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', width: '35px' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </section>
      </div>
    </ToolLayout>
  );
}
