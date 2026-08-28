import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';
import './OzonTools.css';

const SAMPLE_SIZE_TABLE = `Параметр \\ Размер | S | M | L | XL
Длина изделия (衣长) | 65 | 67 | 69 | 71
Обхват груди (полуобхват от проймы до проймы) (胸围（夹对夹度量）) | 108 | 112 | 116 | 120
Ширина плеч (肩宽) | 51 | 53 | 55 | 57
Длина рукава (袖长) | 54 | 55 | 56 | 57`;

/**
 * 国际尺码 -> 俄罗斯尺码标准对照表
 */
const INT_TO_RU_MAP = {
  'XXS': '40',
  'XS': '42',
  'S': '44',
  'M': '46',
  'L': '48',
  'XL': '50',
  'XXL': '52',
  '2XL': '52',
  'XXXL': '54',
  '3XL': '54',
  '4XL': '56'
};

/**
 * 常见服装测量维度映射标准 (自动净化中文和括号说明)
 */
const STANDARD_PARAMS = [
  { test: /(前衣长|前长|длина\s*спереди)/i, standard: 'Длина спереди, см' },
  { test: /(后衣长|后长|длина\s*сзади)/i, standard: 'Длина сзади, см' },
  { test: /(衣长|通长|длина\s*изделия)/i, standard: 'Длина изделия, см' },
  { test: /(领宽|领围|ширина\s*горловины)/i, standard: 'Ширина горловины, см' },
  { test: /(肩宽|ширина\s*плеч)/i, standard: 'Ширина плеч, см' },
  { test: /(胸围|обхват\s*груди)/i, standard: 'Обхват груди, см' },
  { test: /(夹直|直腋深|腋深|глубина\s*проймы)/i, standard: 'Глубина проймы по прямой, см' },
  { test: /(袖长|длина\s*рукава)/i, standard: 'Длина рукава, см' },
  { test: /(袖口围|袖口|обхват\s*манжеты)/i, standard: 'Обхват манжеты рукава, см' },
  { test: /(摆围|下摆围|下摆|底围|обхват\s*по\s*низу)/i, standard: 'Обхват по низу изделия, см' },
  { test: /(腰围|обхват\s*талии)/i, standard: 'Обхват талии, см' },
  { test: /(臀围|обхват\s*бедер|обхват\s*бёдер)/i, standard: 'Обхват бедер, см' },
  { test: /(裙长|длина\s*юбки)/i, standard: 'Длина юбки, см' },
  { test: /(裤长|длина\s*брюк)/i, standard: 'Длина брюк, см' },
  { test: /(大腿围|обхват\s*бедра)/i, standard: 'Обхват бедра, см' },
  { test: /(身高|рост)/i, standard: 'Рост, см' },
  { test: /(体重|вес)/i, standard: 'Вес, кг' }
];

/**
 * 净化并标准化行标签 (移除中文、去除多余括号说明，转为 Ozon 官方标准俄文)
 */
function cleanAndStandardizeLabel(rawLabel) {
  if (!rawLabel) return ['Параметр', ''];

  let first = rawLabel.trim();
  let sub = '';

  if (first.includes('//')) {
    const parts = first.split('//');
    first = parts[0].trim();
    sub = parts.slice(1).join('//').trim();
  }

  // 匹配已知标准参数名
  for (const item of STANDARD_PARAMS) {
    if (item.test.test(first)) {
      return [item.standard, ''];
    }
  }

  // 如果不在标准字典中，剔除所有中文字符和括号
  let cleaned = first
    .replace(/[\u4e00-\u9fa5]/g, '') // 剔除中文
    .replace(/\(.*?\)/g, '') // 剔除半角括号内容
    .replace(/（.*?）/g, '') // 剔除全角括号内容
    .replace(/[()（）]/g, '')
    .trim();

  // 移除多余尾部标点后自动补上 , см (如果不是 RU/INT)
  cleaned = cleaned.replace(/[,，\s]+$/, '');
  if (cleaned && !cleaned.toLowerCase().includes('см') && !['ru', 'int'].includes(cleaned.toLowerCase())) {
    cleaned += ', см';
  }

  return [cleaned || first, sub];
}

/**
 * 切分单行文本为单元格
 */
function splitLineIntoCells(line) {
  if (!line || !line.trim()) return [];
  const cleanLine = line.replace(/\u00A0/g, ' ').trim();

  if (cleanLine.includes('\t')) {
    return cleanLine.split('\t').map((c) => c.trim()).filter(Boolean);
  }
  if (cleanLine.includes('|')) {
    const parts = cleanLine.split('|').map((c) => c.trim());
    return parts.filter((c, idx) => {
      if ((idx === 0 || idx === parts.length - 1) && !c) return false;
      return true;
    });
  }
  if (/\s{2,}/.test(cleanLine)) {
    return cleanLine.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  }
  if (cleanLine.includes(',')) {
    return cleanLine.split(',').map((c) => c.trim()).filter(Boolean);
  }
  return [cleanLine];
}

/**
 * 解析并标准化尺码表
 */
function parseAndStandardizeSizeTable(rawText, autoFourSizes = true, autoStandardize = true) {
  if (!rawText.trim()) return { finalRows: [], detectedMode: '' };

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rawRows = [];

  for (let i = 0; i < lines.length; i++) {
    const cells = splitLineIntoCells(lines[i]);
    if (cells.length === 0) continue;

    // 跳过单列独立大标题
    if (cells.length === 1 && (cells[0].includes('Таблица') || cells[0].includes('размеров') || cells[0].includes('尺码'))) {
      continue;
    }

    const firstCell = cells[0];
    const values = cells.slice(1).map((v) => String(v).trim());

    rawRows.push({
      rawLabel: firstCell,
      values
    });
  }

  if (rawRows.length === 0) return { finalRows: [], detectedMode: '' };

  // 1. 寻找尺码基准行
  const KNOWN_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '42', '44', '46', '48', '50', '52', '54'];
  let headerRowIndex = 0;
  let maxScore = -1;

  rawRows.forEach((row, idx) => {
    let score = 0;
    const l = row.rawLabel.toUpperCase();
    if (l.includes('РАЗМЕР') || l.includes('INT') || l.includes('RU') || l.includes('尺码') || l.includes('SIZE')) {
      score += 5;
    }
    row.values.forEach((v) => {
      if (KNOWN_SIZES.includes(v.toUpperCase())) score += 3;
    });
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = idx;
    }
  });

  const headerRow = rawRows[headerRowIndex];
  const sizeList = headerRow.values.map((s) => s.toUpperCase());

  // 4 尺码过滤逻辑 (优先 M~XXL, 次选 S~XL)
  const targetGroup1 = ['M', 'L', 'XL', 'XXL'];
  const targetGroup2 = ['S', 'M', 'L', 'XL'];

  const hasGroup1 = targetGroup1.map((s) => sizeList.indexOf(s)).every((idx) => idx !== -1);
  const hasGroup2 = targetGroup2.map((s) => sizeList.indexOf(s)).every((idx) => idx !== -1);

  let targetIndices = [];
  let selectedSizes = [];
  let detectedMode = '';

  if (autoFourSizes) {
    if (hasGroup1) {
      targetIndices = targetGroup1.map((s) => sizeList.indexOf(s));
      selectedSizes = targetGroup1;
      detectedMode = '已标准化: M, L, XL, XXL (自动生成 RU + INT 双尺码)';
    } else if (hasGroup2) {
      targetIndices = targetGroup2.map((s) => sizeList.indexOf(s));
      selectedSizes = targetGroup2;
      detectedMode = '已标准化: S, M, L, XL (自动生成 RU + INT 双尺码)';
    } else {
      targetIndices = headerRow.values.length > 4 ? [0, 1, 2, 3] : headerRow.values.map((_, i) => i);
      selectedSizes = targetIndices.map((i) => headerRow.values[i].toUpperCase());
      detectedMode = `已保留 4 个尺码: ${selectedSizes.join(', ')}`;
    }
  } else {
    targetIndices = headerRow.values.map((_, i) => i);
    selectedSizes = headerRow.values.map((s) => s.toUpperCase());
    detectedMode = '保留原始所有尺码列';
  }

  // 构建最终标准行
  const finalRows = [];

  // 如果开启了自动标准化，且基准行是国际码（如 S, M, L, XL），自动生成 RU + INT 两行官方标准表头
  const isIntSizes = selectedSizes.every((s) => INT_TO_RU_MAP[s]);

  if (autoStandardize && isIntSizes) {
    // 1. RU 行
    finalRows.push({
      label: ['RU', 'Российский размер'],
      values: selectedSizes.map((s) => INT_TO_RU_MAP[s] || s)
    });
    // 2. INT 行
    finalRows.push({
      label: ['INT', 'Международный размер'],
      values: selectedSizes
    });
  }

  // 遍历所有数据行
  rawRows.forEach((row, idx) => {
    // 如果这一行是尺码代号行且已经自动生成了 RU+INT，则跳过原始尺码行
    if (idx === headerRowIndex && autoStandardize && isIntSizes) {
      return;
    }

    const label = autoStandardize ? cleanAndStandardizeLabel(row.rawLabel) : [row.rawLabel, ''];
    const values = targetIndices.map((i) => (row.values[i] !== undefined ? row.values[i] : ''));

    finalRows.push({
      label,
      values
    });
  });

  return { finalRows, detectedMode };
}

/**
 * 构建 Ozon 官方 tcTable JSON (100% 官方结构)
 */
function buildOzonSizeJson(rows) {
  if (!rows || rows.length === 0) return null;

  const body = rows.map((r) => ({
    data: [
      r.label,
      ...r.values
    ]
  }));

  return {
    content: [
      {
        widgetName: "tcTable",
        table: {
          title: "Название таблицы",
          body
        }
      }
    ],
    version: 0.1
  };
}

/**
 * Ozon 尺码表生成器页面
 */
export default function OzonSizeTable() {
  const [rawText, setRawText] = useState(SAMPLE_SIZE_TABLE);
  const [autoFourSizes, setAutoFourSizes] = useState(true);
  const [autoStandardize, setAutoStandardize] = useState(true);
  const [copied, setCopied] = useState(false);

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
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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
              <span>自动净化中文为纯俄文规范 (RU+INT)</span>
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
