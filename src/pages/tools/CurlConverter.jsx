import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { parseCurl, generateCode } from '../../utils/curlConverter';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';

const SAMPLE_CURL = `curl 'https://api.example.com/v1/orders' \\
  -X POST \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \\
  -H 'Content-Type: application/json' \\
  -d '{"order_id": 10086, "status": "PAID"}'`;


/**
 * cURL 命令转多语言代码工具
 */
export default function CurlConverter() {
  const [curlInput, setCurlInput] = useState(SAMPLE_CURL);
  const [targetLang, setTargetLang] = useState('java11');
  const [copied, copy] = useCopyToClipboard();

  const parsed = useMemo(() => {
    return parseCurl(curlInput);
  }, [curlInput]);

  const outputCode = useMemo(() => {
    return generateCode(parsed, targetLang);
  }, [parsed, targetLang]);

  const handleCopy = () => {
    if (!outputCode) return;
    copy(outputCode);
  };

  return (
    <ToolLayout
      title="cURL 转多语言代码工具"
      desc="解析浏览器或终端 cURL 命令，一键转为 Java HttpClient、Spring RestTemplate、OkHttp 或 JS Fetch"
    >
      <section className="tool-section">
        <div className="tool-section-title">
          <span>cURL 命令输入</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => setCurlInput(SAMPLE_CURL)}
            >
              加载示例 cURL
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={() => setCurlInput('')}
            >
              清空
            </button>
          </div>
        </div>

        <textarea
          className="apple-textarea"
          style={{
            height: '130px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.85rem'
          }}
          value={curlInput}
          onChange={(e) => setCurlInput(e.target.value)}
          placeholder="在此粘贴 curl 'https://...' 命令..."
        />
      </section>

      {/* 结果展示 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>生成的目标代码</span>
            <select
              className="apple-input"
              style={{ width: '220px', padding: '0.3rem 0.6rem', fontSize: '0.825rem' }}
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              <option value="java11">Java 11+ HttpClient</option>
              <option value="spring">Java Spring RestTemplate</option>
              <option value="okhttp">Java OkHttp 4</option>
              <option value="fetch">JavaScript fetch</option>
            </select>
          </div>
          <button
            type="button"
            className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
            onClick={handleCopy}
            disabled={!outputCode}
          >
            {copied ? '✓ 已复制代码' : '复制代码'}
          </button>
        </div>

        <textarea
          readOnly
          className="apple-textarea"
          style={{
            height: '420px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.85rem',
            backgroundColor: 'var(--bg-surface-secondary)'
          }}
          value={outputCode}
        />
      </section>
    </ToolLayout>
  );
}
