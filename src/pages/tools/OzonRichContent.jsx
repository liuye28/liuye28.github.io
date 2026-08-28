import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
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
 * 已知标准大标题白名单 (自动优先命中)
 */
const KNOWN_HEADERS = [
  'дизайн и концепция',
  'посадка и тепло',
  'комфорт и функциональность',
  'детали и посадка',
  'с чем сочетать',
  'идеи для стилизации',
  'назначение',
  'материал и уход',
  'особенности',
  'преимущества',
  'стиль и образ',
  'крой и силуэт',
  'качество и уход',
  'детали'
];

/**
 * 判断某一行是否是真正的“卖点大标题”
 */
function isMajorSectionHeader(line) {
  if (!line) return false;
  const trimmed = line.trim();

  // 1. 包含中文的提示行排除
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    return false;
  }

  // 2. 以列表符号或序号开头 (◦, 。, •, -, *, 1., 2. 等) 坚决属于正文子项
  if (/^[。•·\-*◦oO\d]+[\.\)、\s]/.test(trimmed) || /^[。•·\-*◦]/.test(trimmed)) {
    return false;
  }

  // 3. 必须包含英文冒号
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) return false;

  const headerPrefix = trimmed.substring(0, colonIdx).trim().toLowerCase();

  // 4. 白名单标准大标题直接命中 (如 "С чем сочетать:", "Посадка и тепло:" 等)
  if (KNOWN_HEADERS.includes(headerPrefix)) {
    return true;
  }

  // 5. 冒号必须在前 35 个字符内
  if (colonIdx > 35) return false;

  // 6. 如果整行就是独立的 "大标题:" (冒号后无文字或文字很短)，必定为大标题
  const afterColon = trimmed.substring(colonIdx + 1).trim();
  if (!afterColon) {
    return true;
  }

  // 7. 如果冒号后紧跟长句说明 (如 "В холодную погоду: отлично смотрится...")，属于子项说明，不是大标题
  if (afterColon.length > 25) {
    return false;
  }

  return true;
}

/**
 * 智能解析原始卖点文本为区块列表
 */
function parseRawTextToBlocks(rawText) {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const blocks = [];
  let currentBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 跳过纯中文提示行
    if (/^(中文翻译|俄文|富内容|rich-контент|структурированное описание)/i.test(trimmed)) {
      continue;
    }

    // 检查是否是大标题行
    if (isMajorSectionHeader(trimmed)) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }

      const colonIdx = line.indexOf(':');
      const title = line.substring(0, colonIdx + 1).trim();
      const remaining = line.substring(colonIdx + 1).trim();

      currentBlock = {
        title,
        textLines: remaining ? [remaining] : []
      };
    } else {
      if (currentBlock) {
        currentBlock.textLines.push(line);
      } else {
        if (trimmed && !/[\u4e00-\u9fa5]/.test(trimmed)) {
          currentBlock = {
            title: '',
            textLines: [line]
          };
        }
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks
    .map((b) => ({
      title: b.title,
      text: b.textLines.join('\n').trim()
    }))
    .filter((b) => b.title.trim() || b.text.trim());
}

/**
 * 将正文文本转换为 Ozon 官方标准的 items 数组 (支持 {"type": "br"} 换行)
 */
function buildTextItems(text) {
  if (!text || !text.trim()) return [];

  const normalized = text.replace(/\r\n/g, '\n');

  if (normalized.includes('\n')) {
    const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    if (paragraphs.length > 1) {
      const items = [];
      paragraphs.forEach((p, pIdx) => {
        const subLines = p.split('\n').map((s) => s.trim()).filter(Boolean);
        subLines.forEach((sub, sIdx) => {
          items.push({
            type: "text",
            content: sub
          });
          if (sIdx < subLines.length - 1) {
            items.push({ type: "br" });
          }
        });

        // 两个段落之间插入两个 br (与 Ozon 官网完全一致)
        if (pIdx < paragraphs.length - 1) {
          items.push({ type: "br" });
          items.push({ type: "br" });
        }
      });
      return items;
    } else {
      // 单段内部单行换行
      const lines = normalized.split('\n').map((s) => s.trim()).filter(Boolean);
      const items = [];
      lines.forEach((l, lIdx) => {
        items.push({
          type: "text",
          content: l
        });
        if (lIdx < lines.length - 1) {
          items.push({ type: "br" });
          items.push({ type: "br" });
        }
      });
      return items;
    }
  }

  return [
    {
      type: "text",
      content: text.trim()
    }
  ];
}

/**
 * 根据区块列表构建 Ozon 富内容标准 JSON 对象 (100% 匹配官方富内容编辑器格式)
 */
function buildOzonRichJson(blocks) {
  if (!blocks || blocks.length === 0) return null;

  const content = blocks
    .filter((b) => b.title.trim() || b.text.trim())
    .map((b) => {
      const blockObj = {
        widgetName: "raTextBlock"
      };

      // 标题结构
      if (b.title.trim()) {
        blockObj.title = {
          items: [
            {
              type: "text",
              content: b.title.trim()
            }
          ],
          size: "size5",
          color: "color1"
        };
      }

      // 官方固定枚举属性
      blockObj.theme = "primary";
      blockObj.padding = "type2";
      blockObj.gapSize = "m";

      // 正文 items 结构 (支持 br 换行)
      blockObj.text = {
        size: "size2",
        align: "left",
        color: "color1",
        items: buildTextItems(b.text)
      };

      return blockObj;
    });

  if (content.length === 0) return null;

  return {
    content,
    version: 0.3
  };
}

/**
 * Ozon 富内容生成器页面
 */
export default function OzonRichContent() {
  const [rawText, setRawText] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [copied, setCopied] = useState(false);

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
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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
