import React, { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
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
 * 简易纯 JS MD5 计算实现 (保证无网络和依赖情况下立即可用)
 */
function simpleMd5(string) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | (~x & z); }
  function G(x, y, z) { return (x & z) | (y & ~z); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | ~z); }
  function FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str) {
    const utf8Str = unescape(encodeURIComponent(str));
    const lWordCount = ((utf8Str.length + 8) >> 6) + 1;
    const lWordArray = new Array(lWordCount * 16).fill(0);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < utf8Str.length) {
      const lWordNumber = lBytePosition >> 2;
      const lBitPosition = (lBytePosition % 4) * 8;
      lWordArray[lWordNumber] = lWordArray[lWordNumber] | (utf8Str.charCodeAt(lByteCount) << lBitPosition);
      lBytePosition++;
      lByteCount++;
    }
    const lWordNumber = lBytePosition >> 2;
    const lBitPosition = (lBytePosition % 4) * 8;
    lWordArray[lWordNumber] = lWordArray[lWordNumber] | (0x80 << lBitPosition);
    lWordArray[lWordCount * 16 - 2] = utf8Str.length << 3;
    lWordArray[lWordCount * 16 - 1] = utf8Str.length >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue) {
    let wordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const hex = '0123456789abcdef';
      wordToHexValue += hex.charAt((lByte >> 4) & 0x0f) + hex.charAt(lByte & 0x0f);
    }
    return wordToHexValue;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
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
  const [copiedKey, setCopiedKey] = useState(null);

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
      const md5 = simpleMd5(inputText);

      setHashes({
        md5: isUppercase ? md5.toUpperCase() : md5,
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

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

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
