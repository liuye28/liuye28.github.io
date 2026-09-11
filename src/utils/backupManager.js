/**
 * 全局数据管理与备份管理器 (backupManager)
 *
 * 核心职责：
 * 1. 站内受管数据命名空间注册与识别 (便签、代码板草稿、主题外观偏好)
 * 2. 存储容量分析与精确字节计量 (Storage Inspector)
 * 3. 标准快照 Snapshot v1.0 生成与下载 (导出 JSON)
 * 4. 外部快照结构与版本安全校验 (导入前预检)
 * 5. 数据覆盖与智能合并导入执行
 * 6. 单模块清空与出厂重置安全擦除
 */

import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetJSON,
  safeSetJSON
} from './storage.js';

export const BACKUP_SCHEMA_VERSION = '1.0.0';
export const APP_NAME = "Ly's Workspace";

/**
 * 受管数据模块注册表
 */
export const DATA_MODULES = [
  {
    id: 'scratchpad',
    name: '便签备忘录',
    icon: '📝',
    color: '#34c759', // Apple Green
    matchKey: (key) => key === 'local_scratchpad_notes',
    description: 'Apple Notes 风格随手记便签卡片与排版内容'
  },
  {
    id: 'codepad',
    name: '代码板草稿',
    icon: '💻',
    color: '#0071e3', // Apple Blue
    matchKey: (key) => typeof key === 'string' && key.startsWith('codepad_draft_'),
    description: 'Monaco 代码练习板多语言答题暂存草稿'
  },
  {
    id: 'preferences',
    name: '界面与主题偏好',
    icon: '🎨',
    color: '#ff9500', // Apple Orange
    matchKey: (key) => key === 'theme_pref' || key === 'theme_preference' || key === 'theme_preference_manual',
    description: '深浅外观配色模式与系统偏好'
  }
];

/**
 * 格式化字节尺寸 (如 1.2 KB, 3.4 MB)
 *
 * @param {number} bytes 字节大小
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (!bytes || typeof bytes !== 'number' || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1);
  return `${num} ${sizes[i]}`;
}

/**
 * 获得当前环境下可访问的所有 storage key
 *
 * @returns {string[]}
 */
function getAllStorageKeys() {
  const keys = [];
  if (typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
    } catch {
      // 忽略隐私模式受限
    }
  }
  return keys;
}

/**
 * 分析当前本地存储各模块及全站容量使用状态
 *
 * @returns {{
 *   totalBytes: number,
 *   totalKeys: number,
 *   formattedTotalSize: string,
 *   quotaBytes: number,
 *   usedPercent: number,
 *   modules: Array<{
 *     id: string,
 *     name: string,
 *     icon: string,
 *     color: string,
 *     description: string,
 *     keys: string[],
 *     itemCount: number,
 *     sizeBytes: number,
 *     formattedSize: string,
 *     percentOfUsed: number
 *   }>
 * }}
 */
export function analyzeStorage() {
  const allKeys = getAllStorageKeys();
  let totalBytes = 0;
  let totalKeys = 0;

  // 初始化各模块容器
  const moduleMap = new Map();
  DATA_MODULES.forEach((mod) => {
    moduleMap.set(mod.id, {
      ...mod,
      keys: [],
      itemCount: 0,
      sizeBytes: 0
    });
  });

  allKeys.forEach((key) => {
    // 忽略内部探测 key
    if (key === '__storage_probe__') return;

    let val = '';
    try {
      val = localStorage.getItem(key) || '';
    } catch {}

    const keyBytes = typeof Blob !== 'undefined' ? new Blob([key]).size : key.length;
    const valBytes = typeof Blob !== 'undefined' ? new Blob([val]).size : val.length;
    const entryBytes = keyBytes + valBytes;

    totalBytes += entryBytes;
    totalKeys++;

    // 匹配所属模块
    let matched = false;
    for (const mod of DATA_MODULES) {
      if (mod.matchKey(key)) {
        const target = moduleMap.get(mod.id);
        target.keys.push(key);
        target.sizeBytes += entryBytes;

        // 计算条目数量（例如便签数组计算元素个数，单项算 1）
        if (key === 'local_scratchpad_notes') {
          try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) {
              target.itemCount += arr.length;
            } else {
              target.itemCount += 1;
            }
          } catch {
            target.itemCount += 1;
          }
        } else {
          target.itemCount += 1;
        }

        matched = true;
        break;
      }
    }
  });

  // 标准 localStorage 容量一般为 5MB (5 * 1024 * 1024)
  const quotaBytes = 5 * 1024 * 1024;
  const usedPercent = Math.min(100, (totalBytes / quotaBytes) * 100);

  const modules = Array.from(moduleMap.values()).map((mod) => ({
    ...mod,
    formattedSize: formatBytes(mod.sizeBytes),
    percentOfUsed: totalBytes > 0 ? (mod.sizeBytes / totalBytes) * 100 : 0
  }));

  return {
    totalBytes,
    totalKeys,
    formattedTotalSize: formatBytes(totalBytes),
    quotaBytes,
    usedPercent: Number(usedPercent.toFixed(2)),
    modules
  };
}

/**
 * 校验导入的备份快照数据合法性
 *
 * @param {string} rawJson 原始 JSON 文本
 * @returns {{
 *   valid: boolean,
 *   error?: string,
 *   snapshot?: object,
 *   meta?: {
 *     version: string,
 *     appName: string,
 *     exportedAt: string,
 *     totalModules: number,
 *     totalKeys: number,
 *     totalBytes: number,
 *     itemCounts: Record<string, number>
 *   }
 * }}
 */
export function validateBackup(rawJson) {
  if (!rawJson || typeof rawJson !== 'string') {
    return { valid: false, error: '上传内容为空或非文本格式' };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return { valid: false, error: 'JSON 语法解析错误，请确认文件完整性' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: '快照格式异常，根节点必须为对象' };
  }

  if (parsed.version !== BACKUP_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `不受支持的快照版本 (当前仅支持 v${BACKUP_SCHEMA_VERSION})`
    };
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    return { valid: false, error: '快照中缺失核心 data 数据节点' };
  }

  // 统计快照内各模块包含的项目
  const itemCounts = {};
  DATA_MODULES.forEach((mod) => {
    itemCounts[mod.id] = 0;
  });

  const keys = Object.keys(parsed.data);
  let matchedModulesCount = 0;
  const detectedModuleIds = new Set();

  keys.forEach((key) => {
    for (const mod of DATA_MODULES) {
      if (mod.matchKey(key)) {
        detectedModuleIds.add(mod.id);
        const val = parsed.data[key];
        if (key === 'local_scratchpad_notes') {
          if (Array.isArray(val)) {
            itemCounts[mod.id] += val.length;
          } else {
            itemCounts[mod.id] += 1;
          }
        } else {
          itemCounts[mod.id] += 1;
        }
        break;
      }
    }
  });

  return {
    valid: true,
    snapshot: parsed,
    meta: {
      version: parsed.version,
      appName: parsed.appName || APP_NAME,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      totalModules: detectedModuleIds.size,
      totalKeys: keys.length,
      totalBytes: typeof Blob !== 'undefined' ? new Blob([rawJson]).size : rawJson.length,
      itemCounts
    }
  };
}

/**
 * 组装导出快照数据对象
 *
 * @param {string[]} [selectedModuleIds] 允许仅导出选中的模块 ID，缺省导出全部
 * @returns {object} 标准 Snapshot v1.0
 */
export function exportBackupData(selectedModuleIds = null) {
  const allKeys = getAllStorageKeys();
  const data = {};
  const targetModules = selectedModuleIds
    ? DATA_MODULES.filter((m) => selectedModuleIds.includes(m.id))
    : DATA_MODULES;

  let totalKeys = 0;
  allKeys.forEach((key) => {
    if (key === '__storage_probe__') return;
    const isTarget = targetModules.some((m) => m.matchKey(key));
    if (isTarget) {
      const raw = safeGetItem(key);
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
        totalKeys++;
      }
    }
  });

  const serialized = JSON.stringify(data);
  const totalBytes = typeof Blob !== 'undefined' ? new Blob([serialized]).size : serialized.length;

  return {
    version: BACKUP_SCHEMA_VERSION,
    appName: APP_NAME,
    exportedAt: new Date().toISOString(),
    meta: {
      totalModules: targetModules.length,
      totalKeys,
      totalBytes
    },
    data
  };
}

/**
 * 触发全量/模块化导出并调起浏览器下载
 *
 * @param {string[]} [selectedModuleIds]
 * @returns {boolean}
 */
export function exportBackup(selectedModuleIds = null) {
  try {
    const snapshot = exportBackupData(selectedModuleIds);
    const jsonStr = JSON.stringify(snapshot, null, 2);

    if (typeof document !== 'undefined') {
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const now = new Date();
      const dateStr = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('');
      const timeStr = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0')
      ].join('');

      link.href = url;
      link.download = `ly-workspace-backup-${dateStr}-${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return true;
  } catch (err) {
    console.error('[backupManager] 导出备份失败:', err);
    return false;
  }
}

/**
 * 执行数据快照导入
 *
 * @param {object} snapshot 标准 Snapshot v1.0 对象
 * @param {'overwrite' | 'merge'} [mode='overwrite'] 导入模式：覆盖或合并
 * @returns {{ success: boolean, restoredCount: number, error?: string }}
 */
export function importBackup(snapshot, mode = 'overwrite') {
  if (!snapshot || !snapshot.data || typeof snapshot.data !== 'object') {
    return { success: false, restoredCount: 0, error: '快照数据无效' };
  }

  let restoredCount = 0;
  try {
    const entries = Object.entries(snapshot.data);

    for (const [key, value] of entries) {
      if (mode === 'merge' && key === 'local_scratchpad_notes') {
        // 智能合并便签：对比 id 与 updatedAt
        const currentNotes = safeGetJSON('local_scratchpad_notes', []);
        const incomingNotes = Array.isArray(value) ? value : [];

        const noteMap = new Map();
        // 先放入当前便签
        currentNotes.forEach((n) => {
          if (n && n.id) noteMap.set(n.id, n);
        });

        // 合并引入便签：若 id 已存在，保留 updatedAt 更大（更新）的一份
        incomingNotes.forEach((n) => {
          if (n && n.id) {
            if (noteMap.has(n.id)) {
              const existing = noteMap.get(n.id);
              if ((n.updatedAt || 0) >= (existing.updatedAt || 0)) {
                noteMap.set(n.id, n);
              }
            } else {
              noteMap.set(n.id, n);
            }
          }
        });

        safeSetJSON(key, Array.from(noteMap.values()));
        restoredCount++;
      } else {
        // 覆盖模式或标量/配置数据
        if (typeof value === 'object' && value !== null) {
          safeSetJSON(key, value);
        } else {
          safeSetItem(key, value);
        }
        restoredCount++;
      }
    }

    return { success: true, restoredCount };
  } catch (err) {
    console.error('[backupManager] 导入备份失败:', err);
    return { success: false, restoredCount, error: String(err) };
  }
}

/**
 * 清除指定模块下的全部数据
 *
 * @param {string} moduleId 模块 ID (如 'scratchpad' | 'codepad' | 'preferences')
 * @returns {boolean}
 */
export function clearModuleData(moduleId) {
  const targetModule = DATA_MODULES.find((m) => m.id === moduleId);
  if (!targetModule) return false;

  const allKeys = getAllStorageKeys();
  allKeys.forEach((key) => {
    if (targetModule.matchKey(key)) {
      safeRemoveItem(key);
    }
  });
  return true;
}

/**
 * 恢复出厂设置：清空全站所有受管模块的数据
 *
 * @returns {boolean}
 */
export function resetFactoryData() {
  const allKeys = getAllStorageKeys();
  allKeys.forEach((key) => {
    if (key === '__storage_probe__') return;
    const isManaged = DATA_MODULES.some((m) => m.matchKey(key));
    if (isManaged) {
      safeRemoveItem(key);
    }
  });
  return true;
}
