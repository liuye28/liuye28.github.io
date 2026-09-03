import React, { useState, useMemo, useRef, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';

/**
 * 常用正则快捷预设
 */
const PRESETS = [
  { name: '邮箱地址', pattern: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { name: '中国手机号', pattern: '1[3-9]\\d{9}', flags: 'g' },
  { name: 'URL 网址', pattern: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=]+', flags: 'g' },
  { name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', flags: 'g' },
  { name: 'IPv4 地址', pattern: '(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)(?:\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)){3}', flags: 'g' }
];

const DEFAULT_TEXT = `欢迎使用 Ly 开发者工具箱！
联系邮箱：test-user@apple.com 或者 admin@example.org
官方网站：https://github.com
客服热线：13812345678, 备用电话: 18688889999
IPv4 服务器地址：192.168.1.1 和 10.0.0.254`;

/**
 * 正则表达式测试器页面
 */
export default function RegexTester() {
  const [pattern, setPattern] = useState('[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState({
    g: true,
    i: false,
    m: true,
    s: false
  });
  const [text, setText] = useState(DEFAULT_TEXT);
  const [copiedIndex, copyMatch] = useCopyToClipboard();
  const patternInputRef = useRef(null);

  // 快捷键支持：全局 ⌘K / Ctrl+K 聚焦到正则模式输入框
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (patternInputRef.current) {
          patternInputRef.current.focus();
          patternInputRef.current.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 拼接 flags 字符串
  const flagStr = useMemo(() => {
    let s = '';
    if (flags.g) s += 'g';
    if (flags.i) s += 'i';
    if (flags.m) s += 'm';
    if (flags.s) s += 's';
    return s;
  }, [flags]);

  // 构建 RegExp 对象与计算匹配
  const { matches, error, highlightedNodes } = useMemo(() => {
    if (!pattern.trim() || !text) {
      return { matches: [], error: null, highlightedNodes: text };
    }

    try {
      // 必须带 g 标志以保证 matchAll 正常执行
      const effectiveFlags = flagStr.includes('g') ? flagStr : flagStr + 'g';
      const regex = new RegExp(pattern, effectiveFlags);
      const allMatches = [];

      let match;
      let lastIndex = 0;
      const nodes = [];

      // 防死循环保护
      let count = 0;
      const maxMatches = 1000;

      while ((match = regex.exec(text)) !== null && count < maxMatches) {
        count++;
        const matchIndex = match.index;
        const matchText = match[0];

        // 避免零宽匹配导致的无限循环
        if (matchText.length === 0) {
          regex.lastIndex++;
          continue;
        }

        // 添加匹配前的普通文本
        if (matchIndex > lastIndex) {
          nodes.push(text.substring(lastIndex, matchIndex));
        }

        // 添加高亮匹配片段
        nodes.push(
          <mark
            key={`mark-${matchIndex}-${count}`}
            style={{
              backgroundColor: 'rgba(255, 214, 10, 0.35)',
              color: 'inherit',
              borderRadius: '3px',
              padding: '1px 3px',
              border: '1px solid rgba(255, 214, 10, 0.6)'
            }}
          >
            {matchText}
          </mark>
        );

        allMatches.push({
          index: matchIndex,
          endIndex: matchIndex + matchText.length,
          text: matchText,
          groups: match.slice(1)
        });

        lastIndex = matchIndex + matchText.length;

        // 如果用户没选 g，只匹配一次
        if (!flags.g) break;
      }

      // 添加尾部剩余文本
      if (lastIndex < text.length) {
        nodes.push(text.substring(lastIndex));
      }

      return {
        matches: allMatches,
        error: null,
        highlightedNodes: nodes
      };
    } catch (err) {
      return {
        matches: [],
        error: err.message,
        highlightedNodes: text
      };
    }
  }, [pattern, flagStr, text, flags.g]);

  const toggleFlag = (flagKey) => {
    setFlags((prev) => ({ ...prev, [flagKey]: !prev[flagKey] }));
  };

  const applyPreset = (preset) => {
    setPattern(preset.pattern);
    setFlags({
      g: preset.flags.includes('g'),
      i: preset.flags.includes('i'),
      m: preset.flags.includes('m'),
      s: preset.flags.includes('s')
    });
  };

  return (
    <ToolLayout
      title="正则表达式测试器"
      desc="实时测试与调试正则表达式，支持 Flags 修饰符、可视化背景高亮及详细匹配索引"
    >
      {/* 正则输入区域 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>正则表达式与修饰符</span>
            <span className="tool-form-hint" style={{ marginTop: 0 }}>快捷键: ⌘/Ctrl+K 聚焦</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="apple-btn apple-btn-secondary apple-btn-sm"
                onClick={() => applyPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="tool-form-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>/</span>
            <input
              ref={patternInputRef}
              type="text"
              className="apple-input"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '1rem',
                fontWeight: 600
              }}
              placeholder="输入正则表达式模式 (支持 ⌘/Ctrl+K 快捷聚焦)..."
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck="false"
            />
            <span style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>/</span>
            <span style={{ fontSize: '1rem', color: 'var(--accent-color)', fontWeight: 600, minWidth: '36px' }}>
              {flagStr || '-'}
            </span>
          </div>

          {/* Flags 勾选胶囊 */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { key: 'g', label: 'g (全局匹配 Global)' },
              { key: 'i', label: 'i (忽略大小写 Ignore Case)' },
              { key: 'm', label: 'm (多行匹配 Multiline)' },
              { key: 's', label: 's (点匹配所有 DotAll)' }
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.825rem',
                  color: flags[key] ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  backgroundColor: flags[key] ? 'var(--accent-light)' : 'var(--bg-surface-secondary)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'var(--transition-fast)'
                }}
              >
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={() => toggleFlag(key)}
                  style={{ cursor: 'pointer' }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* 正则语法错误 */}
          {error && (
            <div className="apple-error-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span><strong>正则表达式语法错误：</strong> {error}</span>
            </div>
          )}
        </div>
      </div>

      {/* 测试文本与实时高亮 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <span>测试文本与高亮预览</span>
          <span className="apple-pill-badge">
            匹配到 {matches.length} 处结果
          </span>
        </div>

        <div className="tool-grid-2col">
          {/* 测试文本输入 */}
          <div className="tool-form-group">
            <label className="tool-form-label" htmlFor="regex-test-text">
              输入待测试文本
            </label>
            <textarea
              id="regex-test-text"
              className="apple-textarea"
              rows={9}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此输入需要匹配的文本..."
              spellCheck="false"
            />
          </div>

          {/* 高亮预览区 */}
          <div className="tool-form-group">
            <label className="tool-form-label">
              匹配结果实时高亮
            </label>
            <div
              className="apple-code-view"
              style={{
                minHeight: '210px',
                height: 'auto',
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              {highlightedNodes || <span style={{ color: 'var(--text-tertiary)' }}>无内容</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 匹配详情列表 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <span>匹配结果列表 ({matches.length})</span>
        </div>

        {matches.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {pattern.trim() ? '未找到任何匹配项' : '请输入正则表达式与测试文本'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {matches.map((m, idx) => (
              <div key={idx} className="tool-result-item">
                <span className="apple-pill-badge" style={{ minWidth: '40px', justifyContent: 'center' }}>
                  #{idx + 1}
                </span>
                <span className="tool-result-value" style={{ color: 'var(--accent-color)' }}>
                  {m.text}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  位置: [{m.index} - {m.endIndex}] (长度 {m.text.length})
                </span>
                <button
                  type="button"
                  className={`apple-copy-btn ${copiedIndex === idx ? 'copied' : ''}`}
                  onClick={() => copyMatch(m.text, idx)}
                >
                  {copiedIndex === idx ? '已复制' : '复制'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
