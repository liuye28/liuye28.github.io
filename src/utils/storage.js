/**
 * localStorage 安全读写工具库
 *
 * 解决以下常见隐患：
 * 1. 浏览器无痕/隐私模式、iframe 嵌入或受限环境下访问 localStorage 抛出 SecurityError 导致整站崩溃
 * 2. 存储配额超出 (QuotaExceededError) 时的异常捕获
 * 3. SSR / Node.js 测试环境下 window/localStorage 未定义时的 ReferenceError
 * 4. 原生存储不可用时自动降级到内存字典，保证单次会话内状态读写连贯
 * 5. JSON 序列化与反序列化的冗余 try-catch 样板代码
 */

const isDev = Boolean(import.meta.env?.DEV);

function logWarn(...args) {
  if (isDev) {
    console.warn(...args);
  }
}

/**
 * 探测当前运行环境是否真正支持原生 localStorage 读写
 * 兼顾：SSR 环境、Safari 无痕/隐私模式、iframe 严格沙盒限制及 QuotaExceeded
 *
 * @returns {boolean}
 */
export function isStorageAvailable() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    const probeKey = '__storage_probe__';
    localStorage.setItem(probeKey, probeKey);
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

// 缓存当前环境的可用性判定
const storageAvailable = isStorageAvailable();

// 内存降级存储容器：当无痕模式或沙盒完全拦截 localStorage 时，保证当前单次会话内的读写与交互正常
const memoryStore = new Map();

/**
 * 安全读取 localStorage 原始字符串
 *
 * @param {string} key 缓存键名
 * @param {string|null} [fallback=null] 异常或不存在时的默认回退值
 * @returns {string|null}
 */
export function safeGetItem(key, fallback = null) {
  if (storageAvailable) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        return val;
      }
    } catch (err) {
      logWarn(`[storage] 读取 key "${key}" 失败:`, err);
    }
  }
  // 原生不可用或未命中时，检查内存降级容器
  return memoryStore.has(key) ? memoryStore.get(key) : fallback;
}

/**
 * 安全写入 localStorage 字符串
 *
 * @param {string} key 缓存键名
 * @param {string|number|boolean} value 待保存的值
 * @returns {boolean} 是否写入成功 (原生或内存降级)
 */
export function safeSetItem(key, value) {
  const strVal = String(value);
  let nativeSuccess = false;

  if (storageAvailable) {
    try {
      localStorage.setItem(key, strVal);
      nativeSuccess = true;
    } catch (err) {
      logWarn(`[storage] 写入 key "${key}" 到原生存储失败，降级写入内存:`, err);
    }
  }

  // 同步在内存降级字典中存储一份，确保隐私模式或降级场景下会话一致
  memoryStore.set(key, strVal);
  return nativeSuccess || !storageAvailable;
}

/**
 * 安全移除指定的 localStorage 键
 *
 * @param {string} key 缓存键名
 * @returns {boolean} 是否移除成功
 */
export function safeRemoveItem(key) {
  let nativeSuccess = false;

  if (storageAvailable) {
    try {
      localStorage.removeItem(key);
      nativeSuccess = true;
    } catch (err) {
      logWarn(`[storage] 移除 key "${key}" 失败:`, err);
    }
  }

  memoryStore.delete(key);
  return nativeSuccess || !storageAvailable;
}

/**
 * 安全读取并自动解析 JSON 对象
 *
 * @template T
 * @param {string} key 缓存键名
 * @param {T} [fallback=null] 异常、格式错误或不存在时的默认回退值
 * @returns {T}
 */
export function safeGetJSON(key, fallback = null) {
  try {
    const raw = safeGetItem(key, null);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    logWarn(`[storage] 解析 key "${key}" 的 JSON 数据失败:`, err);
    return fallback;
  }
}

/**
 * 安全序列化并写入 JSON 对象
 *
 * @param {string} key 缓存键名
 * @param {any} value 待序列化的数据
 * @returns {boolean} 是否写入成功
 */
export function safeSetJSON(key, value) {
  try {
    const serialized = JSON.stringify(value);
    return safeSetItem(key, serialized);
  } catch (err) {
    logWarn(`[storage] 序列化 key "${key}" 失败:`, err);
    return false;
  }
}

