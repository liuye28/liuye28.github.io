/**
 * localStorage 安全读写工具库
 *
 * 解决以下常见隐患：
 * 1. 浏览器无痕/隐私模式、iframe 嵌入或受限环境下访问 localStorage 抛出 SecurityError 导致整站崩溃
 * 2. 存储配额超出 (QuotaExceededError) 时的异常捕获
 * 3. JSON 序列化与反序列化的冗余 try-catch 样板代码
 */

const isDev = Boolean(import.meta.env?.DEV);

function logWarn(...args) {
  if (isDev) {
    console.warn(...args);
  }
}

/**
 * 安全读取 localStorage 原始字符串
 *
 * @param {string} key 缓存键名
 * @param {string|null} [fallback=null] 异常或不存在时的默认回退值
 * @returns {string|null}
 */
export function safeGetItem(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (err) {
    logWarn(`[storage] 读取 key "${key}" 失败:`, err);
    return fallback;
  }
}

/**
 * 安全写入 localStorage 字符串
 *
 * @param {string} key 缓存键名
 * @param {string} value 待保存的字符串值
 * @returns {boolean} 是否写入成功
 */
export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch (err) {
    logWarn(`[storage] 写入 key "${key}" 失败:`, err);
    return false;
  }
}

/**
 * 安全移除指定的 localStorage 键
 *
 * @param {string} key 缓存键名
 * @returns {boolean} 是否移除成功
 */
export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    logWarn(`[storage] 移除 key "${key}" 失败:`, err);
    return false;
  }
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
