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
