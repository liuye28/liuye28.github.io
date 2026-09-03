import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { parseAndStandardizeSizeTable, buildOzonSizeJson } from '../../utils/ozonParser';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';
import './OzonTools.css';

const SAMPLE_SIZE_TABLE = `Параметр \\ Размер | S | M | L | XL
Длина изделия (衣长) | 65 | 67 | 69 | 71
Обхват груди (полуобхват от проймы до проймы) (胸围（夹对夹度量）) | 108 | 112 | 116 | 120
Ширина плеч (肩宽) | 51 | 53 | 55 | 57
Длина рукава (袖长) | 54 | 55 | 56 | 57`;

/**
 * Ozon 尺码表生成器页面
 */
export default function OzonSizeTable() {
  const [rawText, setRawText] = useState('');
  const [autoFourSizes, setAutoFourSizes] = useState(true);
  const [autoStandardize, setAutoStandardize] = useState(true);
  const [copied, copy] = useCopyToClipboard();

  // 解析并全自动净化标准化
  const { finalRows, detectedMode } = useMemo(() => {
    return parseAndStandardizeSizeTable(rawText, autoFourSizes, autoStandardize);
  }, [rawText, autoFourSizes, autoStandardize]);

  // 生成的标准 JSON
  const formattedJson = useMemo(() => {
    const jsonObj = buildOzonSizeJson(finalRows);
    return jsonObj ? JSON.stringify(jsonObj, null, 2) : '';
  }, [finalRows]);

  const handleCopy = () => {
    if (!formattedJson) return;
    copy(formattedJson);
  };

  const handleClear = () => {
    setRawText('');
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_SIZE_TABLE);
  };

  return (
    <ToolLayout
      title="Ozon 尺码表生成器"
      desc="支持直接粘贴带中文或杂质注释的尺码表，一键全自动净化中文、自动生成 RU/INT 对照行与官网标准纯俄文参数"
    >
      <div className="tool-section">
        <div className="tool-section-title">
          <span>尺码表数据输入与自动标准化</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoStandardize}
                onChange={() => setAutoStandardize(!autoStandardize)}
              />
              <span>自动净化中文 (RU+INT)</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoFourSizes}
                onChange={() => setAutoFourSizes(!autoFourSizes)}
              />
              <span>智能提取 4 个核心尺码</span>
            </label>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={handleLoadSample}
            >
              加载示例尺码表
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={handleClear}
              disabled={!rawText}
            >
              清空
            </button>
            <button
              type="button"
              className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
              onClick={handleCopy}
              disabled={!formattedJson}
            >
              {copied ? '✓ 已复制 JSON' : '复制 JSON 结果'}
            </button>
          </div>
        </div>

        <div className="tool-grid-2col">
          {/* 左侧：输入区域 */}
          <div className="tool-form-group">
            <label className="tool-form-label" htmlFor="size-table-raw">
              粘贴原始尺码表 (哪怕带中文或括号说明，工具都会自动清洗成官网标准)
            </label>
            <textarea
              id="size-table-raw"
              className="apple-textarea"
              rows={14}
              placeholder="例如直接粘贴:&#10;Параметр \\ Размер | S | M | L | XL&#10;Длина изделия (衣长) | 65 | 67 | 69 | 71&#10;Обхват груди (胸围) | 108 | 112 | 116 | 120&#10;Ширина плеч (肩宽) | 51 | 53 | 55 | 57&#10;Длина рукава (袖长) | 54 | 55 | 56 | 57"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              spellCheck="false"
            />
            <p className="tool-form-hint">
              💡 <strong>自动净化：</strong> 自动去除 <code>(衣长)</code>、<code>(夹对夹度量)</code> 等中文与杂质，自动生成 <code>RU (44-50)</code> 和 <code>INT (S-XL)</code> 双尺码对照行，100% 达到官网生成效果。
            </p>
          </div>

          {/* 右侧：实时生成的 JSON */}
          <div className="tool-form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <span className="tool-form-label" style={{ marginBottom: 0 }}>
                生成的 Ozon 尺码表 JSON (100% 官网纯净版)
              </span>
              {detectedMode && (
                <span className="apple-pill-badge" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
                  {detectedMode}
                </span>
              )}
            </div>
            <textarea
              className="apple-textarea"
              rows={14}
              value={formattedJson}
              readOnly
              placeholder="生成的 Ozon 尺码表 JSON 数据将实时展示在此处..."
              spellCheck="false"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: formattedJson ? 'var(--border-hover)' : 'var(--border-subtle)',
                fontSize: '0.825rem'
              }}
            />
          </div>
        </div>

        {/* 底部：HTML 可视化表格实时预览 */}
        {finalRows.length > 0 && (
          <div style={{ marginTop: '1.75rem' }}>
            <div className="tool-section-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              <span>HTML 表格可视化预览 (与官网 100% 一致的纯俄文标准)</span>
              <span className="apple-pill-badge">
                Название таблицы
              </span>
            </div>

            <div className="ozon-table-preview-wrapper">
              <div className="ozon-table-title">Название таблицы</div>
              <table className="ozon-preview-table">
                <tbody>
                  {finalRows.map((row, rIdx) => (
                    <tr key={rIdx} className="ozon-table-row">
                      <th className="ozon-row-label-cell">
                        <span className="ozon-main-label">{row.label[0]}</span>
                        {row.label[1] && <span className="ozon-sub-label">{row.label[1]}</span>}
                      </th>
                      {row.values.map((val, cIdx) => (
                        <td key={cIdx} className="ozon-val-cell">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
