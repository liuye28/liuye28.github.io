import { useEffect, useRef } from 'react';

/**
 * 根据滑动位移计算滑动方向
 *
 * @param {number} deltaX 水平位移 (endX - startX)
 * @param {number} deltaY 垂直位移 (endY - startY)
 * @param {number} threshold 判定最小阈值 (默认 30px)
 * @returns {'up' | 'down' | 'left' | 'right' | null}
 */
export function calculateSwipeDirection(deltaX, deltaY, threshold = 30) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (Math.max(absX, absY) < threshold) {
    return null;
  }

  if (absX > absY) {
    return deltaX > 0 ? 'right' : 'left';
  }
  return deltaY > 0 ? 'down' : 'up';
}

/**
 * 格式化秒数为 MM:SS
 *
 * @param {number} seconds 秒数
 * @returns {string} 格式化时间字符串
 */
export function formatGameTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * 触控手势滑动识别 Hook
 *
 * @param {(direction: 'up' | 'down' | 'left' | 'right') => void} onSwipe 滑动触发回调
 * @param {import('react').RefObject<HTMLElement> | HTMLElement | null} [targetRef] 监听的 DOM Ref（若未提供则监听 window）
 * @param {object} [options]
 * @param {number} [options.threshold=30] 最小滑动判定距离阈值 (px)
 * @param {boolean} [options.preventDefault=true] 是否在滑动手势时阻止默认橡皮筋反弹与滚动
 */
export function useTouchSwipe(onSwipe, targetRef, options = {}) {
  const { threshold = 30, preventDefault = true } = options;
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    // 支持 RefObject 或原生 HTMLElement，默认回退至 window
    let element = null;
    if (targetRef && 'current' in targetRef) {
      element = targetRef.current;
    } else if (targetRef instanceof HTMLElement) {
      element = targetRef;
    } else if (typeof window !== 'undefined') {
      element = window;
    }

    if (!element) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
    };

    const handleTouchMove = (e) => {
      if (!isTracking || !e.touches || e.touches.length === 0) return;
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const diffX = Math.abs(curX - startX);
      const diffY = Math.abs(curY - startY);

      // 若已有明确滑动意图且启用 preventDefault，阻止浏览器默认的页面上下弹跳
      if (preventDefault && (diffX > 8 || diffY > 8)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (!isTracking) return;
      isTracking = false;
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      const direction = calculateSwipeDirection(deltaX, deltaY, threshold);
      if (direction && typeof onSwipeRef.current === 'function') {
        onSwipeRef.current(direction);
      }
    };

    const handleTouchCancel = () => {
      isTracking = false;
    };

    // 如果启用了 preventDefault，需以 passive: false 绑定 touchmove
    const moveListenerOptions = { passive: !preventDefault };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, moveListenerOptions);
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [targetRef, threshold, preventDefault]);
}

export default useTouchSwipe;
