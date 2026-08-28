import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

/**
 * 校验输入在指定进制下是否合法
 */
function isValidForBase(str, base) {
  if (!str) return true;
  const clean = str.trim();
  switch (base) {
    case 2:
      return /^[01]+$/i.test(clean);
    case 8:
      return /^[0-7]+$/i.test(clean);
    case 10:
      return /^\d+$/i.test(clean);
    case 16:
      return /^[0-9a-f]+$/i.test(clean);
    default:
      return false;
  }
}

/**
 * 进制转换器页面
 */
export default function BaseConvert() {
  const [sourceBase, setSourceBase] = useState(10);
  const [inputValue, setInputValue] = useState('2026');
  const [copiedBase, setCopiedBase] = useState(null);

  // 转换计算逻辑 (使用 BigInt 防止大数字精度溢出)
  const { results, error } = useMemo(() => {
    if (!inputValue.trim()) {
      return { results: null, error: '' };
    }

    const raw = inputValue.trim();

    // 格式合法性校验
    if (!isValidForBase(raw, sourceBase)) {
      const baseNames = { 2: '二进制 (0-1)', 8: '八进制 (0-7)', 10: '十进制 (0-9)', 16: '十六进制 (0-9, A-F)' };
      return {
        results: null,
        error: `输入内容包含当前 ${baseNames[sourceBase]} 允许范围外的非法字符`
      };
    }

    try {
      let decimalBigInt;
      if (sourceBase === 10) {
        decimalBigInt = BigInt(raw);
      } else if (sourceBase === 2) {
        decimalBigInt = BigInt('0b' + raw);
      } else if (sourceBase === 8) {
        decimalBigInt = BigInt('0o' + raw);
      } else if (sourceBase === 16) {
        decimalBigInt = BigInt('0x' + raw);
      }

      return {
        results: {
          bin: decimalBigInt.toString(2),
          oct: decimalBigInt.toString(8),
          dec: decimalBigInt.toString(10),
          hex: decimalBigInt.toString(16).toUpperCase()
        },
        error: ''
      };
    } catch (err) {
      return {
        results: null,
        error: `转换失败: ${err.message}`
      };
    }
  }, [inputValue, sourceBase]);

  const copyResult = (text, baseName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBase(baseName);
      setTimeout(() => setCopiedBase(null), 1500);
    });
  };

  const handlePreset = (num, base) => {
    setSourceBase(base);
    setInputValue(num);
  };

  return (
    <ToolLayout
      title="进制转换器"
      desc="支持二进制、八进制、十进制、十六进制之间的实时相互转换，内置大数精度与非法字符校验"
    >
      {/* 原始输入卡片 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <span>原始数值与进制输入</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handlePreset('255', 10)}
            >
              255 (十进制)
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handlePreset('11111111', 2)}
            >
              11111111 (二进制)
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handlePreset('FFA0', 16)}
            >
              FFA0 (十六进制)
            </button>
          </div>
        </div>

        <div className="tool-grid-2col">
          <div className="tool-form-group">
            <label className="tool-form-label" htmlFor="source-base-select">
              原始进制
            </label>
            <select
              id="source-base-select"
              className="apple-select"
              style={{ width: '100%' }}
              value={sourceBase}
              onChange={(e) => setSourceBase(Number(e.target.value))}
            >
              <option value={2}>2 进制 (Binary, 0-1)</option>
              <option value={8}>8 进制 (Octal, 0-7)</option>
              <option value={10}>10 进制 (Decimal, 0-9)</option>
              <option value={16}>16 进制 (Hexadecimal, 0-9, A-F)</option>
            </select>
          </div>

          <div className="tool-form-group">
            <label className="tool-form-label" htmlFor="base-input-val">
              输入数值
            </label>
            <input
              id="base-input-val"
              type="text"
              className="apple-input"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontWeight: 600 }}
              placeholder="在此输入数字..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              spellCheck="false"
            />
          </div>
        </div>

        {/* 非法字符报错条 */}
        {error && (
          <div className="apple-error-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 实时多进制转换输出 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <span>转换结果一览</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* 二进制 */}
          <div className="tool-result-item" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '90px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>二进制</span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>Binary (0b)</span>
            </div>
            <span className="tool-result-value" style={{ color: sourceBase === 2 ? 'var(--accent-color)' : 'inherit' }}>
              {results ? results.bin : '-'}
            </span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedBase === 'bin' ? 'copied' : ''}`}
              onClick={() => results && copyResult(results.bin, 'bin')}
              disabled={!results}
            >
              {copiedBase === 'bin' ? '已复制' : '复制'}
            </button>
          </div>

          {/* 八进制 */}
          <div className="tool-result-item" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '90px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>八进制</span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>Octal (0o)</span>
            </div>
            <span className="tool-result-value" style={{ color: sourceBase === 8 ? 'var(--accent-color)' : 'inherit' }}>
              {results ? results.oct : '-'}
            </span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedBase === 'oct' ? 'copied' : ''}`}
              onClick={() => results && copyResult(results.oct, 'oct')}
              disabled={!results}
            >
              {copiedBase === 'oct' ? '已复制' : '复制'}
            </button>
          </div>

          {/* 十进制 */}
          <div className="tool-result-item" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '90px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>十进制</span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>Decimal</span>
            </div>
            <span className="tool-result-value" style={{ color: sourceBase === 10 ? 'var(--accent-color)' : 'inherit' }}>
              {results ? results.dec : '-'}
            </span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedBase === 'dec' ? 'copied' : ''}`}
              onClick={() => results && copyResult(results.dec, 'dec')}
              disabled={!results}
            >
              {copiedBase === 'dec' ? '已复制' : '复制'}
            </button>
          </div>

          {/* 十六进制 */}
          <div className="tool-result-item" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '90px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>十六进制</span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>Hex (0x)</span>
            </div>
            <span className="tool-result-value" style={{ color: sourceBase === 16 ? 'var(--accent-color)' : 'inherit' }}>
              {results ? results.hex : '-'}
            </span>
            <button
              type="button"
              className={`apple-copy-btn ${copiedBase === 'hex' ? 'copied' : ''}`}
              onClick={() => results && copyResult(results.hex, 'hex')}
              disabled={!results}
            >
              {copiedBase === 'hex' ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
