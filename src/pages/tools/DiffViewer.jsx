import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

const SAMPLES = {
  json: {
    lang: 'json',
    original: `{
  "appName": "personWeb",
  "version": "1.0.0",
  "port": 3000,
  "features": [
    "site-nav",
    "ozon-tools",
    "json-formatter"
  ],
  "author": {
    "name": "Ly",
    "city": "Shenzhen"
  }
}`,
    modified: `{
  "appName": "personWeb",
  "version": "2.0.0",
  "port": 8080,
  "features": [
    "site-nav",
    "ozon-tools",
    "json-formatter",
    "sql-to-pojo",
    "diff-viewer"
  ],
  "author": {
    "name": "Ly",
    "city": "Shenzhen",
    "role": "Architect"
  }
}`
  },
  yaml: {
    lang: 'yaml',
    original: `server:
  port: 8080
spring:
  application:
    name: order-service
  datasource:
    url: jdbc:mysql://localhost:3306/db_order
    username: root
    password: dev_password
logging:
  level:
    root: INFO`,
    modified: `server:
  port: 8080
spring:
  application:
    name: order-service-prod
  datasource:
    url: jdbc:mysql://prod-mysql-cluster:3306/db_order?useSSL=true
    username: app_prod
    password: \${DB_PROD_PASSWORD}
logging:
  level:
    root: WARN
    com.example: INFO`
  }
};

/**
 * Monaco 代码与文本 Diff 对比器
 */
export default function DiffViewer() {
  const [original, setOriginal] = useState(SAMPLES.json.original);
  const [modified, setModified] = useState(SAMPLES.json.modified);
  const [language, setLanguage] = useState('json');
  const [sideBySide, setSideBySide] = useState(true);

  // 监听全站暗黑模式变化
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const handleMutation = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDark(dark);
    };
    const observer = new MutationObserver(handleMutation);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const handleSwap = () => {
    const temp = original;
    setOriginal(modified);
    setModified(temp);
  };

  const handleClear = () => {
    setOriginal('');
    setModified('');
  };

  const handleLoadSample = (key) => {
    setOriginal(SAMPLES[key].original);
    setModified(SAMPLES[key].modified);
    setLanguage(SAMPLES[key].lang);
  };

  return (
    <ToolLayout
      title="Monaco 文本与代码 Diff 对比器"
      desc="基于 VS Code Monaco Editor 内核，专业高亮对比两段文本、JSON 或配置文件的差异变更"
    >
      <section className="tool-section">
        <div className="tool-section-title">
          <span>对比控制与选项</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handleLoadSample('json')}
            >
              示例：JSON 配置
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => handleLoadSample('yaml')}
            >
              示例：Spring YAML 配置
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={handleSwap}
            >
              ⇄ 左右对调
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={handleClear}
            >
              清空内容
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="tool-form-label" style={{ marginBottom: 0 }}>高亮语言：</label>
            <select
              className="apple-input"
              style={{ width: '130px', padding: '0.35rem 0.65rem' }}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="java">Java</option>
              <option value="sql">SQL</option>
              <option value="javascript">JavaScript</option>
              <option value="xml">XML / HTML</option>
              <option value="plaintext">纯文本</option>
            </select>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sideBySide}
              onChange={(e) => setSideBySide(e.target.checked)}
            />
            <span>双栏对照显示 (取消勾选为单栏内联模式)</span>
          </label>
        </div>
      </section>

      {/* Monaco Diff 编辑器容器 */}
      <section className="tool-section" style={{ padding: '0.75rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.4rem 0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          <span>左侧：原始版本 (Original)</span>
          <span>右侧：修改后版本 (Modified)</span>
        </div>

        <div style={{ height: '550px', marginTop: '0.5rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <DiffEditor
            height="100%"
            language={language}
            original={original}
            modified={modified}
            theme={isDark ? 'vs-dark' : 'light'}
            options={{
              renderSideBySide: sideBySide,
              readOnly: false,
              originalEditable: true,
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}
          />
        </div>
      </section>
    </ToolLayout>
  );
}
