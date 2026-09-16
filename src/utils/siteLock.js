/**
 * 网站访问锁（安全密码与状态机）
 *
 * 特性：
 * 1. 默认密码为 "520"，代码仅固化存储其 SHA-256 哈希散列，杜绝明文泄露
 * 2. 基于浏览器原生 Web Crypto API (crypto.subtle) 执行单向散列比对
 * 3. 密码正确后持久化解锁凭证（支持记忆 7 天或单次会话）
 * 4. 提供统一事件总线与 Hook，支持系统命令面板一键上锁、设置页改密/开关锁
 */

import { safeGetItem, safeSetItem, safeRemoveItem } from './storage.js';

// 默认密码 "520" 的 SHA-256 散列值
export const DEFAULT_PASSWORD_HASH = '0b35b06a22779418f775a804f36485f7bc978071d1709ad263a68f4f18117b11';

export const STORAGE_KEYS = {
  ENABLED: 'person_web_lock_enabled',
  CUSTOM_HASH: 'person_web_lock_custom_hash',
  UNLOCKED_UNTIL: 'person_web_unlocked_until',
  SESSION_UNLOCKED: 'person_web_session_unlocked'
};

const EVENT_NAME = 'person_web_lock_change';

// 内存订阅者集合，确保单页与多组件响应同步
const listeners = new Set();

function notifyListeners() {
  const locked = isSiteLocked();
  listeners.forEach(fn => {
    try {
      fn(locked);
    } catch (err) {
      console.error('[siteLock] listener error:', err);
    }
  });

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { locked } }));
    } catch {
      // 忽略不支持 CustomEvent 的特殊极端环境
    }
  }
}

/**
 * 监听浏览器全局 lock 状态变化
 * @param {(locked: boolean) => void} callback
 * @returns {() => void} 取消监听函数
 */
export function subscribeLockStatus(callback) {
  listeners.add(callback);

  // 跨标签页同步处理
  const handleStorage = (e) => {
    if (Object.values(STORAGE_KEYS).includes(e.key)) {
      callback(isSiteLocked());
    }
  };

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * 计算字符串的 SHA-256 十六进制哈希
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function computeSha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(text));
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error('当前运行环境不支持 crypto.subtle API');
  }

  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 检查全站锁是否处于开启生效状态（默认为开启）
 * @returns {boolean}
 */
export function isLockEnabled() {
  return safeGetItem(STORAGE_KEYS.ENABLED) !== 'false';
}

/**
 * 切换全站锁的启用/停用状态
 * @param {boolean} enabled
 */
export function setLockEnabled(enabled) {
  safeSetItem(STORAGE_KEYS.ENABLED, enabled ? 'true' : 'false');
  notifyListeners();
}

/**
 * 获取当前生效的密码哈希（自定义优先，否则为默认密码哈希）
 * @returns {string}
 */
export function getCurrentPasswordHash() {
  return safeGetItem(STORAGE_KEYS.CUSTOM_HASH) || DEFAULT_PASSWORD_HASH;
}

/**
 * 是否有自定义设置过的密码
 * @returns {boolean}
 */
export function hasCustomPassword() {
  return Boolean(safeGetItem(STORAGE_KEYS.CUSTOM_HASH));
}

/**
 * 检查当前站点是否处于锁定阻断状态
 * @returns {boolean} true: 需要输入密码; false: 已解锁放行
 */
export function isSiteLocked() {
  if (!isLockEnabled()) {
    return false;
  }

  // 1. 检查本次会话临时解锁标记
  if (safeGetItem(STORAGE_KEYS.SESSION_UNLOCKED) === 'true') {
    return false;
  }

  // 2. 检查持久化过期时间
  const unlockedUntil = Number(safeGetItem(STORAGE_KEYS.UNLOCKED_UNTIL));
  if (unlockedUntil && unlockedUntil > Date.now()) {
    return false;
  }

  return true;
}

/**
 * 验证用户输入的密码
 * @param {string} inputPwd
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function verifyPassword(inputPwd) {
  const clean = typeof inputPwd === 'string' ? inputPwd.trim() : '';
  if (!clean) {
    return { success: false, error: '请输入密码' };
  }

  try {
    const inputHash = await computeSha256(clean);
    const targetHash = getCurrentPasswordHash();

    if (inputHash === targetHash) {
      return { success: true };
    }
    return { success: false, error: '密码错误，请重新输入' };
  } catch (err) {
    return { success: false, error: '密码哈希运算失败: ' + (err.message || '未知异常') };
  }
}

/**
 * 解锁站点
 * @param {object} options
 * @param {number} [options.rememberDays=7] 记住天数，0 表示仅本次浏览器会话有效
 */
export function unlockSite({ rememberDays = 7 } = {}) {
  if (rememberDays > 0) {
    const expiry = Date.now() + rememberDays * 24 * 60 * 60 * 1000;
    safeSetItem(STORAGE_KEYS.UNLOCKED_UNTIL, String(expiry));
    safeRemoveItem(STORAGE_KEYS.SESSION_UNLOCKED);
  } else {
    safeSetItem(STORAGE_KEYS.SESSION_UNLOCKED, 'true');
    safeRemoveItem(STORAGE_KEYS.UNLOCKED_UNTIL);
  }
  notifyListeners();
}

/**
 * 重新锁定站点（清除所有解锁令牌）
 */
export function lockSite() {
  safeRemoveItem(STORAGE_KEYS.UNLOCKED_UNTIL);
  safeRemoveItem(STORAGE_KEYS.SESSION_UNLOCKED);
  notifyListeners();
}

/**
 * 修改站点访问密码
 * @param {string} oldPwd 旧密码
 * @param {string} newPwd 新密码
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function changePassword(oldPwd, newPwd) {
  const verifyOld = await verifyPassword(oldPwd);
  if (!verifyOld.success) {
    return { success: false, error: '原密码验证不通过: ' + (verifyOld.error || '') };
  }

  const cleanNew = typeof newPwd === 'string' ? newPwd.trim() : '';
  if (!cleanNew) {
    return { success: false, error: '新密码不能为空' };
  }

  try {
    const newHash = await computeSha256(cleanNew);
    safeSetItem(STORAGE_KEYS.CUSTOM_HASH, newHash);
    return { success: true };
  } catch (err) {
    return { success: false, error: '新密码哈希存储失败: ' + (err.message || '') };
  }
}

/**
 * 重置密码为初始密码 (520)
 */
export function resetPasswordToDefault() {
  safeRemoveItem(STORAGE_KEYS.CUSTOM_HASH);
}
