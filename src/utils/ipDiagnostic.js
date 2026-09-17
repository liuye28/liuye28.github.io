// src/utils/ipDiagnostic.js
/**
 * 将两位国家代码转为 Flag Emoji (如 'US' -> '🇺🇸', 'CN' -> '🇨🇳')
 */
export function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * 校验输入是否为合法 IPv4、IPv6 或域名
 */
export function validateIpOrDomain(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, type: 'invalid' };
  }
  const clean = input.trim();
  if (!clean) return { valid: false, type: 'invalid' };

  // IPv4 正则
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(clean)) {
    return { valid: true, type: 'ipv4' };
  }

  // IPv6 正则
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/;
  if (ipv6Regex.test(clean)) {
    return { valid: true, type: 'ipv6' };
  }

  // 域名正则
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (domainRegex.test(clean)) {
    return { valid: true, type: 'domain' };
  }

  return { valid: false, type: 'invalid' };
}

/**
 * 计算纯净度评级与风险等级
 */
export function calculateRiskAssessment(raw) {
  const security = raw?.security || {};
  const connection = raw?.connection || {};

  const isProxy = Boolean(security.proxy);
  const isVpn = Boolean(security.vpn);
  const isTor = Boolean(security.tor);
  const isHosting = Boolean(connection.hosting);

  const badges = [];

  if (isProxy) badges.push({ label: '代理 (Proxy)', color: 'red' });
  if (isVpn) badges.push({ label: 'VPN 节点', color: 'red' });
  if (isTor) badges.push({ label: 'Tor 出口', color: 'red' });
  if (isHosting) badges.push({ label: '云机房 / 数据中心', color: 'yellow' });
  else badges.push({ label: '原生住宅 / 宽带 ISP', color: 'green' });

  // 1. 高危代理
  if (isProxy || isVpn || isTor) {
    return {
      riskLevel: 'high',
      ipCategory: isHosting ? 'datacenter' : 'residential',
      riskSummary: '检测到代理/VPN/中继网络痕迹，常被电商与高安全级平台风控拦截',
      badges
    };
  }

  // 2. 机房托管
  if (isHosting) {
    return {
      riskLevel: 'moderate',
      ipCategory: 'datacenter',
      riskSummary: '云机房或数据中心托管网络，适合部署服务，不建议作为养号防关联网络',
      badges
    };
  }

  // 3. 原生住宅宽带
  return {
    riskLevel: 'clean',
    ipCategory: 'residential',
    riskSummary: '原生家庭宽带网络，纯净度极高，无已知代理或封禁风险',
    badges
  };
}

/**
 * 标准化数据输出结构
 */
export function normalizeDiagnosticResult(raw) {
  const connection = raw?.connection || {};
  const timezone = raw?.timezone || {};
  const assessment = calculateRiskAssessment(raw);

  const countryCode = raw.country_code || raw.countryCode || '';
  const flagEmoji = getFlagEmoji(countryCode);

  const asnFormatted = connection.asn
    ? (String(connection.asn).toUpperCase().startsWith('AS')
        ? String(connection.asn).toUpperCase()
        : `AS${connection.asn}`)
    : '未知 ASN';

  return {
    ip: raw.ip || '',
    success: raw.success !== false,
    type: raw.type || (raw.ip && raw.ip.includes(':') ? 'IPv6' : 'IPv4'),
    country: raw.country || '未知国家',
    countryCode,
    flagEmoji,
    region: raw.region || '',
    city: raw.city || '',
    postal: raw.postal || '',
    latitude: raw.latitude || 0,
    longitude: raw.longitude || 0,
    timezone: timezone.id || 'UTC',
    utcOffset: timezone.utc || '+00:00',
    localTime: timezone.current_time || '',
    asn: asnFormatted,
    org: connection.org || connection.isp || '未知组织',
    isp: connection.isp || '未知运营商',
    isHosting: Boolean(connection.hosting),
    isProxy: Boolean(raw?.security?.proxy),
    isVpn: Boolean(raw?.security?.vpn),
    isTor: Boolean(raw?.security?.tor),
    ipCategory: assessment.ipCategory,
    riskLevel: assessment.riskLevel,
    riskSummary: assessment.riskSummary,
    badges: assessment.badges,
    raw
  };
}

/**
 * 探测当前客户端的真实公网出口 IP
 */
export async function fetchCurrentPublicIp(fetchImpl = fetch) {
  // 优先源 1: ipify
  try {
    const res = await fetchImpl('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) return data.ip.trim();
    }
  } catch {
    // 忽略并降级
  }

  // 备用源 2: cloudflare cdn-cgi/trace
  try {
    const res = await fetchImpl('https://www.cloudflare.com/cdn-cgi/trace', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const text = await res.text();
      const ipMatch = text.match(/ip=(.+)/);
      if (ipMatch && ipMatch[1]) return ipMatch[1].trim();
    }
  } catch {
    // 忽略并降级
  }

  // 备用源 3: ipwho.is 自带出口识别
  const res = await fetchImpl('https://ipwho.is/', { signal: AbortSignal.timeout(5000) });
  const data = await res.json();
  if (data?.ip) return data.ip.trim();

  throw new Error('无法探测当前公网 IP，请检查网络连接');
}

/**
 * 诊断指定 IP 或域名
 */
export async function inspectIp(targetIp = '', fetchImpl = fetch) {
  const cleanTarget = (targetIp || '').trim();
  const url = cleanTarget ? `https://ipwho.is/${encodeURIComponent(cleanTarget)}` : 'https://ipwho.is/';

  const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`请求 IP 诊断接口失败 (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (data.success === false) {
    throw new Error(data.message || '查询失败，无法识别该 IP 地址');
  }

  return normalizeDiagnosticResult(data);
}
