import React, { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

/**
 * 安全的 UTF-8 字符串转 Base64
 */
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

/**
 * 安全的 Base64 转 UTF-8 字符串
 */
function base64ToUtf8(base64) {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * URL 与 Base64 编解码器
 */
export default function Codec() {
  const [mode, setMode] = useState('url'); // 'url' | 'base64'
  const [action, setAction] = useState('encode'); // 'encode' | 'decode'
  const [inputText, setInputText] = useState('https://github.com/search?q=React 导航站&type=repositories');
  const [outputText, setOutputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!inputText) {
      setOutputText('');
      setErrorMsg('');
      return;
    }

    try {
      if (mode === 'url') {
        if (action === 'encode') {
          setOutputText(encodeURIComponent(inputText));
        } else {
          setOutputText(decodeURIComponent(inputText));
        }
      } else {
        if (action === 'encode') {
          setOutputText(utf8ToBase64(inputText));
        } else {
          setOutputText(base64ToUtf8(inputText.trim()));
        }
      }
      setErrorMsg('');
    } catch (err) {
      setOutputText('');
      setErrorMsg(`解码失败: ${err.message} (请检查输入内容是否为有效的 ${mode.toUpperCase()} 编码格式)`);
    }
  }, [inputText, mode, action]);

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleSwap = () => {
    if (outputText) {
      setInputText(outputText);
      setAction(action === 'encode' ? 'decode' : 'encode');
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setErrorMsg('');
  };

  return (
    <ToolLayout
      title="URL / Base64 编解码器"
      desc="支持 URL 参数与 Base64 字符串的实时双向编码/解码，全链路支持 UTF-8 中文无乱码"
    >
      <div className="tool-section">
        <div className="tool-section-title">
          <span>编解码选项</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            {/* 模式选择 */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-surface-secondary)', padding: '2px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className={`apple-btn apple-btn-sm ${mode === 'url' ? 'apple-btn-primary' : 'apple-btn-ghost'}`}
                onClick={() => setMode('url')}
              >
                URL 编解码
              </button>
              <button
                type="button"
                className={`apple-btn apple-btn-sm ${mode === 'base64' ? 'apple-btn-primary' : 'apple-btn-ghost'}`}
                onClick={() => setMode('base64')}
              >
                Base64 编解码
              </button>
            </div>

            {/* 操作选择 */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-surface-secondary)', padding: '2px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className={`apple-btn apple-btn-sm ${action === 'encode' ? 'apple-btn-secondary' : 'apple-btn-ghost'}`}
                onClick={() => setAction('encode')}
              >
                编码 (Encode)
              </button>
              <button
                type="button"
                className={`apple-btn apple-btn-sm ${action === 'decode' ? 'apple-btn-secondary' : 'apple-btn-ghost'}`}
                onClick={() => setAction('decode')}
              >
                解码 (Decode)
              </button>
            </div>
          </div>
        </div>

        <div className="tool-grid-2col">
          {/* 输入 */}
          <div className="tool-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label className="tool-form-label" htmlFor="codec-input" style={{ marginBottom: 0 }}>
                {action === 'encode' ? '输入原始明文文本' : `输入待解码的 ${mode.toUpperCase()} 字符串`}
              </label>
              <button
                type="button"
                className="apple-btn apple-btn-ghost apple-btn-sm"
                onClick={handleClear}
                disabled={!inputText}
              >
                清空
              </button>
            </div>
            <textarea
              id="codec-input"
              className="apple-textarea"
              rows={11}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="在此输入文本..."
              spellCheck="false"
            />
          </div>

          {/* 输出 */}
          <div className="tool-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <span className="tool-form-label" style={{ marginBottom: 0 }}>
                {action === 'encode' ? `${mode.toUpperCase()} 编码结果` : '解码还原明文'}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="apple-btn apple-btn-secondary apple-btn-sm"
                  onClick={handleSwap}
                  disabled={!outputText}
                  title="将输出作为输入并反转操作"
                >
                  ⇄ 交换输入输出
                </button>
                <button
                  type="button"
                  className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
                  onClick={handleCopy}
                  disabled={!outputText}
                >
                  {copied ? '✓ 已复制' : '复制'}
                </button>
              </div>
            </div>
            <textarea
              className="apple-textarea"
              rows={11}
              value={outputText}
              readOnly
              placeholder="转换结果将实时展示在此..."
              spellCheck="false"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            />
          </div>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="apple-error-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
