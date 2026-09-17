import React, { useState, useEffect, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import {
  validateIpOrDomain,
  inspectIp,
  fetchCurrentPublicIp
} from '../../utils/ipDiagnostic';
import './ToolsCommon.css';
import './IpCheck.css';

const STORAGE_KEY_HISTORY = 'personweb_ip_check_history';

const PRESETS = [
  { label: '1.1.1.1 (Cloudflare)', value: '1.1.1.1' },
  { label: '8.8.8.8 (Google)', value: '8.8.8.8' },
  { label: '114.114.114.114 (114DNS)', value: '114.114.114.114' }
];

function loadHistory() {
  const data = safeGetJSON(STORAGE_KEY_HISTORY, []);
  return Array.isArray(data) ? data.slice(0, 5) : [];
}

function saveHistory(item, prevList) {
  const filtered = prevList.filter(
    (h) => h.ip !== item.ip && h.query !== item.query
  );
  const updated = [item, ...filtered].slice(0, 5);
  safeSetJSON(STORAGE_KEY_HISTORY, updated);
  return updated;
}

/**
 * IP 纯净度与风险体检 UI 组件
 */
export default function IpCheck() {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [showRawJson, setShowRawJson] = useState(false);

  const [copiedKey, copyText] = useCopyToClipboard(1600);
  const hasMountedRef = useRef(false);

  // 执行 IP / 域名诊断
  const handleSearch = async (customTarget) => {
    const rawTarget = customTarget !== undefined ? customTarget : queryInput;
    // 容错处理：自动过滤用户粘贴时可能带上的协议头与多余斜杠
    const target = (rawTarget || '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');

    if (!target) {
      setValidationError('请输入需要体检的 IPv4、IPv6 地址或域名');
      return;
    }

    const validation = validateIpOrDomain(target);
    if (!validation.valid) {
      setValidationError('请输入合法的 IPv4 地址 (如 1.1.1.1)、IPv6 地址或域名 (如 google.com)');
      return;
    }

    setValidationError(null);
    setIsLoading(true);
    setError(null);

    try {
      const data = await inspectIp(target);
      setResult(data);
      setHistory((prev) =>
        saveHistory(
          {
            ip: data.ip,
            query: target,
            country: data.country,
            city: data.city,
            flagEmoji: data.flagEmoji,
            riskLevel: data.riskLevel,
            time: Date.now()
          },
          prev
        )
      );
    } catch (err) {
      setError(err.message || '查询失败，无法识别该 IP 地址');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 探测本机真实公网出口 IP 并诊断
  const handleDetectLocal = async () => {
    setIsLoading(true);
    setError(null);
    setValidationError(null);

    try {
      let targetIp = '';
      try {
        targetIp = await fetchCurrentPublicIp();
      } catch {
        // fetchCurrentPublicIp 失败时交由 inspectIp('') 自动捕获
      }

      const data = await inspectIp(targetIp);
      setQueryInput(data.ip);
      setResult(data);
      setHistory((prev) =>
        saveHistory(
          {
            ip: data.ip,
            query: data.ip,
            country: data.country,
            city: data.city,
            flagEmoji: data.flagEmoji,
            riskLevel: data.riskLevel,
            time: Date.now()
          },
          prev
        )
      );
    } catch (err) {
      setError(err.message || '探测本机公网 IP 失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 页面首次挂载时自动探测本机公网出口
  useEffect(() => {
    if (hasMountedRef.current) return;
    hasMountedRef.current = true;
    handleDetectLocal();
  }, []);

  // 清空查询输入
  const handleClearInput = () => {
    setQueryInput('');
    setValidationError(null);
  };

  // 清空体检历史
  const handleClearHistory = () => {
    safeSetJSON(STORAGE_KEY_HISTORY, []);
    setHistory([]);
  };

  // 键盘回车提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // 提取 ASN 数字
  const asnNumber = (result?.asn || '').replace(/[^0-9]/g, '');
  const bgpLink = asnNumber ? `https://bgp.he.net/AS${asnNumber}` : null;

  return (
    <ToolLayout
      title="IP 纯净度与风险体检"
      desc="纯前端直连探测公网 IP 归属、ISP 运营商、机房托管/原生住宅属性与代理中继风险评级"
    >
      {/* 1. 顶部操作与搜索栏 */}
      <section className="ip-search-section">
        <div className="ip-search-form">
          <div className="ip-input-wrapper">
            <svg
              className="ip-input-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="apple-input ip-input-field"
              placeholder="输入 IPv4 / IPv6 地址或域名 (如 1.1.1.1、google.com)..."
              value={queryInput}
              onChange={(e) => {
                setQueryInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              spellCheck="false"
              autoComplete="off"
            />
            {queryInput && (
              <button
                type="button"
                className="ip-input-clear"
                onClick={handleClearInput}
                title="清空输入"
                aria-label="清空输入"
              >
                ✕
              </button>
            )}
          </div>

          <div className="ip-action-btns">
            <button
              type="button"
              className="apple-btn apple-btn-primary"
              onClick={() => handleSearch()}
              disabled={isLoading}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
              <span>{isLoading ? '体检中...' : '开始体检'}</span>
            </button>

            <button
              type="button"
              className="apple-btn apple-btn-secondary"
              onClick={handleDetectLocal}
              disabled={isLoading}
              title="重新探测当前设备公网出口 IP"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="2" />
                <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
              </svg>
              <span>探测本机出口 IP</span>
            </button>
          </div>
        </div>

        {/* 快捷预设胶囊 */}
        <div className="ip-presets-bar">
          <span className="ip-presets-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            快捷预设:
          </span>

          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`ip-preset-pill ${queryInput === preset.value ? 'active' : ''}`}
              onClick={() => {
                setQueryInput(preset.value);
                handleSearch(preset.value);
              }}
              disabled={isLoading}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            className="ip-preset-pill"
            onClick={handleDetectLocal}
            disabled={isLoading}
          >
            📡 探测本机出口 IP
          </button>
        </div>

        {/* 校验错误提示 */}
        {validationError && (
          <div className="apple-error-box" role="alert" style={{ marginTop: '0.85rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}
      </section>

      {/* 2. 接口异常提示 */}
      {error && (
        <div className="apple-error-box" role="alert" style={{ marginBottom: '1.25rem' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div style={{ flex: 1 }}>
            <strong>体检诊断异常：</strong>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="apple-btn apple-btn-secondary apple-btn-sm"
            onClick={handleDetectLocal}
            style={{ marginLeft: 'auto' }}
          >
            重试
          </button>
        </div>
      )}

      {/* 3. 加载中雷达动效 */}
      {isLoading && (
        <section className="ip-loading-card">
          <div className="ip-spinner-radar" aria-hidden="true" />
          <div className="ip-loading-title">正在深度探测 IP 纯净度与风险指标...</div>
          <p className="ip-loading-desc">
            直连权威公网数据源与 ASN 拓扑库，无后端直连检测原生住宅宽带、云机房托管及代理中继痕迹
          </p>
        </section>
      )}

      {/* 4. 初始未查询且未加载时的空状态引导 */}
      {!isLoading && !result && !error && (
        <section className="ip-loading-card" style={{ padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🌐</div>
          <div className="ip-loading-title">输入 IP 或域名开始体检</div>
          <p className="ip-loading-desc">
            支持 IPv4、IPv6 及任意域名，纯前端直连探测物理归属、ISP 运营商、机房托管/原生住宅属性与代理中继风险评级
          </p>
        </section>
      )}

      {/* 5. 诊断结果主视图 */}
      {!isLoading && result && (
        <>
          {/* 5.1 核心评级大卡片 (Apple Hero Card) */}
          <section className="ip-hero-card">
            <div className="ip-hero-left">
              <div className="ip-hero-flag" title={result.country}>
                {result.flagEmoji}
              </div>

              <div className="ip-hero-info">
                <div className="ip-hero-ip-row">
                  <span className="ip-hero-ip">{result.ip}</span>
                  <button
                    type="button"
                    className={`apple-copy-btn ${copiedKey === 'hero-ip' ? 'copied' : ''}`}
                    onClick={() => copyText(result.ip, 'hero-ip')}
                    title="复制 IP 地址"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copiedKey === 'hero-ip' ? '✓ 已复制' : '复制 IP'}</span>
                  </button>
                </div>

                <div className="ip-hero-location">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>
                    {[result.city, result.region, result.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>

                <div className="ip-hero-meta">
                  <span className="apple-pill-badge">{result.type}</span>
                  <span className="apple-pill-badge">{result.asn}</span>
                  <span
                    className="apple-pill-badge"
                    style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={result.isp}
                  >
                    {result.isp}
                  </span>
                </div>
              </div>
            </div>

            {/* 评级徽章与发光光晕 */}
            <div className={`ip-hero-risk ip-hero-risk--${result.riskLevel}`}>
              <div className="ip-risk-pill">
                <span className="ip-risk-dot" />
                <span>
                  {result.riskLevel === 'clean' && '🟢 原生住宅 / 纯净宽带'}
                  {result.riskLevel === 'moderate' && '🟡 云机房 / 数据中心'}
                  {result.riskLevel === 'high' && '🔴 代理中继 / 风险 IP'}
                </span>
              </div>
              <div className="ip-risk-summary-text">{result.riskSummary}</div>
              <div className="ip-risk-badges-row">
                {result.badges.map((b, idx) => (
                  <span
                    key={idx}
                    className={
                      b.color === 'green'
                        ? 'ip-tag-clean'
                        : b.color === 'yellow'
                        ? 'ip-tag-warn'
                        : 'ip-tag-danger'
                    }
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* 5.2 Bento 四宫格 */}
          <div className="ip-bento-grid">
            {/* Bento 1: 纯净度与安全属性 */}
            <div className="ip-bento-card">
              <div className="ip-bento-card-header">
                <span className="ip-bento-card-title">
                  <svg
                    className="ip-bento-card-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  纯净度与安全属性
                </span>
                <span
                  className={
                    result.riskLevel === 'clean'
                      ? 'ip-tag-clean'
                      : result.riskLevel === 'moderate'
                      ? 'ip-tag-warn'
                      : 'ip-tag-danger'
                  }
                >
                  {result.riskLevel === 'clean' ? '安全纯净' : result.riskLevel === 'moderate' ? '中度机房' : '高危代理'}
                </span>
              </div>

              <div className="ip-bento-list">
                <div className="ip-data-row">
                  <span className="ip-data-label">网络属性分类</span>
                  <span className="ip-data-value">
                    {result.isHosting ? (
                      <span className="ip-tag-warn">云机房 / 数据中心托管 (Hosting)</span>
                    ) : (
                      <span className="ip-tag-clean">原生宽带 / 家庭住宅 (Residential)</span>
                    )}
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">代理中继检测</span>
                  <span className="ip-data-value">
                    {result.isProxy ? (
                      <span className="ip-tag-danger">⚠️ 检测到代理 (Proxy: Yes)</span>
                    ) : (
                      <span className="ip-tag-clean">未检测到代理 (Proxy: No)</span>
                    )}
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">VPN 节点检测</span>
                  <span className="ip-data-value">
                    {result.isVpn ? (
                      <span className="ip-tag-danger">⚠️ 检测到 VPN 节点 (VPN: Yes)</span>
                    ) : (
                      <span className="ip-tag-clean">未检测到 VPN (VPN: No)</span>
                    )}
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">Tor 出口中继</span>
                  <span className="ip-data-value">
                    {result.isTor ? (
                      <span className="ip-tag-danger">⚠️ 检测到 Tor 出口 (Tor: Yes)</span>
                    ) : (
                      <span className="ip-tag-clean">未检测到 Tor (Tor: No)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="ip-advice-box">
                {result.riskLevel === 'clean' && (
                  <span>
                    🟢 <strong>优质住宅宽带</strong>：信誉评级极佳，无代理或中继痕迹，非常适合跨境电商防关联、流媒体解锁及高风控平台账号注册。
                  </span>
                )}
                {result.riskLevel === 'moderate' && (
                  <span>
                    🟡 <strong>云托管网络</strong>：机房或数据中心 IP，适合搭建云服务或开发运维接口；若用于海外电商或社媒账号矩阵，易受平台人机验证拦截。
                  </span>
                )}
                {result.riskLevel === 'high' && (
                  <span>
                    🔴 <strong>代理高危风险</strong>：检测到 Proxy/VPN/Tor 明显痕迹，极易触发电商平台、银行或 AI 工具的反作弊封控，请谨慎使用。
                  </span>
                )}
              </div>
            </div>

            {/* Bento 2: 地理物理信息 */}
            <div className="ip-bento-card">
              <div className="ip-bento-card-header">
                <span className="ip-bento-card-title">
                  <svg
                    className="ip-bento-card-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  地理与物理定位
                </span>
                <span className="apple-pill-badge">{result.flagEmoji} {result.countryCode || 'GL'}</span>
              </div>

              <div className="ip-bento-list">
                <div className="ip-data-row">
                  <span className="ip-data-label">国家 / 地区</span>
                  <span className="ip-data-value">
                    {result.flagEmoji} {result.country} ({result.countryCode})
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">省份 / 州</span>
                  <span className="ip-data-value">{result.region || '-'}</span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">城市市区</span>
                  <span className="ip-data-value">{result.city || '-'}</span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">邮政编码</span>
                  <span className="ip-data-value ip-mono">{result.postal || '-'}</span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">经纬度坐标</span>
                  <span className="ip-data-value ip-mono">
                    {result.latitude}, {result.longitude}
                    <button
                      type="button"
                      className={`apple-copy-btn ${copiedKey === 'coords' ? 'copied' : ''}`}
                      onClick={() => copyText(`${result.latitude}, ${result.longitude}`, 'coords')}
                      title="复制经纬度"
                    >
                      {copiedKey === 'coords' ? '已复制' : '复制'}
                    </button>
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">时区 / 偏移</span>
                  <span className="ip-data-value ip-mono">
                    {result.timezone} ({result.utcOffset})
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">当地实时时间</span>
                  <span className="ip-data-value ip-mono">{result.localTime || '-'}</span>
                </div>
              </div>
            </div>

            {/* Bento 3: 网络与自治系统 */}
            <div className="ip-bento-card">
              <div className="ip-bento-card-header">
                <span className="ip-bento-card-title">
                  <svg
                    className="ip-bento-card-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  网络与自治系统 (ASN)
                </span>
                <span className="apple-pill-badge">{result.type}</span>
              </div>

              <div className="ip-bento-list">
                <div className="ip-data-row">
                  <span className="ip-data-label">自治系统 (ASN)</span>
                  <span className="ip-data-value ip-mono">
                    <span>{result.asn}</span>
                    {bgpLink && (
                      <a
                        href={bgpLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ip-ext-link"
                        title="在 Hurricane Electric 查看 BGP 路由拓扑"
                      >
                        <span>BGP</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">ISP 运营商</span>
                  <span className="ip-data-value" title={result.isp}>
                    {result.isp}
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">组织机构 (Org)</span>
                  <span className="ip-data-value" title={result.org}>
                    {result.org}
                  </span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">IP 协议版本</span>
                  <span className="ip-data-value ip-mono">{result.type}</span>
                </div>

                <div className="ip-data-row">
                  <span className="ip-data-label">纯前端直连</span>
                  <span className="ip-data-value">
                    <span className="ip-tag-clean">✓ 零后端 / 本地直连</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bento 4: 最近体检历史 & 原始数据 */}
            <div className="ip-bento-card">
              <div className="ip-bento-card-header">
                <span className="ip-bento-card-title">
                  <svg
                    className="ip-bento-card-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  最近体检历史 & 原始响应
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    className="apple-btn-ghost apple-btn-sm"
                    onClick={handleClearHistory}
                    title="清空体检历史记录"
                    style={{ fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    清空历史
                  </button>
                )}
              </div>

              {/* 历史记录列表 */}
              <div className="ip-history-items">
                {history.length === 0 ? (
                  <div className="ip-history-empty">暂无历史体检记录，输入 IP 或域名即可留痕</div>
                ) : (
                  history.map((h, idx) => (
                    <div
                      key={`${h.ip}-${idx}`}
                      className="ip-history-chip"
                      onClick={() => {
                        setQueryInput(h.query || h.ip);
                        handleSearch(h.query || h.ip);
                      }}
                      title="点击重试该查询"
                    >
                      <div className="ip-history-chip-main">
                        <span>{h.flagEmoji}</span>
                        <span className="ip-history-chip-ip">{h.ip}</span>
                        <span className="ip-history-chip-loc">
                          {[h.city, h.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <span
                        className={
                          h.riskLevel === 'clean'
                            ? 'ip-tag-clean'
                            : h.riskLevel === 'moderate'
                            ? 'ip-tag-warn'
                            : 'ip-tag-danger'
                        }
                      >
                        {h.riskLevel === 'clean' ? '住宅' : h.riskLevel === 'moderate' ? '机房' : '代理'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* 原始响应 JSON 折叠区 */}
              <div className="ip-raw-section">
                <button
                  type="button"
                  className="ip-raw-toggle-btn"
                  onClick={() => setShowRawJson(!showRawJson)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points={showRawJson ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                  </svg>
                  <span>{showRawJson ? '收起原始 JSON 报文' : '查看原始 JSON 报文 (Raw Response)'}</span>
                </button>

                {showRawJson && result.raw && (
                  <div className="ip-raw-json-container">
                    <div className="ip-raw-json-header">
                      <span>ipwho.is 原生响应数据结构</span>
                      <button
                        type="button"
                        className={`apple-copy-btn ${copiedKey === 'raw-json' ? 'copied' : ''}`}
                        onClick={() => copyText(JSON.stringify(result.raw, null, 2), 'raw-json')}
                      >
                        {copiedKey === 'raw-json' ? '✓ 已复制全部' : '复制 JSON'}
                      </button>
                    </div>
                    <pre className="ip-raw-json-block">
                      {JSON.stringify(result.raw, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </ToolLayout>
  );
}
