import { useEffect } from 'react';

const DEFAULT_TITLE = 'Ly - 常用网站与效率工具导航';

/**
 * 页面标题管理自定义 Hook
 *
 * 规范整站浏览器标签页标题展示，提升多标签场景下的用户辨识度与历史记录可读性
 *
 * @param {string} [title] 页面特异性标题 (如 "JSON 格式化" 或完整标题)
 * @param {boolean} [withSuffix=true] 是否自动追加 " - Ly" 后缀
 */
export function usePageTitle(title, withSuffix = true) {
  useEffect(() => {
    if (!title) {
      document.title = DEFAULT_TITLE;
      return;
    }

    if (!withSuffix || title.includes('Ly')) {
      document.title = title;
    } else {
      document.title = `${title} - Ly`;
    }
  }, [title, withSuffix]);
}

export default usePageTitle;
