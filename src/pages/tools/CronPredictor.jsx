import React, { useState, useMemo, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import {
  PRESETS,
  WEEK_LIST,
  formatDateTime,
  getRelativeTime,
  calculateNextRuns,
  translateCronToChinese
} from '../../utils/cronParser.js';
import './ToolsCommon.css';

/**
 * Cron 表达式生成与执行预测器
 */
export default function CronPredictor() {
  const [cronInput, setCronInput] = useState('0 0/5 * * * ?');
  const [copied, copy] = useCopyToClipboard();
  const [activeTab, setActiveTab] = useState('sec');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 每秒更新当前时间，保证相对时间跳动
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 字段可视化状态
  const [secType, setSecType] = useState('every'); // every, step, specific
  const [secStepStart, setSecStepStart] = useState(0);
  const [secStepInterval, setSecStepInterval] = useState(5);

  const [minType, setMinType] = useState('step');
  const [minStepStart, setMinStepStart] = useState(0);
  const [minStepInterval, setMinStepInterval] = useState(5);

  const [hourType, setHourType] = useState('every');
  const [hourSpecific, setHourSpecific] = useState(2);

  const [dayType, setDayType] = useState('wild'); // wild (?), specific
  const [daySpecific, setDaySpecific] = useState(1);

  const [monthType, setMonthType] = useState('every');

  const [weekType, setWeekType] = useState('wild'); // wild (?), specific
  const [weekSpecific, setWeekSpecific] = useState('MON');

  // 当在可视化面板调整时，重新拼装表达式
  const handleApplyVisual = () => {
    let s = '*';
    if (secType === 'every') s = '*';
    else if (secType === 'step') s = `${secStepStart}/${secStepInterval}`;
    else if (secType === 'zero') s = '0';

    let m = '*';
    if (minType === 'every') m = '*';
    else if (minType === 'step') m = `${minStepStart}/${minStepInterval}`;
    else if (minType === 'zero') m = '0';

    let h = '*';
    if (hourType === 'every') h = '*';
    else if (hourType === 'specific') h = `${hourSpecific}`;

    let d = '*';
    let w = '?';
    if (dayType === 'specific') {
      d = `${daySpecific}`;
      w = '?';
    } else if (weekType === 'specific') {
      d = '?';
      w = weekSpecific;
    } else {
      d = '*';
      w = '?';
    }

    const newCron = `${s} ${m} ${h} ${d} * ${w}`;
    setCronInput(newCron);
  };

  // 预测推算与中文释义
  const { runs, explanation, error } = useMemo(() => {
    if (!cronInput.trim()) {
      return { runs: [], explanation: '', error: '请输入 Cron 表达式' };
    }
    try {
      const nextRuns = calculateNextRuns(cronInput, 10);
      const desc = translateCronToChinese(cronInput);
      return { runs: nextRuns, explanation: desc, error: null };
    } catch (err) {
      return { runs: [], explanation: '', error: err.message || 'Cron 表达式格式无效' };
    }
  }, [cronInput]);

  const handleCopy = () => {
    if (!cronInput) return;
    copy(cronInput);
  };

  return (
    <ToolLayout
      title="Cron 表达式生成与执行预测器"
      desc="支持 6 段 Spring / Quartz 与 5 段 Linux Cron 表达式，提供中文自然语言翻译及未来 10 次执行时间推算"
    >
      {/* 顶部常用预设胶囊 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <span>常用高频场景一键预设</span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button
              key={p.cron}
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => setCronInput(p.cron)}
              title={`${p.desc} (${p.cron})`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* 核心表达式输入与中文释义看板 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <span>Cron 表达式与语义解析</span>
          <button
            type="button"
            className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ 已复制表达式' : '复制表达式'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              className="apple-input"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '1.25rem',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
              value={cronInput}
              onChange={(e) => setCronInput(e.target.value)}
              placeholder="例如 0 0/5 * * * ?"
            />
          </div>
        </div>

        {/* 中文语义条 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            backgroundColor: error ? 'rgba(255, 69, 58, 0.1)' : 'var(--accent-light)',
            border: `1px solid ${error ? 'rgba(255, 69, 58, 0.3)' : 'var(--border-focus)'}`,
            borderRadius: 'var(--radius-sm)',
            color: error ? '#ff453a' : 'var(--accent-color)',
            fontSize: '0.95rem',
            fontWeight: 500
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{error ? '⚠️' : '💡'}</span>
          <span>
            {error ? `解析错误: ${error}` : `中文释义: ${explanation}`}
          </span>
        </div>
      </section>

      {/* 双栏：左侧可视化配置，右侧未来 10 次执行时间 */}
      <div className="tool-grid-2col">
        {/* 左侧：可视化调节面板 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>可视化生成向导</span>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={handleApplyVisual}
            >
              应用配置到上方
            </button>
          </div>

          {/* 字段切换 Tab */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            {[
              { id: 'sec', name: '秒' },
              { id: 'min', name: '分' },
              { id: 'hour', name: '时' },
              { id: 'day', name: '日' },
              { id: 'week', name: '周' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`apple-btn apple-btn-sm ${activeTab === t.id ? 'apple-btn-secondary' : 'apple-btn-ghost'}`}
                style={{ fontWeight: activeTab === t.id ? 600 : 400 }}
                onClick={() => setActiveTab(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* 秒配置 */}
          {activeTab === 'sec' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="sec" checked={secType === 'every'} onChange={() => setSecType('every')} />
                <span>每秒允许触发 (*)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="sec" checked={secType === 'zero'} onChange={() => setSecType('zero')} />
                <span>仅在第 0 秒整点触发 (0)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="sec" checked={secType === 'step'} onChange={() => setSecType('step')} />
                <span>从第</span>
                <input type="number" min="0" max="59" value={secStepStart} onChange={(e) => setSecStepStart(Number(e.target.value))} style={{ width: '60px', padding: '2px 6px' }} />
                <span>秒开始，每隔</span>
                <input type="number" min="1" max="59" value={secStepInterval} onChange={(e) => setSecStepInterval(Number(e.target.value))} style={{ width: '60px', padding: '2px 6px' }} />
                <span>秒执行一次</span>
              </label>
            </div>
          )}

          {/* 分配置 */}
          {activeTab === 'min' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="min" checked={minType === 'every'} onChange={() => setMinType('every')} />
                <span>每分钟允许触发 (*)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="min" checked={minType === 'zero'} onChange={() => setMinType('zero')} />
                <span>仅在第 0 分整点触发 (0)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="min" checked={minType === 'step'} onChange={() => setMinType('step')} />
                <span>从第</span>
                <input type="number" min="0" max="59" value={minStepStart} onChange={(e) => setMinStepStart(Number(e.target.value))} style={{ width: '60px', padding: '2px 6px' }} />
                <span>分开始，每隔</span>
                <input type="number" min="1" max="59" value={minStepInterval} onChange={(e) => setMinStepInterval(Number(e.target.value))} style={{ width: '60px', padding: '2px 6px' }} />
                <span>分钟执行一次</span>
              </label>
            </div>
          )}

          {/* 时配置 */}
          {activeTab === 'hour' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="hour" checked={hourType === 'every'} onChange={() => setHourType('every')} />
                <span>每小时允许触发 (*)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="hour" checked={hourType === 'specific'} onChange={() => setHourType('specific')} />
                <span>指定每天具体小时：</span>
                <input type="number" min="0" max="23" value={hourSpecific} onChange={(e) => setHourSpecific(Number(e.target.value))} style={{ width: '60px', padding: '2px 6px' }} />
                <span>点 (0~23)</span>
              </label>
            </div>
          )}

          {/* 日配置 */}
          {activeTab === 'day' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="day" checked={dayType === 'wild'} onChange={() => { setDayType('wild'); setWeekType('wild'); }} />
                <span>不指定具体日 / 每天触发 (*)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="day" checked={dayType === 'specific'} onChange={() => { setDayType('specific'); setWeekType('wild'); }} />
                <span>指定每月具体日期：</span>
                <input type="number" min="1" max="31" value={daySpecific} onChange={(e) => setDaySpecific(Number(e.target.value))} style={{ width: '60px', padding: '2px 6px' }} />
                <span>号</span>
              </label>
            </div>
          )}

          {/* 周配置 */}
          {activeTab === 'week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="week" checked={weekType === 'wild'} onChange={() => setWeekType('wild')} />
                <span>不限星期 (?)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" name="week" checked={weekType === 'specific'} onChange={() => { setWeekType('specific'); setDayType('wild'); }} />
                <span>指定星期：</span>
                <select value={weekSpecific} onChange={(e) => setWeekSpecific(e.target.value)} style={{ padding: '3px 8px', borderRadius: '4px' }}>
                  {WEEK_LIST.map(w => (
                    <option key={w.val} value={w.val}>{w.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </section>

        {/* 右侧：未来 10 次执行时间列表 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>未来 10 次计划执行时间模拟</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              基准时间: {formatDateTime(currentTime).split(' ')[1]}
            </span>
          </div>

          {runs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {runs.map((dateObj, idx) => (
                <div
                  key={idx}
                  className="tool-result-item"
                  style={{ padding: '0.6rem 0.8rem' }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: idx === 0 ? 'var(--accent-color)' : 'var(--bg-hover)',
                    color: idx === 0 ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginRight: '0.5rem'
                  }}>
                    {idx + 1}
                  </span>
                  <span className="tool-result-value" style={{ fontSize: '0.85rem' }}>
                    {formatDateTime(dateObj)}
                  </span>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {getRelativeTime(dateObj, currentTime)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              {error ? '表达式有误，无法计算执行时间' : '计算中...'}
            </div>
          )}
        </section>
      </div>
    </ToolLayout>
  );
}
