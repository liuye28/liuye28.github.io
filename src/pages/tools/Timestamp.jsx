import React, { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss.SSS
 */
function formatDateTime(date) {
  if (isNaN(date.getTime())) return null;
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}.${ms}`;
}

/**
 * 格式化为莫斯科时间 (MSK, UTC+3，Ozon 跨境电商平台标准时区)
 */
function formatMoscowTime(date) {
  if (isNaN(date.getTime())) return null;
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return formatter.format(date).replace(/\//g, '-');
  } catch {
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
    const mskDate = new Date(utcMs + 3 * 3600000);
    return formatDateTime(mskDate);
  }
}

/**
 * 计算相对友好时间（如刚刚、5分钟前）
 */
function getRelativeTime(date) {
  if (isNaN(date.getTime())) return null;
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);
  const isPast = diffSec >= 0;
  const absSec = Math.abs(diffSec);

  if (absSec < 10) return '刚刚';
  if (absSec < 60) return isPast ? `${absSec} 秒前` : `${absSec} 秒后`;
  const diffMin = Math.floor(absSec / 60);
  if (diffMin < 60) return isPast ? `${diffMin} 分钟前` : `${diffMin} 分钟后`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return isPast ? `${diffHour} 小时前` : `${diffHour} 小时后`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return isPast ? `${diffDay} 天前` : `${diffDay} 天后`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return isPast ? `${diffMonth} 个月前` : `${diffMonth} 个月后`;
  const diffYear = Math.floor(diffDay / 365);
  return isPast ? `${diffYear} 年前` : `${diffYear} 年后`;
}

/**
 * 时间戳转换器页面
 */
export default function Timestamp() {
  // 当前实时时间戳
  const [currentNow, setCurrentNow] = useState(Date.now());
  const [isLive, setIsLive] = useState(true);

  // 1. 时间戳 -> 日期时间
  const [inputTs, setInputTs] = useState('');
  const [tsResult, setTsResult] = useState(null);
  const [tsError, setTsError] = useState('');

  // 2. 日期时间 -> 时间戳
  const [inputDateStr, setInputDateStr] = useState('');
  const [dateResult, setDateResult] = useState(null);
  const [dateError, setDateError] = useState('');

  // 复制状态
  const [copiedKey, setCopiedKey] = useState(null);

  // 每秒更新当前时间戳
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setCurrentNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  // 处理时间戳转换
  useEffect(() => {
    if (!inputTs.trim()) {
      setTsResult(null);
      setTsError('');
      return;
    }

    const clean = inputTs.trim();
    if (!/^-?\d+$/.test(clean)) {
      setTsError('请输入纯数字格式的时间戳');
      setTsResult(null);
      return;
    }

    const num = Number(clean);
    // 自动识别：如果小于 100000000000 (11位以下) 则按秒算，否则按毫秒
    const isSeconds = clean.length <= 10;
    const ms = isSeconds ? num * 1000 : num;
    const date = new Date(ms);

    if (isNaN(date.getTime())) {
      setTsError('时间戳超出有效范围');
      setTsResult(null);
      return;
    }

    setTsError('');
    setTsResult({
      unit: isSeconds ? '秒 (10位)' : '毫秒 (13位)',
      local: formatDateTime(date),
      msk: formatMoscowTime(date),
      utc: date.toUTCString(),
      iso: date.toISOString(),
      relative: getRelativeTime(date)
    });
  }, [inputTs]);

  // 处理日期时间转时间戳
  useEffect(() => {
    if (!inputDateStr.trim()) {
      setDateResult(null);
      setDateError('');
      return;
    }

    const date = new Date(inputDateStr.trim());
    if (isNaN(date.getTime())) {
      setDateError('日期格式无效，请使用标准格式如 2026-08-28 14:30:00');
      setDateResult(null);
      return;
    }

    setDateError('');
    const ms = date.getTime();
    setDateResult({
      seconds: Math.floor(ms / 1000),
      milliseconds: ms
    });
  }, [inputDateStr]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  const fillCurrentTimestamp = () => {
    setInputTs(String(Math.floor(Date.now() / 1000)));
  };

  const fillCurrentDate = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const str = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setInputDateStr(str);
  };

  return (
    <ToolLayout
      title="时间戳转换器"
      desc="Unix 时间戳与本地/UTC 日期时间双向快速转换，自动识别秒与毫秒"
    >
      {/* 实时时间戳状态栏 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <span>当前实时时间</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`apple-btn apple-btn-sm ${isLive ? 'apple-btn-secondary' : 'apple-btn-ghost'}`}
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? '⏸ 暂停实时' : '▶ 开启实时'}
            </button>
          </div>
        </div>

        <div className="tool-grid-2col">
          <div className="tool-result-item">
            <span className="tool-result-label">秒级 (10位)</span>
            <span className="tool-result-value">{Math.floor(currentNow / 1000)}</span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedKey === 'now-sec' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(Math.floor(currentNow / 1000), 'now-sec')}
            >
              {copiedKey === 'now-sec' ? '已复制' : '复制'}
            </button>
          </div>

          <div className="tool-result-item">
            <span className="tool-result-label">毫秒 (13位)</span>
            <span className="tool-result-value">{currentNow}</span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedKey === 'now-ms' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(currentNow, 'now-ms')}
            >
              {copiedKey === 'now-ms' ? '已复制' : '复制'}
            </button>
          </div>

          <div className="tool-result-item">
            <span className="tool-result-label">莫斯科时间 (MSK / UTC+3)</span>
            <span className="tool-result-value">{formatMoscowTime(new Date(currentNow))}</span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedKey === 'now-msk' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(formatMoscowTime(new Date(currentNow)), 'now-msk')}
            >
              {copiedKey === 'now-msk' ? '已复制' : '复制'}
            </button>
          </div>

          <div className="tool-result-item">
            <span className="tool-result-label">本地时间</span>
            <span className="tool-result-value">{formatDateTime(new Date(currentNow))}</span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedKey === 'now-local' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(formatDateTime(new Date(currentNow)), 'now-local')}
            >
              {copiedKey === 'now-local' ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </div>

      {/* 1. 时间戳 -> 日期时间 */}
      <div className="tool-section">
        <h3 className="tool-section-title">时间戳 转 日期时间</h3>
        <div className="tool-form-group">
          <label className="tool-form-label" htmlFor="input-ts">
            输入 Unix 时间戳 (支持 10 位秒或 13 位毫秒)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="input-ts"
              type="text"
              className="apple-input"
              placeholder="例如: 1787880000 或 1787880000000"
              value={inputTs}
              onChange={(e) => setInputTs(e.target.value)}
            />
            <button
              type="button"
              className="apple-btn apple-btn-secondary"
              onClick={fillCurrentTimestamp}
            >
              当前时间戳
            </button>
          </div>
          {tsError && (
            <div className="apple-error-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{tsError}</span>
            </div>
          )}
        </div>

        {tsResult && (
          <div style={{ marginTop: '1rem' }}>
            <div className="tool-result-item">
              <span className="tool-result-label">自动识别</span>
              <span className="tool-result-value">{tsResult.unit}</span>
            </div>
            <div className="tool-result-item">
              <span className="tool-result-label">本地时间</span>
              <span className="tool-result-value">{tsResult.local}</span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === 'ts-local' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(tsResult.local, 'ts-local')}
              >
                {copiedKey === 'ts-local' ? '已复制' : '复制'}
              </button>
            </div>
            <div className="tool-result-item">
              <span className="tool-result-label">莫斯科时间 (MSK / UTC+3)</span>
              <span className="tool-result-value">{tsResult.msk}</span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === 'ts-msk' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(tsResult.msk, 'ts-msk')}
              >
                {copiedKey === 'ts-msk' ? '已复制' : '复制'}
              </button>
            </div>
            <div className="tool-result-item">
              <span className="tool-result-label">相对时间</span>
              <span className="tool-result-value">{tsResult.relative}</span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === 'ts-rel' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(tsResult.relative, 'ts-rel')}
              >
                {copiedKey === 'ts-rel' ? '已复制' : '复制'}
              </button>
            </div>
            <div className="tool-result-item">
              <span className="tool-result-label">UTC 时间</span>
              <span className="tool-result-value">{tsResult.utc}</span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === 'ts-utc' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(tsResult.utc, 'ts-utc')}
              >
                {copiedKey === 'ts-utc' ? '已复制' : '复制'}
              </button>
            </div>
            <div className="tool-result-item">
              <span className="tool-result-label">ISO 格式</span>
              <span className="tool-result-value">{tsResult.iso}</span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === 'ts-iso' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(tsResult.iso, 'ts-iso')}
              >
                {copiedKey === 'ts-iso' ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. 日期时间 -> 时间戳 */}
      <div className="tool-section">
        <h3 className="tool-section-title">日期时间 转 时间戳</h3>
        <div className="tool-form-group">
          <label className="tool-form-label" htmlFor="input-date">
            输入可读日期时间
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="input-date"
              type="text"
              className="apple-input"
              placeholder="例如: 2026-08-28 14:30:00"
              value={inputDateStr}
              onChange={(e) => setInputDateStr(e.target.value)}
            />
            <button
              type="button"
              className="apple-btn apple-btn-secondary"
              onClick={fillCurrentDate}
            >
              当前时间
            </button>
          </div>
          {dateError && (
            <div className="apple-error-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{dateError}</span>
            </div>
          )}
        </div>

        {dateResult && (
          <div style={{ marginTop: '1rem' }}>
            <div className="tool-result-item">
              <span className="tool-result-label">秒 (10位)</span>
              <span className="tool-result-value">{dateResult.seconds}</span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === 'd-sec' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(dateResult.seconds, 'd-sec')}
              >
                {copiedKey === 'd-sec' ? '已复制' : '复制'}
              </button>
            </div>
            <div className="tool-result-item">
              <span className="tool-result-label">毫秒 (13位)</span>
              <span className="tool-result-value">{dateResult.milliseconds}</span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === 'd-ms' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(dateResult.milliseconds, 'd-ms')}
              >
                {copiedKey === 'd-ms' ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
