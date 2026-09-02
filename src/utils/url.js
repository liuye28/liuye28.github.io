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
 * 获取网站 Favicon 图标链接
 *
 * 注：原 Google 服务 (www.google.com/s2/favicons) 在国内网络环境下不可达，
 * 现已替换为国内稳定可访问的 favicon.im 服务 (https://favicon.im/{domain})。
 * 保持函数签名不变，以便调用方 (SiteCard.jsx 等) 无需修改。
 *
 * @param {string} url 目标网站链接
 * @param {number} [size=64] 图标尺寸 (默认 64，供参数兼容，favicon.im 支持较大尺寸)
 * @returns {string} 图标图片 URL
 */
export function getFaviconUrl(url, size = 64) {
  const domain = getDomain(url);
  if (!domain) return '';
  // favicon.im 服务：基础格式为 https://favicon.im/{domain}
  // 当需要较大尺寸 (>=64) 时，可附加 larger=true 参数以获取更高分辨率图标
  const queryParam = size >= 64 ? '?larger=true' : '';
  return `https://favicon.im/${encodeURIComponent(domain)}${queryParam}`;
}
