import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 剪贴板复制自定义 Hook
 *
 * 封装各工具组件中的剪贴板写入、状态提示与定时还原逻辑：
 * 1. 支持自定义恢复延迟 (默认 1500ms)
 * 2. 支持简单布尔值 (copy(text)) 或基于 key 标识的多处复制区分 (copy(text, key))
 * 3. 维护内部定时器，在快速重复点击或组件卸载时及时清理，避免状态错乱与内存泄漏
 *
 * @param {number} [delay=1500] 成功状态重置的延迟毫秒数
 * @returns {[boolean|string|number|null, (text: string|number, key?: boolean|string|number) => Promise<boolean>]}
 */
export function useCopyToClipboard(delay = 1500) {
  const [copied, setCopied] = useState(null);
  const timerRef = useRef(null);

  const copy = useCallback(
    async (text, key = true) => {
      if (text === undefined || text === null) return false;

      // 清理前一个定时器，防止连续点击时过早复位
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      try {
        const str = typeof text === 'string' ? text : String(text);
        await navigator.clipboard.writeText(str);
        setCopied(key);

        timerRef.current = setTimeout(() => {
          setCopied(null);
          timerRef.current = null;
        }, delay);
        return true;
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
      }
    },
    [delay]
  );

  // 组件卸载时自动清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [copied, copy];
}

export default useCopyToClipboard;
