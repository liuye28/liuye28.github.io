/**
 * Ozon 跨境电商平台数据转换与标准化解析工具库
 *
 * 包含：
 * 1. 尺码表 (Size Table)：俄码/国际码/超大码双向推导、测量维度官方俄文标准化、多行多列文本解析、智能优选 4 尺码、官方 tcTable JSON 构建
 * 2. 富内容 (Rich Content)：大标题识别过滤、富文本分段与 <br> 换行标准化、官方 raTextBlock JSON 构建
 */

/* ==========================================================================
   一、Ozon 尺码表 (Size Table) 解析与标准化
   ========================================================================== */

/**
 * 国际尺码 / 别名 -> 俄罗斯尺码标准基础对照表（包含大码、超大码与各种别名）
 */
export const BASE_INT_TO_RU_MAP = {
  // 小码 / 超小码
  '5XS': '34',
  'XXXXXS': '34',
  '4XS': '36',
  'XXXXS': '36',
  '3XS': '38',
  'XXXS': '38',
  '2XS': '40',
  'XXS': '40',
  'XS': '42',
  'S': '44',
  'M': '46',
  'L': '48',
  // 大码 / 超大码（支持 XL/1XL/1X 到 15XL/15X）
  'XL': '50',
  '1XL': '50',
  '1X': '50',
  'XXL': '52',
  '2XL': '52',
  '2X': '52',
  'XXXL': '54',
  '3XL': '54',
  '3X': '54',
  'XXXXL': '56',
  '4XL': '56',
  '4X': '56',
  'XXXXXL': '58',
  '5XL': '58',
  '5X': '58',
  'XXXXXXL': '60',
  '6XL': '60',
  '6X': '60',
  '7XL': '62',
  '7X': '62',
  '8XL': '64',
  '8X': '64',
  '9XL': '66',
  '9X': '66',
  '10XL': '68',
  '10X': '68',
  '11XL': '70',
  '11X': '70',
  '12XL': '72',
  '12X': '72',
  '13XL': '74',
  '13X': '74',
  '14XL': '76',
  '14X': '76',
  '15XL': '78',
  '15X': '78'
};

/**
 * 动态根据国际尺码获取俄罗斯尺码 (支持任意大码如 1XL-20XL, 1X-20X, XXXXL 等)
 *
 * @param {string} sizeStr 国际码字符串
 * @returns {string|null} 俄罗斯对应尺码
 */
export function getRuSizeFromInt(sizeStr) {
  if (!sizeStr) return null;
  const s = String(sizeStr).trim().toUpperCase();
  if (BASE_INT_TO_RU_MAP[s]) {
    return BASE_INT_TO_RU_MAP[s];
  }
  // 匹配 NxL / Nx (例如 16XL, 20XL, 16X 等)
  const nxlMatch = s.match(/^(\d+)X[L]?$/);
  if (nxlMatch) {
    const n = parseInt(nxlMatch[1], 10);
    if (n >= 1) {
      return String(50 + (n - 1) * 2);
    }
  }
  // 匹配连续 X + L (如 XXXXXXXL)
  const multiXMatch = s.match(/^(X+)L$/);
  if (multiXMatch) {
    const count = multiXMatch[1].length;
    return String(50 + (count - 1) * 2);
  }
  // 匹配连续 X + S (如 XXXS)
  const multiXsMatch = s.match(/^(X+)S$/);
  if (multiXsMatch) {
    const count = multiXsMatch[1].length;
    return String(44 - count * 2);
  }
  return null;
}

/**
 * 俄罗斯尺码 -> 国际码对照与动态推导
 *
 * @param {string|number} sizeStr 俄罗斯数字码
 * @returns {string|null} 国际对应尺码
 */
export function getIntSizeFromRu(sizeStr) {
  if (!sizeStr) return null;
  const s = String(sizeStr).trim();
  const num = parseInt(s, 10);
  if (isNaN(num)) return null;

  const RU_TO_INT_DIRECT = {
    34: '5XS',
    36: '4XS',
    38: '3XS',
    40: 'XXS',
    42: 'XS',
    44: 'S',
    46: 'M',
    48: 'L',
    50: 'XL',
    52: '2XL',
    54: '3XL',
    56: '4XL',
    58: '5XL',
    60: '6XL',
    62: '7XL',
    64: '8XL',
    66: '9XL',
    68: '10XL',
    70: '11XL',
    72: '12XL',
    74: '13XL',
    76: '14XL',
    78: '15XL'
  };

  if (RU_TO_INT_DIRECT[num]) {
    return RU_TO_INT_DIRECT[num];
  }
  if (num > 78 && num % 2 === 0) {
    const n = Math.floor((num - 50) / 2) + 1;
    return `${n}XL`;
  }
  return null;
}

/**
 * 校验是否为已知尺码 token
 *
 * @param {string} sizeStr 尺码 token
 * @returns {boolean}
 */
export function isRecognizedSize(sizeStr) {
  if (!sizeStr) return false;
  return Boolean(getRuSizeFromInt(sizeStr) || getIntSizeFromRu(sizeStr));
}

/**
 * 常见服装测量维度映射标准 (自动净化中文和括号说明)
 */
export const STANDARD_PARAMS = [
  { test: /(前衣长|前长|длина\s*спереди)/i, standard: 'Длина спереди, см' },
  { test: /(后衣长|后长|длина\s*сзади)/i, standard: 'Длина сзади, см' },
  { test: /(衣长|通长|总长|длина\s*изделия)/i, standard: 'Длина изделия, см' },
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
  { test: /(脚口|裤脚|裤口|обхват\s*штанины|низ\s*брюк)/i, standard: 'Обхват низа брючины, см' },
  { test: /(档长|前裆|后裆|высота\s*посадки)/i, standard: 'Высота посадки, см' },
  { test: /(克重|面料克重|плотность)/i, standard: 'Плотность, г/м²' },
  { test: /(身高|рост)/i, standard: 'Рост, см' },
  { test: /(体重|вес)/i, standard: 'Вес, кг' }
];

/**
 * 净化并标准化行标签 (移除中文、去除多余括号说明，转为 Ozon 官方标准俄文)
 *
 * @param {string} rawLabel 原始测量名
 * @returns {[string, string]} [主标题, 副标题]
 */
export function cleanAndStandardizeLabel(rawLabel) {
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

  // 如果不在标准字典中，剔除所有中文字符和嵌套括号
  let cleaned = first
    .replace(/[\u4e00-\u9fa5]/g, '') // 剔除中文
    .replace(/（[^（）]*）/g, '') // 剔除全角括号
    .replace(/\([^()]*\)/g, '') // 剔除半角括号
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
 *
 * @param {string} line 单行文本
 * @returns {Array<string>}
 */
export function splitLineIntoCells(line) {
  if (!line || !line.trim()) return [];
  const cleanLine = line.replace(/\u00A0/g, ' ').trim();

  if (cleanLine.includes('\t')) {
    return cleanLine.split('\t').map((c) => c.trim());
  }
  if (cleanLine.includes('|')) {
    const parts = cleanLine.split('|').map((c) => c.trim());
    if (parts.length > 0 && parts[0] === '') {
      parts.shift();
    }
    if (parts.length > 0 && parts[parts.length - 1] === '') {
      parts.pop();
    }
    return parts;
  }
  if (/\s{2,}/.test(cleanLine)) {
    return cleanLine.split(/\s{2,}/).map((c) => c.trim());
  }
  if (cleanLine.includes(',')) {
    return cleanLine.split(',').map((c) => c.trim());
  }
  return [cleanLine];
}

/**
 * 解析并标准化尺码表核心纯函数
 *
 * @param {string} rawText 用户输入的原始尺码表文本
 * @param {boolean} [autoFourSizes=true] 是否自动优选 4 个核心尺码
 * @param {boolean} [autoStandardize=true] 是否自动净化中文并生成 RU+INT 双行对照
 * @returns {{ finalRows: Array<{ label: [string, string], values: Array<string> }>, detectedMode: string }}
 */
export function parseAndStandardizeSizeTable(rawText, autoFourSizes = true, autoStandardize = true) {
  if (!rawText || !rawText.trim()) return { finalRows: [], detectedMode: '' };

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
  let headerRowIndex = 0;
  let maxScore = -1;

  rawRows.forEach((row, idx) => {
    let score = 0;
    const l = row.rawLabel.toUpperCase();
    if (l.includes('РАЗМЕР') || l.includes('INT') || l.includes('RU') || l.includes('尺码') || l.includes('SIZE') || l.includes('码数') || l.includes('位置')) {
      score += 5;
    }
    row.values.forEach((v) => {
      if (isRecognizedSize(v)) score += 3;
    });
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = idx;
    }
  });

  const headerRow = rawRows[headerRowIndex];
  const sizeList = headerRow.values.map((s) => s.toUpperCase());
  const dataRows = rawRows.filter((_, idx) => idx !== headerRowIndex);

  // 对齐数据行长度，避免越界访问为 undefined
  dataRows.forEach((row) => {
    while (row.values.length < headerRow.values.length) {
      row.values.push('');
    }
  });

  let targetIndices = [];
  let selectedSizes = [];
  let detectedMode = '';

  // 4 尺码智能优选逻辑（基于数据行的实际填充率与完整度）
  if (autoFourSizes && sizeList.length > 4) {
    const candidateGroups = [];

    // 预设常见标准 4 尺码组（包含常规码与常见大码组）
    const PRESET_GROUPS = [
      { sizes: ['M', 'L', 'XL', 'XXL'], bonus: 0.2 },
      { sizes: ['S', 'M', 'L', 'XL'], bonus: 0.15 },
      { sizes: ['L', 'XL', '2XL', '3XL'], bonus: 0.13 },
      { sizes: ['XL', '2XL', '3XL', '4XL'], bonus: 0.12 },
      { sizes: ['1XL', '2XL', '3XL', '4XL'], bonus: 0.12 },
      { sizes: ['2XL', '3XL', '4XL', '5XL'], bonus: 0.11 },
      { sizes: ['3XL', '4XL', '5XL', '6XL'], bonus: 0.1 },
      { sizes: ['L', 'XL', 'XXL', 'XXXL'], bonus: 0.1 },
      { sizes: ['XS', 'S', 'M', 'L'], bonus: 0.05 },
      { sizes: ['46', '48', '50', '52'], bonus: 0.15 },
      { sizes: ['48', '50', '52', '54'], bonus: 0.13 },
      { sizes: ['50', '52', '54', '56'], bonus: 0.12 },
      { sizes: ['52', '54', '56', '58'], bonus: 0.11 }
    ];

    PRESET_GROUPS.forEach((preset) => {
      const indices = preset.sizes.map((s) => sizeList.indexOf(s));
      if (indices.every((idx) => idx !== -1)) {
        candidateGroups.push({
          indices,
          sizes: preset.sizes,
          bonus: preset.bonus
        });
      }
    });

    // 滑动窗口：所有连续 4 尺码窗口
    for (let i = 0; i <= sizeList.length - 4; i++) {
      const indices = [i, i + 1, i + 2, i + 3];
      const sizes = indices.map((idx) => sizeList[idx]);
      const alreadyExists = candidateGroups.some((c) => c.indices.join(',') === indices.join(','));
      if (!alreadyExists) {
        candidateGroups.push({
          indices,
          sizes,
          bonus: 0
        });
      }
    }

    // 计算各候选组的有效数据填充率
    let bestCandidate = null;
    let highestScore = -1;

    candidateGroups.forEach((cand) => {
      let validCount = 0;
      dataRows.forEach((row) => {
        cand.indices.forEach((colIdx) => {
          const val = row.values[colIdx];
          if (val !== undefined && val !== '' && val !== null) {
            validCount++;
          }
        });
      });

      const totalScore = validCount + (cand.bonus || 0);
      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestCandidate = cand;
      }
    });

    if (bestCandidate) {
      targetIndices = bestCandidate.indices;
      selectedSizes = targetIndices.map((i) => headerRow.values[i].toUpperCase());
      detectedMode = `智能优选 4 尺码: ${selectedSizes.join(', ')} (数据完整度最高)`;
    } else {
      targetIndices = [0, 1, 2, 3];
      selectedSizes = targetIndices.map((i) => headerRow.values[i].toUpperCase());
      detectedMode = `已保留 4 个尺码: ${selectedSizes.join(', ')}`;
    }
  } else {
    targetIndices = headerRow.values.map((_, i) => i);
    selectedSizes = headerRow.values.map((s) => s.toUpperCase());
    detectedMode = sizeList.length <= 4 
      ? `已识别 ${sizeList.length} 个尺码: ${selectedSizes.join(', ')}` 
      : `保留全部 ${sizeList.length} 个尺码: ${selectedSizes.join(', ')}`;
  }

  // 构建最终标准行
  const finalRows = [];

  // 判断选中的尺码类型：
  // 1. 全部为国际码或大码别名（如 S, M, L, XL, 1XL, 2XL, 3XL, 4XL 等）
  const allCanMapToRu = selectedSizes.length > 0 && selectedSizes.every((s) => Boolean(getRuSizeFromInt(s)));
  // 2. 全部为俄罗斯数字码（如 44, 46, 48, 50, 52, 54, 56 等）
  const allCanMapToInt = selectedSizes.length > 0 && selectedSizes.every((s) => Boolean(getIntSizeFromRu(s)));

  const hasStandardizedHeader = autoStandardize && (allCanMapToRu || allCanMapToInt);

  if (hasStandardizedHeader) {
    if (allCanMapToRu) {
      // 1. RU 行
      finalRows.push({
        label: ['RU', 'Российский размер'],
        values: selectedSizes.map((s) => getRuSizeFromInt(s) || s)
      });
      // 2. INT 行
      finalRows.push({
        label: ['INT', 'Международный размер'],
        values: selectedSizes
      });
    } else if (allCanMapToInt) {
      // 1. RU 行
      finalRows.push({
        label: ['RU', 'Российский размер'],
        values: selectedSizes
      });
      // 2. INT 行
      finalRows.push({
        label: ['INT', 'Международный размер'],
        values: selectedSizes.map((s) => getIntSizeFromRu(s) || s)
      });
    }
  }

  // 遍历所有数据行
  rawRows.forEach((row, idx) => {
    // 如果这一行是尺码代号行且已经自动生成了 RU+INT，则跳过原始尺码行
    if (idx === headerRowIndex && hasStandardizedHeader) {
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
 *
 * @param {Array<{ label: [string, string], values: Array<string> }>} rows 标准化行列表
 * @returns {object|null}
 */
export function buildOzonSizeJson(rows) {
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


/* ==========================================================================
   二、Ozon 富内容 (Rich Content) 解析与构建
   ========================================================================== */

/**
 * 已知标准大标题白名单 (自动优先命中)
 */
export const KNOWN_HEADERS = [
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
 *
 * @param {string} line 文本行
 * @returns {boolean}
 */
export function isMajorSectionHeader(line) {
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
 *
 * @param {string} rawText 原始俄文卖点文本
 * @returns {Array<{ title: string, text: string }>}
 */
export function parseRawTextToBlocks(rawText) {
  if (!rawText || !rawText.trim()) return [];

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
 *
 * @param {string} text 正文纯文本
 * @returns {Array<{ type: string, content?: string }>}
 */
export function buildTextItems(text) {
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
 *
 * @param {Array<{ title: string, text: string }>} blocks 区块列表
 * @returns {object|null}
 */
export function buildOzonRichJson(blocks) {
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
