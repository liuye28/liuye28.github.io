import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { parseRawTextToBlocks, buildOzonRichJson } from '../../utils/ozonParser';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';
import './OzonTools.css';

const SAMPLE_RICH_TEXT = `Дизайн и концепция:
Креативное сочетание уличной моды и уютной эстетики. Контрастный анималистичный принт с силуэтами кошек и выразительными глазами на пушистом трикотаже привлекает внимание и поднимает настроение, формируя яркий образ в стиле y2k.

Посадка и тепло:
Плотное ворсистое полотно обеспечивает надежную защиту от ветра в осенне-зимний период. Свободный силуэт оверсайз дарит комфорт и позволяет легко надевать свитер поверх базовых футболок или лонгсливов.

С чем сочетать:

◦ С прямыми черными джинсами и белыми кожаными кедами для создания лаконичного контрастного аутфита.

◦ Со свободными брюками карго и массивными ботинками для расслабленного уличного стиля.

◦ В холодную погоду: отлично смотрится под оверсайз-пуховиком, дубленкой или длинным пальто.

Назначение:
Универсальный теплый трикотаж для сезона осень, зима и ранняя весна. Подходит для повседневной носки, прогулок по городу, кафе, учебы и создания трендового контента.`;

/**
 * Ozon 富内容生成器页面
 */
export default function OzonRichContent() {
  const [rawText, setRawText] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [copied, copy] = useCopyToClipboard();

  // 当原始文本改变时，重新解析同步 blocks
  const handleRawTextChange = (val) => {
    setRawText(val);
    setBlocks(parseRawTextToBlocks(val));
  };

  // 生成的最终 JSON 文本
  const formattedJson = useMemo(() => {
    const jsonObj = buildOzonRichJson(blocks);
    return jsonObj ? JSON.stringify(jsonObj, null, 2) : '';
  }, [blocks]);

  const handleCopy = () => {
    if (!formattedJson) return;
    copy(formattedJson);
  };

  const handleClear = () => {
    setRawText('');
    setBlocks([]);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_RICH_TEXT);
    setBlocks(parseRawTextToBlocks(SAMPLE_RICH_TEXT));
  };

  // 微调单个区块
  const updateBlock = (index, field, value) => {
    const next = [...blocks];
    next[index] = { ...next[index], [field]: value };
    setBlocks(next);
  };

  // 删除某个区块
  const deleteBlock = (index) => {
    const next = blocks.filter((_, i) => i !== index);
    setBlocks(next);
  };

  // 新增空白区块
  const addBlock = () => {
    setBlocks([...blocks, { title: '', text: '' }]);
  };

  return (
    <ToolLayout
      title="Ozon 富内容生成器"
      desc="粘贴翻译好的俄文卖点文案，精准识别 4 大核心卖点（包括 С чем сочетать 搭配建议），生成官方 JSON"
    >
      <div className="tool-section">
        <div className="tool-section-title">
          <span>文案输入与参数设置</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={handleLoadSample}
            >
              加载示例文案
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={handleClear}
              disabled={!rawText && blocks.length === 0}
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
          {/* 左侧：原始文案输入 + 区块微调 */}
          <div>
            <div className="tool-form-group">
              <label className="tool-form-label" htmlFor="rich-raw-text">
                粘贴俄文卖点文本 (支持带有列表圆点 ◦、子项冒号的复杂文案)
              </label>
              <textarea
                id="rich-raw-text"
                className="apple-textarea"
                rows={11}
                placeholder="在此粘贴包含 4 个卖点的俄文文本..."
                value={rawText}
                onChange={(e) => handleRawTextChange(e.target.value)}
                spellCheck="false"
              />
              <p className="tool-form-hint">
                💡 <strong>智能精准识别：</strong> 自动支持 <code>С чем сочетать:</code>、<code>Посадка и тепло:</code> 等所有标准卖点大标题，精准提取 4 大核心卖点！
              </p>
            </div>

            {/* 解析后的区块微调列表 */}
            {blocks.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span className="tool-form-label" style={{ marginBottom: 0 }}>
                    区块微调 ({blocks.length} 个卖点区块)
                  </span>
                  <button
                    type="button"
                    className="apple-btn apple-btn-secondary apple-btn-sm"
                    onClick={addBlock}
                  >
                    + 添加新区块
                  </button>
                </div>

                {blocks.map((block, idx) => (
                  <div key={idx} className="ozon-block-card">
                    <div className="ozon-block-card-header">
                      <span className="ozon-block-index">区块 #{idx + 1}</span>
                      <button
                        type="button"
                        className="ozon-block-delete-btn"
                        onClick={() => deleteBlock(idx)}
                        title="删除此区块"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>删除</span>
                      </button>
                    </div>

                    <div style={{ marginBottom: '0.6rem' }}>
                      <input
                        type="text"
                        className="apple-input"
                        style={{ height: '34px', fontSize: '0.875rem' }}
                        placeholder="区块标题 (如: Дизайн и концепция:)"
                        value={block.title}
                        onChange={(e) => updateBlock(idx, 'title', e.target.value)}
                        spellCheck="false"
                      />
                    </div>

                    <div>
                      <textarea
                        className="apple-textarea"
                        rows={4}
                        style={{ fontSize: '0.85rem' }}
                        placeholder="区块正文描述内容 (包含多行或子项)..."
                        value={block.text}
                        onChange={(e) => updateBlock(idx, 'text', e.target.value)}
                        spellCheck="false"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：实时 JSON 输出预览 */}
          <div className="tool-form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <span className="tool-form-label" style={{ marginBottom: 0 }}>
                生成的 Ozon 富内容 JSON (Version 0.3)
              </span>
              {blocks.length > 0 && (
                <span className="apple-pill-badge" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
                  {blocks.length} 个 raTextBlock
                </span>
              )}
            </div>
            <textarea
              className="apple-textarea"
              rows={22}
              value={formattedJson}
              readOnly
              placeholder="生成的 Ozon 富内容 JSON 数据将实时展示在此处..."
              spellCheck="false"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: formattedJson ? 'var(--border-hover)' : 'var(--border-subtle)',
                fontSize: '0.825rem'
              }}
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
