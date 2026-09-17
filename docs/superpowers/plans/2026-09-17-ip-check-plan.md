# IP 纯净度与风险体检 (IP Lookup & Risk Inspector) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 100% 纯前端、零后端依赖的「IP 纯净度与代理/机房风险体检」工具，集成至 personWeb 工具箱与全局调度系统。

**Architecture:** 前端直接调用具备 CORS 支持的免鉴权公共接口（`ipwho.is`、`cloudflare.com/cdn-cgi/trace` 等），在客户端提取地理归属、ASN 运营商、托管机房/代理特征，并通过规则引擎计算纯净度与风险评级；界面采用 Apple HIG Bento Grid 风格，实现高颜值展示并全站联动（WebTerminal、CommandPalette、工具索引）。

**Tech Stack:** React 18, React Router 7 (HashRouter), CSS Modules / Apple HIG CSS Variables, Node:test (单元测试).

**Spec:** `docs/superpowers/specs/2026-09-17-ip-check-design.md`

## Global Constraints

- 100% 纯前端静态运行，严禁添加任何云端或 Node/Express 后端代理，保持 GitHub Pages 直接部署可用。
- 遵循 Apple HIG 极简设计语言，复用 `src/pages/tools/ToolsCommon.css` 与全站 CSS 变量（`--bg-primary`, `--card-bg`, `--border-subtle`, `--accent-color` 等），暗黑/浅色双模自适应。
- 零外部 npm 重量级依赖，使用浏览器原生 `fetch` 与 `localStorage`。
- 单元测试覆盖核心解析算法与风险计算纯函数，通过 `npm test` 持续验证。

---

### Task 1: IP 诊断与风险评估核心逻辑引擎 (ipDiagnostic.js) 与单元测试

**Files:**
- Create: `src/utils/ipDiagnostic.js`
- Create: `tests/ipDiagnostic.test.js`

**Interfaces:**
- Produces:
  - `validateIpOrDomain(input: string): { valid: boolean, type: 'ipv4' | 'ipv6' | 'domain' | 'invalid' }`
  - `calculateRiskAssessment(raw: object): { riskLevel: 'clean' | 'moderate' | 'high', ipCategory: 'residential' | 'datacenter' | 'cellular' | 'unknown', riskSummary: string, badges: Array<{ label: string, color: string }> }`
  - `fetchCurrentPublicIp(fetchImpl?: typeof fetch): Promise<string>`
  - `inspectIp(targetIp?: string, fetchImpl?: typeof fetch): Promise<IpDiagnosticResult>`

- [ ] **Step 1: Write the failing unit test**

```javascript
// tests/ipDiagnostic.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateIpOrDomain,
  calculateRiskAssessment,
  normalizeDiagnosticResult
} from '../src/utils/ipDiagnostic.js';

describe('ipDiagnostic 核心引擎测试', () => {
  test('validateIpOrDomain 正确识别 IPv4、IPv6 与域名', () => {
    assert.deepEqual(validateIpOrDomain('1.1.1.1'), { valid: true, type: 'ipv4' });
    assert.deepEqual(validateIpOrDomain('192.168.1.1'), { valid: true, type: 'ipv4' });
    assert.deepEqual(validateIpOrDomain('2606:4700:4700::1111'), { valid: true, type: 'ipv6' });
    assert.deepEqual(validateIpOrDomain('google.com'), { valid: true, type: 'domain' });
    assert.deepEqual(validateIpOrDomain(''), { valid: false, type: 'invalid' });
    assert.deepEqual(validateIpOrDomain('invalid..ip'), { valid: false, type: 'invalid' });
  });

  test('calculateRiskAssessment 识别云机房与数据中心 IP (Moderate)', () => {
    const rawHosting = {
      ip: '1.1.1.1',
      connection: {
        isp: 'Cloudflare, Inc.',
        hosting: true
      },
      security: {
        proxy: false,
        vpn: false,
        tor: false
      }
    };
    const assessment = calculateRiskAssessment(rawHosting);
    assert.equal(assessment.riskLevel, 'moderate');
    assert.equal(assessment.ipCategory, 'datacenter');
    assert.ok(assessment.riskSummary.includes('机房'));
  });

  test('calculateRiskAssessment 识别已知代理/VPN 风险 (High)', () => {
    const rawProxy = {
      ip: '45.67.89.10',
      connection: {
        isp: 'M247 Ltd',
        hosting: true
      },
      security: {
        proxy: true,
        vpn: true,
        tor: false
      }
    };
    const assessment = calculateRiskAssessment(rawProxy);
    assert.equal(assessment.riskLevel, 'high');
    assert.ok(assessment.riskSummary.includes('代理') || assessment.riskSummary.includes('VPN'));
  });

  test('calculateRiskAssessment 识别原生家庭宽带 ISP (Clean)', () => {
    const rawResidential = {
      ip: '116.233.1.2',
      connection: {
        isp: 'China Telecom',
        hosting: false
      },
      security: {
        proxy: false,
        vpn: false,
        tor: false
      }
    };
    const assessment = calculateRiskAssessment(rawResidential);
    assert.equal(assessment.riskLevel, 'clean');
    assert.equal(assessment.ipCategory, 'residential');
    assert.ok(assessment.riskSummary.includes('家庭宽带') || assessment.riskSummary.includes('原生'));
  });

  test('normalizeDiagnosticResult 标准化输出结构', () => {
    const raw = {
      ip: '8.8.8.8',
      success: true,
      type: 'IPv4',
      country: 'United States',
      country_code: 'US',
      region: 'California',
      city: 'Mountain View',
      latitude: 37.4223,
      longitude: -122.0848,
      timezone: {
        id: 'America/Los_Angeles',
        utc: '-07:00',
        current_time: '2026-09-17T01:30:00-07:00'
      },
      connection: {
        asn: 15169,
        org: 'Google LLC',
        isp: 'Google LLC',
        hosting: true
      },
      security: {
        proxy: false,
        vpn: false,
        tor: false
      }
    };

    const normalized = normalizeDiagnosticResult(raw);
    assert.equal(normalized.ip, '8.8.8.8');
    assert.equal(normalized.country, 'United States');
    assert.equal(normalized.flagEmoji, '🇺🇸');
    assert.equal(normalized.asn, 'AS15169');
    assert.equal(normalized.org, 'Google LLC');
    assert.equal(normalized.riskLevel, 'moderate');
    assert.equal(normalized.ipCategory, 'datacenter');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ipDiagnostic.test.js`
Expected: FAIL (module `../src/utils/ipDiagnostic.js` not found).

- [ ] **Step 3: Implement src/utils/ipDiagnostic.js**

```javascript
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

  // IPv4 正则 (0-255.0-255.0-255.0-255)
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(clean)) {
    return { valid: true, type: 'ipv4' };
  }

  // IPv6 正则 (支持简写与标准冒号十六进制)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/;
  if (ipv6Regex.test(clean)) {
    return { valid: true, type: 'ipv6' };
  }

  // 基础域名正则 (例如 example.com)
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
      riskSummary: '云厂商或数据中心托管网络，适合部署服务，不建议作为养号防关联网络',
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ipDiagnostic.test.js`
Expected: PASS (5/5 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/utils/ipDiagnostic.js tests/ipDiagnostic.test.js
git commit -m "feat(ipDiagnostic): add IP lookup & risk assessment core engine with tests"
```

---

### Task 2: IP 纯净度体检 UI 组件 (IpCheck.jsx & IpCheck.css)

**Files:**
- Create: `src/pages/tools/IpCheck.jsx`
- Create: `src/pages/tools/IpCheck.css`

**Interfaces:**
- Consumes:
  - `validateIpOrDomain`, `inspectIp`, `fetchCurrentPublicIp` from `src/utils/ipDiagnostic.js`
  - `src/pages/tools/ToolsCommon.css` for common tool styles
- Produces:
  - React component `export default function IpCheck()`

- [ ] **Step 1: Create IpCheck.css with Apple HIG design & Bento Grid layout**

Implement responsive, glowing Apple HIG card styles, badge styles (`clean`, `moderate`, `high`), copy feedback buttons, search input group, and history tags.

- [ ] **Step 2: Create IpCheck.jsx**

Implement:
1. Auto-detection of local public IP on mount;
2. Search input with validation and presets (`1.1.1.1`, `8.8.8.8`, `114.114.114.114`);
3. Loading skeleton / spinner state;
4. Hero Card displaying IP, Flag Emoji, Country/City, and Glowing Risk Badge (🟢 原生住宅 / 🟡 云机房 / 🔴 代理中继);
5. Bento Grid cards:
   - Security & Risk Details (Hosting status, Proxy, VPN, Tor, Summary advice);
   - Geographic Coordinates (Country, Region, City, Postal, Lat/Lng, Timezone, Local time);
   - Network Origin (ASN with external BGP link, ISP, Organization Org, IP type);
   - Recent search history (localStorage 5 items) & collapsible Raw JSON view with copy button.

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/IpCheck.jsx src/pages/tools/IpCheck.css
git commit -m "feat(tools): add IpCheck UI component with Apple HIG bento grid"
```

---

### Task 3: 全站路由、工具箱索引、WebTerminal 及 Command Palette 联动

**Files:**
- Modify: `src/data/tools.js`
- Modify: `src/App.jsx`
- Modify: `src/components/WebTerminal.jsx`
- Modify: `src/utils/commandPaletteIndex.js`
- Modify: `tests/commandPaletteIndex.test.js`

**Interfaces:**
- Consumes: `IpCheck.jsx`
- Produces: Registered `/tools/ip-check` route, metadata entry in `tools.js`, terminal command `open ip-check`, command palette search entry.

- [ ] **Step 1: Register in src/data/tools.js**

Add entry to `tools` array:
```javascript
{
  id: "ip-check",
  name: "IP 纯净度与风险体检",
  path: "/tools/ip-check",
  desc: "纯前端一键探测公网 IP 归属、ISP 运营商、机房托管/原生住宅属性与代理风险评级",
  category: "开发/调试",
  iconType: "network"
}
```

- [ ] **Step 2: Register route in src/App.jsx**

Add dynamic lazy load:
```javascript
const IpCheck = lazy(() => import('./pages/tools/IpCheck'));
```
And add route inside `<Routes>`:
```javascript
<Route path="/tools/ip-check" element={<IpCheck />} />
```

- [ ] **Step 3: Update src/components/WebTerminal.jsx**

Ensure `open ip-check` or `ip-check` is recognized in the terminal command router.

- [ ] **Step 4: Update commandPaletteIndex.js and tests/commandPaletteIndex.test.js**

Add keyword aliases (`ip`, `ip-check`, `ip体检`, `ip纯净度`, `asn`, `机房检测`) and run `npm test` to ensure 100% tests pass.

- [ ] **Step 5: Run tests to verify**

Run: `npm test`
Expected: All test suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/tools.js src/App.jsx src/components/WebTerminal.jsx src/utils/commandPaletteIndex.js tests/commandPaletteIndex.test.js
git commit -m "feat(integration): register ip-check tool in routes, terminal, and command palette"
```

---

### Task 4: 构建与端到端完整体验验证 (Build & E2E Validation)

**Files:**
- None (Verification)

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Vite build succeeds with 0 errors and creates production bundle in `dist/`.

- [ ] **Step 3: Documentation and walkthrough update**

Update `README.md` to reflect the new tool (19 款实用工具).
Commit final updates:
```bash
git add README.md
git commit -m "docs: update README with ip-check tool documentation"
```
