/**
 * 字符串与命名风格转换工具库
 */

// 常用 Java 关键字黑名单
export const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
]);

/**
 * 字符串转大驼峰 (PascalCase)
 * @param {string} str 原始字符串
 * @param {string} [defaultVal='Item'] 兜底默认值
 * @param {RegExp} [stripPrefixPattern] 可选剥离前缀正则（如 /^t_|^tbl_|^sys_/）
 * @returns {string} 大驼峰字符串
 */
export function toPascalCase(str, defaultVal = 'Item', stripPrefixPattern = null) {
  if (!str) return defaultVal;
  let s = String(str);
  if (stripPrefixPattern) {
    s = s.replace(stripPrefixPattern, '');
  }
  const result = s
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return result || defaultVal;
}

/**
 * 字符串转小驼峰 (camelCase)
 * @param {string} str 原始字符串
 * @param {string} [defaultVal='field'] 兜底默认值
 * @returns {string} 小驼峰字符串
 */
export function toCamelCase(str, defaultVal = 'field') {
  if (!str) return defaultVal;
  const pascal = toPascalCase(str, defaultVal);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * 规范化合法 Java 变量名（避开数字开头与 Java 保留关键字）
 * @param {string} rawKey 原始键名
 * @returns {string} 合法 Java 变量名
 */
export function getSafeJavaFieldName(rawKey) {
  let field = toCamelCase(rawKey);
  // 如果以数字开头，前缀下划线
  if (/^[0-9]/.test(field)) {
    field = `_${field}`;
  }
  // 如果与 Java 关键字冲突，增加 Val 后缀
  if (JAVA_KEYWORDS.has(field)) {
    field = `${field}Val`;
  }
  return field;
}
