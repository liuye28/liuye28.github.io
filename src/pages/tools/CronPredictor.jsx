import React, { useState, useMemo, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

// 常用高频预设
const PRESETS = [
  { label: '每 5 秒', cron: '*/5 * * * * ?', desc: '用于高频心跳或轮询' },
  { label: '每 1 分钟', cron: '0 * * * * ?', desc: '每分钟 00 秒触发' },
  { label: '每 5 分钟', cron: '0 0/5 * * * ?', desc: 'Spring Boot 常用定时任务' },
  { label: '每 30 分钟', cron: '0 0/30 * * * ?', desc: '半小时统计一次' },
  { label: '每小时整点', cron: '0 0 * * * ?', desc: '每小时 00 分 00 秒' },
  { label: '每天凌晨 02:00', cron: '0 0 2 * * ?', desc: '日常数据备份与离线汇总' },
  { label: '工作日早 09:00', cron: '0 0 9 ? * MON-FRI', desc: '周一至周五上班提醒/打卡' },
  { label: '每周一早 08:30', cron: '0 30 8 ? * MON', desc: '每周例会任务' },
  { label: '每月 1 号零点', cron: '0 0 0 1 * ?', desc: '月度账单结算与重置' },
];

const WEEK_MAP = {
  '1': '周日', 'SUN': '周日',
  '2': '周一', 'MON': '周一',
  '3': '周二', 'TUE': '周二',
  '4': '周三', 'WED': '周三',
  '5': '周四', 'THU': '周四',
  '6': '周五', 'FRI': '周五',
  '7': '周六', 'SAT': '周六'
};

const WEEK_LIST = [
  { val: 'MON', label: '周一 (MON)' },
  { val: 'TUE', label: '周二 (TUE)' },
  { val: 'WED', label: '周三 (WED)' },
  { val: 'THU', label: '周四 (THU)' },
  { val: 'FRI', label: '周五 (FRI)' },
  { val: 'SAT', label: '周六 (SAT)' },
  { val: 'SUN', label: '周日 (SUN)' },
];

/**
 * 格式化补零
 */
function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss
 */
function formatDateTime(d) {
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const date = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayName = dayNames[d.getDay()];
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds} (${dayName})`;
}

/**
 * 计算相对当前时间的友善描述
 */
function getRelativeTime(targetDate, now) {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs < 0) return '已过期';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec} 秒后`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分钟后 (${diffSec % 60}秒)`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时 ${diffMin % 60} 分钟后`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天后`;
}

/**
 * 解析 Cron 单个字段为匹配数字集合
 */
function parseField(expr, min, max, isWeek = false) {
  const set = new Set();
  if (!expr || expr === '*' || expr === '?') {
    for (let i = min; i <= max; i++) set.add(i);
    return set;
  }

  // 星期英文字符转换
  let cleanExpr = expr.toUpperCase();
  if (isWeek) {
    const weekAliases = { 'SUN': '1', 'MON': '2', 'TUE': '3', 'WED': '4', 'THU': '5', 'FRI': '6', 'SAT': '7' };
    for (const [k, v] of Object.entries(weekAliases)) {
      cleanExpr = cleanExpr.replace(new RegExp(k, 'g'), v);
    }
  }

  const parts = cleanExpr.split(',');
  for (const part of parts) {
    if (part.includes('/')) {
      // 步长：start/step 或 */step
      const [startStr, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) continue;
      const start = startStr === '*' ? min : parseInt(startStr, 10);
      if (isNaN(start)) continue;
      for (let i = start; i <= max; i += step) {
        if (i >= min && i <= max) set.add(i);
      }
    } else if (part.includes('-')) {
      // 区间：start-end
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) continue;
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) set.add(i);
      }
    } else {
      // 单个数字
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= min && num <= max) {
        set.add(num);
      }
    }
  }

  return set;
}

/**
 * 纯前端推算未来 N 次执行时间
 */
function calculateNextRuns(cronString, count = 10) {
  const parts = cronString.trim().split(/\s+/);
  let secExpr, minExpr, hourExpr, dayExpr, monthExpr, weekExpr;

  if (parts.length === 5) {
    // Linux crontab: 分 时 日 月 周
    secExpr = '0';
    [minExpr, hourExpr, dayExpr, monthExpr, weekExpr] = parts;
  } else if (parts.length >= 6) {
    // Spring / Quartz: 秒 分 时 日 月 周 [年]
    [secExpr, minExpr, hourExpr, dayExpr, monthExpr, weekExpr] = parts;
  } else {
    throw new Error('Cron 表达式格式不完整（需 5~6 段）');
  }

  const secSet = parseField(secExpr, 0, 59);
  const minSet = parseField(minExpr, 0, 59);
  const hourSet = parseField(hourExpr, 0, 23);
  const monthSet = parseField(monthExpr, 1, 12);

  const results = [];
  const start = new Date();
  // 从下一秒开始推算
  const current = new Date(start.getTime() + 1000);
  current.setMilliseconds(0);

  // 保护性最大循环步数，防止死循环
  let iterations = 0;
  const maxIterations = 500000;

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    // 检查月份
    const month = current.getMonth() + 1;
    if (!monthSet.has(month)) {
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    // 检查日期与星期
    const day = current.getDate();
    const week = current.getDay() + 1; // 1=Sun, 2=Mon... 7=Sat

    const isDayWild = dayExpr === '*' || dayExpr === '?';
    const isWeekWild = weekExpr === '*' || weekExpr === '?';

    let dayMatch = false;
    if (isDayWild && isWeekWild) {
      dayMatch = true;
    } else if (!isDayWild && isWeekWild) {
      const daySet = parseField(dayExpr, 1, 31);
      dayMatch = daySet.has(day);
    } else if (isDayWild && !isWeekWild) {
      const weekSet = parseField(weekExpr, 1, 7, true);
      dayMatch = weekSet.has(week);
    } else {
      // 两者都指定，通常满足其一
      const daySet = parseField(dayExpr, 1, 31);
      const weekSet = parseField(weekExpr, 1, 7, true);
      dayMatch = daySet.has(day) || weekSet.has(week);
    }

    if (!dayMatch) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    // 检查小时
    const hour = current.getHours();
    if (!hourSet.has(hour)) {
      current.setHours(current.getHours() + 1);
      current.setMinutes(0, 0, 0);
      continue;
    }

    // 检查分钟
    const min = current.getMinutes();
    if (!minSet.has(min)) {
      current.setMinutes(current.getMinutes() + 1);
      current.setSeconds(0, 0);
      continue;
    }

    // 检查秒
    const sec = current.getSeconds();
    if (!secSet.has(sec)) {
      current.setSeconds(current.getSeconds() + 1);
      continue;
    }

    // 命中一个执行时间点
    results.push(new Date(current.getTime()));
    current.setSeconds(current.getSeconds() + 1);
  }

  return results;
}

/**
 * 翻译 Cron 表达式为中文自然语言
 */
function translateCronToChinese(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return '表达式格式不完整';

  let sec, min, hour, day, month, week;
  if (parts.length === 5) {
    sec = '0';
    [min, hour, day, month, week] = parts;
  } else {
    [sec, min, hour, day, month, week] = parts;
  }

  const descParts = [];

  // 1. 月份
  if (month !== '*' && month !== '?') {
    descParts.push(`每年 ${month} 月`);
  }

  // 2. 日期与星期
  if (day !== '*' && day !== '?') {
    descParts.push(`每月 ${day} 号`);
  } else if (week !== '*' && week !== '?') {
    const weekNames = week.split(',').map(w => WEEK_MAP[w.toUpperCase()] || w).join('、');
    descParts.push(`每周 ${weekNames}`);
  } else {
    descParts.push('每天');
  }

  // 3. 时间与频率
  if (sec.startsWith('*/')) {
    const step = sec.replace('*/', '');
    descParts.push(`每隔 ${step} 秒`);
  } else if (min.startsWith('*/') || min.includes('/')) {
    const step = min.includes('/') ? min.split('/')[1] : min.replace('*/', '');
    descParts.push(`每隔 ${step} 分钟`);
  } else {
    const h = hour === '*' ? '每小时' : `${pad(hour)}点`;
    const m = min === '*' ? '每分' : `${pad(min)}分`;
    const s = sec === '*' ? '每秒' : `${pad(sec)}秒`;
    descParts.push(`在 ${h}${m}${s}`);
  }

  return `${descParts.join(' ')} 触发`;
}

/**
 * Cron 表达式生成与执行预测器
 */
export default function CronPredictor() {
  const [cronInput, setCronInput] = useState('0 0/5 * * * ?');
  const [activeTab, setActiveTab] = useState('sec');
  const [copied, setCopied] = useState(false);
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
    navigator.clipboard.writeText(cronInput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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
