import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { generateJavaFromJson } from '../../utils/jsonToJava';
import './ToolsCommon.css';


// 经典预设 JSON 示例
const SAMPLES = {
  user: `{
  "user_id": 10086,
  "username": "developer_ly",
  "email": "ly@example.com",
  "is_active": true,
  "balance": 999.85,
  "roles": ["ADMIN", "DEVELOPER"],
  "profile": {
    "nickname": "阿光",
    "avatar_url": "https://example.com/avatar.png",
    "age": 28,
    "last_login_ip": "192.168.1.1"
  }
}`,
  page: `{
  "code": 200,
  "message": "success",
  "data": {
    "total": 128,
    "page_num": 1,
    "page_size": 20,
    "records": [
      {
        "id": 1,
        "title": "Spring Boot 核心架构深度解析",
        "view_count": 5200,
        "is_published": true,
        "created_at": "2026-09-03 10:00:00"
      }
    ]
  }
}`,
  order: `{
  "order_sn": "ORD20260903001",
  "buyer_id": 2048,
  "total_amount": 359.00,
  "pay_status": "PAID",
  "items": [
    {
      "sku_id": "SKU-99881",
      "goods_name": "Apple HIG 极简无线机械键盘",
      "quantity": 1,
      "price": 359.00
    }
  ],
  "shipping_address": {
    "receiver": "张三",
    "phone": "13800138000",
    "province": "广东省",
    "city": "深圳市",
    "detail": "南山区科技园南区"
  }
}`
};

/**
 * JSON 转 Java POJO / Lombok 实体类生成器
 */
export default function JsonToJava() {
  const [inputJson, setInputJson] = useState(SAMPLES.user);
  const [packageName, setPackageName] = useState('com.example.dto');
  const [rootClassName, setRootClassName] = useState('UserDto');
  const [useData, setUseData] = useState(true);
  const [useBuilder, setUseBuilder] = useState(true);
  const [useNoArgsConstructor, setUseNoArgsConstructor] = useState(true);
  const [useAllArgsConstructor, setUseAllArgsConstructor] = useState(true);
  const [useJsonProperty, setUseJsonProperty] = useState(true);
  const [useBigDecimal, setUseBigDecimal] = useState(false);
  const [useSerializable, setUseSerializable] = useState(false);
  const [copied, setCopied] = useState(false);

  // 代码生成计算引擎（抽离至 utils/jsonToJava.js）
  const { javaCode, error, stats } = useMemo(() => {
    return generateJavaFromJson(inputJson, {
      packageName,
      rootClassName,
      useData,
      useBuilder,
      useNoArgsConstructor,
      useAllArgsConstructor,
      useJsonProperty,
      useBigDecimal,
      useSerializable
    });
  }, [
    inputJson,
    packageName,
    rootClassName,
    useData,
    useBuilder,
    useNoArgsConstructor,
    useAllArgsConstructor,
    useJsonProperty,
    useBigDecimal,
    useSerializable
  ]);

  const handleCopy = () => {
    if (!javaCode) return;
    navigator.clipboard.writeText(javaCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(inputJson);
      setInputJson(JSON.stringify(parsed, null, 2));
    } catch {
      // 忽略无法解析的错误
    }
  };

  const handleLoadPreset = (key, defaultClassName) => {
    setInputJson(SAMPLES[key]);
    setRootClassName(defaultClassName);
  };

  return (
    <ToolLayout
      title="JSON 转 Java POJO / Lombok 实体类"
      desc="零后端在浏览器端纯内存解析 JSON，一键生成规范的 Java DTO 类，支持 Lombok、Jackson 注解与嵌套类"
    >
      {/* 顶部配置栏 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <span>生成选项配置</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handleLoadPreset('user', 'UserDto')}
            >
              示例：用户资料
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handleLoadPreset('page', 'PageResultDto')}
            >
              示例：通用分页
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handleLoadPreset('order', 'OrderDto')}
            >
              示例：电商订单
            </button>
          </div>
        </div>

        <div className="tool-grid-2col" style={{ marginBottom: '1rem' }}>
          <div className="tool-form-group">
            <label className="tool-form-label">Java 包名 (Package)</label>
            <input
              type="text"
              className="apple-input"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="例如 com.example.dto"
            />
          </div>
          <div className="tool-form-group">
            <label className="tool-form-label">根类名称 (Root Class Name)</label>
            <input
              type="text"
              className="apple-input"
              value={rootClassName}
              onChange={(e) => setRootClassName(e.target.value)}
              placeholder="例如 ApiResponseDto"
            />
          </div>
        </div>

        {/* 胶囊开关栏 */}
        <div className="tool-form-label" style={{ marginBottom: '0.6rem' }}>
          代码注解与修饰符控制
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useData}
              onChange={(e) => setUseData(e.target.checked)}
            />
            <span>@Data</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useBuilder}
              onChange={(e) => setUseBuilder(e.target.checked)}
            />
            <span>@Builder</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useNoArgsConstructor}
              onChange={(e) => setUseNoArgsConstructor(e.target.checked)}
            />
            <span>@NoArgsConstructor</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useAllArgsConstructor}
              onChange={(e) => setUseAllArgsConstructor(e.target.checked)}
            />
            <span>@AllArgsConstructor</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useJsonProperty}
              onChange={(e) => setUseJsonProperty(e.target.checked)}
            />
            <span>Jackson @JsonProperty</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useBigDecimal}
              onChange={(e) => setUseBigDecimal(e.target.checked)}
            />
            <span>浮点数转 BigDecimal</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useSerializable}
              onChange={(e) => setUseSerializable(e.target.checked)}
            />
            <span>实现 Serializable</span>
          </label>
        </div>
      </section>

      {/* 双栏工作区 */}
      <div className="tool-grid-2col">
        {/* 左侧：JSON 输入 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>原始 JSON 输入</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="apple-btn apple-btn-secondary apple-btn-sm"
                onClick={handleFormatJson}
              >
                格式化 JSON
              </button>
              <button
                type="button"
                className="apple-btn apple-btn-ghost apple-btn-sm"
                onClick={() => setInputJson('')}
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            className="apple-textarea"
            style={{
              height: '460px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              lineHeight: '1.5'
            }}
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="请在此粘贴或输入 JSON 数据..."
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
        </section>

        {/* 右侧：Java 输出 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Java POJO 代码预览</span>
              {stats && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  ({stats.classes} 个类 · {stats.fields} 个字段 · {stats.lines} 行)
                </span>
              )}
            </div>
            <button
              type="button"
              className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
              onClick={handleCopy}
              disabled={!javaCode}
            >
              {copied ? '✓ 已复制源码' : '复制 Java 源码'}
            </button>
          </div>

          <textarea
            readOnly
            className="apple-textarea"
            style={{
              height: '460px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              backgroundColor: 'var(--bg-surface-secondary)',
              color: 'var(--text-primary)'
            }}
            value={javaCode || '// 输入合法 JSON 后将在此自动生成 Java 代码'}
          />
        </section>
      </div>
    </ToolLayout>
  );
}
