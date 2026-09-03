import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';

// 常用样例 JWT Token (仅用于演示调试)
const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDA4NiIsIm5hbWUiOiLpmp/lhYkiLCJyb2xlcyI6WyJBRE1JTiIsIkRFVkVMT1BFUiJdLCJpYXQiOjE3NTY4NzQ0MDAsImV4cCI6MTc4ODQwODAwMH0.sample_signature_not_verified';

/**
 * 纯前端 Base64URL 解码 (支持中文 UTF-8)
 */
function base64UrlDecode(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = atob(base64);
    return decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return null;
  }
}

/**
 * 时间戳格式化为本地可读字符串
 */
function formatEpoch(epochSec) {
  if (!epochSec || typeof epochSec !== 'number') return null;
  const d = new Date(epochSec * 1000);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());

  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = epochSec - nowSec;

  let rel = '';
  if (diffSec > 0) {
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    rel = `剩余: ${days > 0 ? days + '天 ' : ''}${hours}小时 ${minutes}分钟`;
  } else {
    const pastSec = Math.abs(diffSec);
    const days = Math.floor(pastSec / 86400);
    const hours = Math.floor((pastSec % 86400) / 3600);
    rel = `已过期: ${days > 0 ? days + '天 ' : ''}${hours}小时前`;
  }

  return {
    formatted: `${y}-${m}-${day} ${h}:${min}:${s}`,
    isExpired: diffSec < 0,
    relative: rel
  };
}

/**
 * JWT 离线安全解码器
 */
export default function JwtDecoder() {
  const [tokenInput, setTokenInput] = useState(SAMPLE_JWT);
  const [copied, copy] = useCopyToClipboard();

  // 解析计算
  const { header, payload, signature, error, expInfo, iatInfo } = useMemo(() => {
    if (!tokenInput.trim()) {
      return { header: null, payload: null, signature: '', error: null, expInfo: null, iatInfo: null };
    }

    const parts = tokenInput.trim().split('.');
    if (parts.length < 2) {
      return { header: null, payload: null, signature: '', error: 'Token 格式错误（标准 JWT 应包含由点号分隔的 3 个部分）', expInfo: null, iatInfo: null };
    }

    const headerRaw = base64UrlDecode(parts[0]);
    const payloadRaw = base64UrlDecode(parts[1]);

    if (!headerRaw || !payloadRaw) {
      return { header: null, payload: null, signature: '', error: 'Base64URL 解码失败，请检查 Token 内容是否合法', expInfo: null, iatInfo: null };
    }

    let parsedHeader = null;
    let parsedPayload = null;

    try {
      parsedHeader = JSON.parse(headerRaw);
    } catch {
      parsedHeader = headerRaw;
    }

    try {
      parsedPayload = JSON.parse(payloadRaw);
    } catch {
      parsedPayload = payloadRaw;
    }

    const exp = parsedPayload && typeof parsedPayload === 'object' ? parsedPayload.exp : null;
    const iat = parsedPayload && typeof parsedPayload === 'object' ? parsedPayload.iat : null;

    return {
      header: parsedHeader,
      payload: parsedPayload,
      signature: parts[2] || '',
      error: null,
      expInfo: formatEpoch(exp),
      iatInfo: formatEpoch(iat)
    };
  }, [tokenInput]);

  const handleCopyPayload = () => {
    if (!payload) return;
    copy(JSON.stringify(payload, null, 2));
  };

  return (
    <ToolLayout
      title="JWT 离线安全解码器"
      desc="100% 浏览器纯内存 Base64URL 解码，绝不通过网络上传任何 Token 数据，私密安全地分析 Claims 与过期时间"
    >
      {/* 顶部 Token 输入 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <span>JWT Token 输入</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => setTokenInput(SAMPLE_JWT)}
            >
              加载示例 Token
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={() => setTokenInput('')}
            >
              清空
            </button>
          </div>
        </div>

        <textarea
          className="apple-textarea"
          style={{
            height: '110px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.85rem'
          }}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="在此粘贴形如 eyJhbGciOi... 的 JWT 字符串..."
        />

        {error && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.65rem 0.9rem',
            backgroundColor: 'rgba(255, 69, 58, 0.1)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#ff453a',
            fontSize: '0.825rem'
          }}>
            {error}
          </div>
        )}

        {/* 状态徽章条 */}
        {expInfo && (
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: expInfo.isExpired ? 'rgba(255, 69, 58, 0.08)' : 'rgba(52, 199, 89, 0.08)',
              border: `1px solid ${expInfo.isExpired ? 'rgba(255, 69, 58, 0.25)' : 'rgba(52, 199, 89, 0.25)'}`,
              fontSize: '0.875rem'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{expInfo.isExpired ? '⚠️' : '✅'}</span>
            <div>
              <strong style={{ color: expInfo.isExpired ? '#ff453a' : '#34c759' }}>
                {expInfo.isExpired ? 'Token 已过期' : 'Token 有效中'}
              </strong>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                到期时间：{expInfo.formatted} ({expInfo.relative})
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 双栏：Header 与 Payload 解码预览 */}
      <div className="tool-grid-2col">
        {/* 左侧：Header */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>Header 头部 (算法与类型)</span>
          </div>
          <textarea
            readOnly
            className="apple-textarea"
            style={{
              height: '320px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
            value={header ? JSON.stringify(header, null, 2) : '// 等待输入 Token'}
          />
        </section>

        {/* 右侧：Payload */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>Payload 负载 (Claims 数据)</span>
            <button
              type="button"
              className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
              onClick={handleCopyPayload}
              disabled={!payload}
            >
              {copied ? '✓ 已复制 Payload' : '复制 Payload'}
            </button>
          </div>
          <textarea
            readOnly
            className="apple-textarea"
            style={{
              height: '320px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
            value={payload ? JSON.stringify(payload, null, 2) : '// 等待输入 Token'}
          />
        </section>
      </div>

      {/* 底部：签名展示 */}
      {signature && (
        <section className="tool-section">
          <div className="tool-section-title">
            <span>Signature 签名原串</span>
          </div>
          <div style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.825rem',
            wordBreak: 'break-all',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface-secondary)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)'
          }}>
            {signature}
          </div>
        </section>
      )}
    </ToolLayout>
  );
}
