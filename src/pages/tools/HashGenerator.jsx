import React, { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import md5 from '../../utils/md5';
import './ToolsCommon.css';

/**
 * 使用浏览器原生 Web Crypto API 计算哈希
 */
async function computeHash(algorithm, text) {
  if (!text) return '';
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 哈希与 UUID 生成器
 */
export default function HashGenerator() {
  // 哈希计算状态
  const [inputText, setInputText] = useState('Hello, Developer!');
  const [isUppercase, setIsUppercase] = useState(false);
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  });

  // UUID 生成状态
  const [uuidCount, setUuidCount] = useState(5);
  const [uuidHyphen, setUuidHyphen] = useState(true);
  const [uuidUppercase, setUuidUppercase] = useState(false);
  const [uuidList, setUuidList] = useState([]);
  const [copiedKey, copyText] = useCopyToClipboard();

  // 实时计算哈希
  useEffect(() => {
    if (!inputText) {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
      return;
    }

    const runHashes = async () => {
      const [sha1, sha256, sha512] = await Promise.all([
        computeHash('SHA-1', inputText),
        computeHash('SHA-256', inputText),
        computeHash('SHA-512', inputText)
      ]);
      const md5Hash = md5(inputText);

      setHashes({
        md5: isUppercase ? md5Hash.toUpperCase() : md5Hash,
        sha1: isUppercase ? sha1.toUpperCase() : sha1,
        sha256: isUppercase ? sha256.toUpperCase() : sha256,
        sha512: isUppercase ? sha512.toUpperCase() : sha512
      });
    };

    runHashes();
  }, [inputText, isUppercase]);

  // 生成 UUID
  const generateUuids = () => {
    const list = [];
    for (let i = 0; i < uuidCount; i++) {
      let id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

      if (!uuidHyphen) id = id.replace(/-/g, '');
      if (uuidUppercase) id = id.toUpperCase();
      list.push(id);
    }
    setUuidList(list);
  };

  useEffect(() => {
    generateUuids();
  }, [uuidCount, uuidHyphen, uuidUppercase]);


  return (
    <ToolLayout
      title="哈希与 UUID 生成器"
      desc="基于 Web Crypto API 的安全实时哈希计算 (MD5, SHA-256, SHA-512) 与 UUID v4 批量生成"
    >
      {/* 1. 哈希计算 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <span>实时文本哈希 (Hash Digest)</span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isUppercase}
              onChange={() => setIsUppercase(!isUppercase)}
            />
            <span>大写输出 (Uppercase)</span>
          </label>
        </div>

        <div className="tool-form-group">
          <label className="tool-form-label" htmlFor="hash-input">
            输入待计算哈希的明文
          </label>
          <input
            id="hash-input"
            type="text"
            className="apple-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入字符串实时生成各算法哈希值..."
            spellCheck="false"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem' }}>
          {[
            { label: 'MD5 (128-bit)', key: 'md5', val: hashes.md5 },
            { label: 'SHA-1 (160-bit)', key: 'sha1', val: hashes.sha1 },
            { label: 'SHA-256 (256-bit)', key: 'sha256', val: hashes.sha256 },
            { label: 'SHA-512 (512-bit)', key: 'sha512', val: hashes.sha512 }
          ].map(({ label, key, val }) => (
            <div key={key} className="tool-result-item" style={{ padding: '0.75rem 0.9rem' }}>
              <span className="tool-result-label" style={{ minWidth: '130px' }}>{label}</span>
              <span className="tool-result-value" style={{ color: 'var(--accent-color)', fontSize: '0.825rem' }}>
                {val || '-'}
              </span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === key ? 'copied' : ''}`}
                onClick={() => val && copyText(val, key)}
                disabled={!val}
              >
                {copiedKey === key ? '已复制' : '复制'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. UUID 生成器 */}
      <div className="tool-section">
        <div className="tool-section-title">
          <span>UUID v4 批量生成器</span>
          <button
            type="button"
            className="apple-btn apple-btn-primary apple-btn-sm"
            onClick={generateUuids}
          >
            ⟳ 重新生成
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>生成数量:</span>
            <select
              className="apple-select"
              style={{ height: '34px', padding: '0 2rem 0 0.75rem' }}
              value={uuidCount}
              onChange={(e) => setUuidCount(Number(e.target.value))}
            >
              <option value={1}>1 个</option>
              <option value={5}>5 个</option>
              <option value={10}>10 个</option>
              <option value={20}>20 个</option>
            </select>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={uuidHyphen}
              onChange={() => setUuidHyphen(!uuidHyphen)}
            />
            <span>保留连字符 (-)</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={uuidUppercase}
              onChange={() => setUuidUppercase(!uuidUppercase)}
            />
            <span>大写字母</span>
          </label>

          <button
            type="button"
            className={`apple-btn apple-btn-secondary apple-btn-sm ${copiedKey === 'all-uuid' ? 'copied' : ''}`}
            onClick={() => copyText(uuidList.join('\n'), 'all-uuid')}
            style={{ marginLeft: 'auto' }}
          >
            {copiedKey === 'all-uuid' ? '✓ 全部已复制' : '复制全部 UUID'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {uuidList.map((id, idx) => (
            <div key={idx} className="tool-result-item" style={{ padding: '0.6rem 0.9rem' }}>
              <span className="apple-pill-badge" style={{ minWidth: '36px', justifyContent: 'center' }}>
                #{idx + 1}
              </span>
              <span className="tool-result-value" style={{ fontSize: '0.875rem' }}>
                {id}
              </span>
              <button
                type="button"
                className={`apple-copy-btn ${copiedKey === `uuid-${idx}` ? 'copied' : ''}`}
                onClick={() => copyText(id, `uuid-${idx}`)}
              >
                {copiedKey === `uuid-${idx}` ? '已复制' : '复制'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
