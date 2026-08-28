/**
 * 从完整 URL 中解析出主机名 (hostname)
 * 例如: https://claude.ai/chat -> claude.ai
 *
 * @param {string} url 目标网站链接
 * @returns {string} 域名
 */
export function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    // 兼容没有 http 协议开头的异常输入
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

/**
 * 获取 Google 公共 Favicon 图标链接
 *
 * @param {string} url 目标网站链接
 * @param {number} size 图标尺寸 (默认 64)
 * @returns {string} 图标图片 URL
 */
export function getFaviconUrl(url, size = 64) {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
