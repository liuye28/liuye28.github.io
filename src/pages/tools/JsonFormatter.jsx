import React, { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

const SAMPLE_JSON = `{
  "name": "Ly's Navigation",
  "version": "1.0.0",
  "features": [
    "Vite + React",
    "Apple Design System",
    "Developer Tools"
  ],
  "author": {
    "name": "Ly",
    "github": "https://github.com"
  },
  "isActive": true,
  "stats": {
    "views": 1024,
    "rating": 4.99
  }
}`;

/**
 * JSON 格式化与校验器
 */
export default function JsonFormatter() {
  const [inputJson, setInputJson] = useState('');
  const [formattedJson, setFormattedJson] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!inputJson.trim()) {
      setFormattedJson('');
      setErrorMsg('');
      setStats(null);
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedJson(formatted);
      setErrorMsg('');

      // 计算基础统计信息
      const byteLength = new Blob([formatted]).size;
      setStats({
        type: Array.isArray(parsed) ? `数组 (${parsed.length} 项)` : typeof parsed === 'object' ? `对象 (${Object.keys(parsed || {}).length} 个键)` : typeof parsed,
        size: byteLength > 1024 ? `${(byteLength / 1024).toFixed(2)} KB` : `${byteLength} Bytes`,
        lines: formatted.split('\n').length
      });
    } catch (err) {
      setFormattedJson('');
      setStats(null);

      // 解析行号提示
      let lineInfo = '';
      const match = err.message.match(/at position (\d+)/i) || err.message.match(/line (\d+) column (\d+)/i);
      if (match) {
        lineInfo = ` (位置: ${match[0]})`;
      }
      setErrorMsg(`${err.message}${lineInfo}`);
    }
  }, [inputJson]);

  const handleCopy = () => {
    if (!formattedJson) return;
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleMinify = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setInputJson(minified);
    } catch (err) {
      setErrorMsg(`压缩失败: ${err.message}`);
    }
  };

  const handleClear = () => {
    setInputJson('');
    setFormattedJson('');
    setErrorMsg('');
    setStats(null);
  };

  const handleLoadSample = () => {
    setInputJson(SAMPLE_JSON);
  };

  return (
    <ToolLayout
      title="JSON 格式化 / 校验器"
      desc="实时验证 JSON 语法正确性，提供 2 空格美化、紧凑压缩与一键复制"
    >
      <div className="tool-section">
        <div className="tool-section-title">
          <span>JSON 编辑与预览</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={handleLoadSample}
            >
              加载示例
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={handleMinify}
              disabled={!formattedJson}
            >
              压缩 (Minify)
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={handleClear}
              disabled={!inputJson}
            >
              清空
            </button>
            <button
              type="button"
              className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
              onClick={handleCopy}
              disabled={!formattedJson}
            >
              {copied ? '✓ 已复制' : '复制结果'}
            </button>
          </div>
        </div>

        <div className="tool-grid-2col">
          {/* 左侧：输入框 */}
          <div className="tool-form-group">
            <label className="tool-form-label" htmlFor="json-input-area">
              输入 / 粘贴原始 JSON 文本
            </label>
            <textarea
              id="json-input-area"
              className="apple-textarea"
              placeholder="在此粘贴或输入 JSON 数据..."
              rows={14}
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              spellCheck="false"
            />
          </div>

          {/* 右侧：格式化结果 */}
          <div className="tool-form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <span className="tool-form-label" style={{ marginBottom: 0 }}>
                格式化输出 (2 空格缩进)
              </span>
              {stats && (
                <span className="apple-pill-badge">
                  {stats.type} • {stats.lines} 行 • {stats.size}
                </span>
              )}
            </div>
            <textarea
              className="apple-textarea"
              placeholder="格式化后的 JSON 将实时展示在此处..."
              rows={14}
              value={formattedJson}
              readOnly
              spellCheck="false"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: formattedJson ? 'var(--border-hover)' : 'var(--border-subtle)'
              }}
            />
          </div>
        </div>

        {/* 错误提示横幅 */}
        {errorMsg && (
          <div className="apple-error-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>JSON 解析错误：</strong> {errorMsg}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
