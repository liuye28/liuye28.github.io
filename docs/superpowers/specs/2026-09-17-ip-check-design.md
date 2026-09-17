# IP 纯净度与代理/机房风险体检 (IP Lookup & Risk Inspector) 设计规范

- **状态**：已批准 (Approved)
- **创建日期**：2026-09-17
- **设计分类**：Architectural（新功能小工具子系统）
- **目标工程**：Ly's Workspace (personWeb)

---

## 1. 背景与目标

### 1.1 背景
**Ly's Workspace** 作为一个专注于开发者与跨境电商的纯前端一站式工作台，用户在开发运维、跨境电商运营（如 Ozon、亚马逊、Shopee 等防关联）以及访问海外 AI 服务（ChatGPT、Claude 等）时，对当前网络出口的 **IP 纯净度、代理痕迹、住宅宽带 vs 机房托管类型** 有着高频且刚性的体检需求。
借鉴 [zhihui-hu/one-ip](https://github.com/zhihui-hu/one-ip) 的优秀设计，我们提取其最核心的 **IP 归属与代理/机房风险体检** 能力，并将其 100% 纯前端化，无缝融入我们网站的 Apple HIG 设计系统。

### 1.2 目标
1. **纯前端免后端**：遵循 GitHub Pages 零后端原则，完全依靠浏览器端直连开放 CORS 且无需 API Key 的权威数据源（如 `ipwho.is` 与 `ipify/cloudflare`），零隐私泄露、零维护成本。
2. **深度风险与纯净度体检**：
   - 自动识别 IP 属性（住宅宽带 Residential / 数据中心机房 Hosting / 移动基站 Cellular）；
   - 检测代理与风险标签（Proxy, VPN, Tor, 数据中心托管标记）；
   - 输出醒目的 Apple 风格综合风险评级（🟢 优质住宅 / 🟡 托管机房 / 🔴 高危代理）。
3. **物理归属与网络详细参数**：
   - 国旗 Emoji、国家/地区、省州、城市、经纬度、时区及当地时间；
   - 自治系统 ASN、组织名称（Org）、ISP 运营商。
4. **极致交互与全站集成**：
   - 页面载入自动测本网公网 IP，同时支持手动输入任意 IPv4/IPv6 或域名体检；
   - 常用公共节点快捷填充、一键复制字段、本地历史记录（localStorage 最近 5 条）；
   - 注册进小工具总览、全局 Command Palette（`⌘K`）和全局 WebTerminal（`open ip-check`）。

---

## 2. 总体架构与纯前端数据流

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                            │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ 搜索栏与预设节点     │  │ 纯净度评级大卡片 │  │ Bento 网格详细卡片│  │
│  └──────────┬───────────┘  └────────┬────────┘  └─────────┬─────────┘  │
└─────────────┼───────────────────────┼─────────────────────┼────────────┘
              │                       │                     │
┌─────────────▼───────────────────────▼─────────────────────▼────────────┐
│                  IP & Risk Diagnostic Service (Client)                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     src/utils/ipDiagnostic.js                     │  │
│  │  - fetchCurrentPublicIp(): 多源探测真实出口 IP                    │  │
│  │  - inspectIp(targetIp): 请求 ipwho.is 并做异常熔断降级           │  │
│  │  - calculateRiskAssessment(data): 计算纯净度评级与风险指标        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ (Browser Native fetch / CORS)
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
┌──────────────────┐                                    ┌──────────────────┐
│    ipwho.is      │                                    │  cloudflare.com  │
│ (主要数据与ASN)  │                                    │  (cdn-cgi/trace) │
└──────────────────┘                                    └──────────────────┘
```

---

## 3. 数据模型与风险评估算法

### 3.1 诊断响应模型 (IpDiagnosticResult)

```typescript
export interface IpDiagnosticResult {
  ip: string;
  success: boolean;
  type: 'IPv4' | 'IPv6';
  // 地理位置
  country: string;
  countryCode: string;
  flagEmoji: string;
  region: string;
  city: string;
  postal?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: string;
  localTime: string;
  // 网络与自治系统
  asn: string;
  org: string;
  isp: string;
  // 纯净度与风险
  isHosting: boolean;    // 是否为数据中心/托管云服务机房
  isProxy: boolean;      // 是否检测到代理
  isVpn: boolean;        // 是否为 VPN 节点
  isTor: boolean;        // 是否为 Tor 节点
  ipCategory: 'residential' | 'datacenter' | 'cellular' | 'unknown';
  riskLevel: 'clean' | 'moderate' | 'high'; // 🟢 纯净 | 🟡 中度 | 🔴 风险
  riskSummary: string;   // 简明判定描述
  // 原始元数据
  raw: any;
}
```

### 3.2 纯净度判定逻辑 (Risk Assessment Logic)

1. **高风险（🔴 High / Red）**：
   - 触发条件：`isProxy === true` 或 `isVpn === true` 或 `isTor === true`。
   - 判定总结：“检测到代理/VPN/中继节点，可能被电商或流媒体平台风控标记”。
2. **中度风险（🟡 Moderate / Yellow）**：
   - 触发条件：`isHosting === true`（云厂商服务器、VPS、数据中心机房机房 IP，例如 AWS, Cloudflare, DigitalOcean, 阿里云等）。
   - 判定总结：“机房/数据中心托管 IP，非家庭住宅宽带，适合搭建服务，不建议作为养号防关联网络”。
3. **安全纯净（🟢 Clean / Green）**：
   - 触发条件：非 Hosting、非 Proxy/VPN/Tor，属于典型运营商 ISP（家庭住宅宽带或移动基站）。
   - 判定总结：“原生家庭宽带/民用网络，纯净度极高，信誉良好”。

---

## 4. 界面布局与视觉规范 (Apple HIG Bento Grid)

遵循全站既有的 `ToolsCommon.css` 与 Apple HIG 设计语言：

1. **工具头部 (Tool Header)**：
   - 面包屑：`小工具 / IP 纯净度与风险体检`
   - 标题与描述、`🔒 纯本地浏览器直连` 绿色认证徽标。
2. **操作与搜索区 (Action Bar)**：
   - 搜索输入框：支持输入 IPv4/IPv6 或主机名；
   - 按钮组：`开始体检`（主色高亮）、`探测本机 IP`、`清空`；
   - 快捷预设胶囊：`1.1.1.1 (Cloudflare)`、`8.8.8.8 (Google)`、`114.114.114.114 (114DNS)`。
3. **核心评级大卡片 (Apple Hero Card)**：
   - 左侧：国旗 Emoji + 大号 IP 地址（带一键复制小图标）+ 物理城市/国家。
   - 右侧：**发光圆环与纯净度评分徽章**（例如带有绿色光晕的 `🟢 优质住宅宽带` 或橙色光晕的 `🟡 云机房托管`）。
4. **Bento 数据四宫格 (Detail Grid)**：
   - **卡片 A：安全与纯净度分析**：列表展示「网络性质（住宅/机房）」、「代理/VPN 标记」、「Tor 出口状态」、「风控建议」。
   - **卡片 B：物理地理坐标**：国家地区、省份城市、邮政编码、经纬度、时区与当前时刻。
   - **卡片 C：运营商与网络源流**：ASN 编号（带外部 BGP 查看链接）、ISP 运营商名称、组织机构（Org）。
   - **卡片 D：最近查询历史**：纯本地 `localStorage` 缓存最近 5 条查询记录，点击可快速重填体检。

---

## 5. 全站联动与注册规范

1. **工具元数据注册 (`src/data/tools.js`)**：
   - ID：`ip-check`
   - 名称：`IP 纯净度与风险体检`
   - 路径：`/tools/ip-check`
   - 分类：`开发/调试`
   - 图标类型：`network`
2. **路由注册 (`src/App.jsx`)**：
   - 懒加载 `const IpCheck = lazy(() => import('./pages/tools/IpCheck'));`
   - 路由：`<Route path="/tools/ip-check" element={<IpCheck />} />`
3. **WebTerminal 终端注册 (`src/components/WebTerminal.jsx`)**：
   - 支持 `tools` 命令列表展示 `ip-check`；
   - 支持 `open ip-check` 一键无刷新跳转路由。
4. **Command Palette 命令面板 (`src/utils/commandPaletteIndex.js`)**：
   - 纳入实用工具检索索引，支持搜 `ip`、`ip-check`、`ip体检`、`ip纯净度` 等关键字秒级回车唤起。

---

## 6. 测试与验证方案

1. **单元测试 (`tests/ipDiagnostic.test.js`)**：
   - 验证 IP 格式校验正则（合法 IPv4、合法 IPv6、非法输入）；
   - 验证风险判定算法（输入模拟 hosting 数据判定为 moderate，输入 proxy 数据判定为 high，输入普通 ISP 判定为 clean）；
   - 运行 `npm test` 保持 100% 通过。
2. **端到端与构建验证**：
   - 运行 `npm run build` 确保 Vite 打包与 TypeScript 零报错；
   - 在本地 `npm run preview` 测试页面交互、自动探测、快捷预设、复制以及夜间/浅色模式表现。
