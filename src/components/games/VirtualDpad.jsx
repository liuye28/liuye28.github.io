import React, { useRef } from 'react';
import '../../pages/games/GamesCommon.css';

/**
 * 移动端半透明虚拟方向十字键组件
 *
 * @param {{ onDirection: (dir: 'up' | 'down' | 'left' | 'right') => void }} props
 */
export default function VirtualDpad({ onDirection }) {
  const lastTouchTimeRef = useRef(0);

  const handlePress = (dir, isTouch = false) => {
    const now = Date.now();
    if (isTouch) {
      lastTouchTimeRef.current = now;
    } else if (now - lastTouchTimeRef.current < 450) {
      // 忽略由 touchstart 触发后浏览器派发的延迟点击事件，防止重复触发
      return;
    }

    // 触觉轻微震动反馈 (15ms)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(15);
      } catch {
        // 忽略静默异常
      }
    }

    if (typeof onDirection === 'function') {
      onDirection(dir);
    }
  };

  return (
    <div className="virtual-dpad" role="group" aria-label="移动端虚拟十字手柄">
      <button
        type="button"
        className="dpad-btn dpad-up"
        onTouchStart={(e) => {
          e.preventDefault();
          handlePress('up', true);
        }}
        onClick={() => handlePress('up', false)}
        aria-label="向上"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <button
        type="button"
        className="dpad-btn dpad-left"
        onTouchStart={(e) => {
          e.preventDefault();
          handlePress('left', true);
        }}
        onClick={() => handlePress('left', false)}
        aria-label="向左"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="dpad-center" aria-hidden="true">
        <span className="dpad-center-dot" />
      </div>

      <button
        type="button"
        className="dpad-btn dpad-right"
        onTouchStart={(e) => {
          e.preventDefault();
          handlePress('right', true);
        }}
        onClick={() => handlePress('right', false)}
        aria-label="向右"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button
        type="button"
        className="dpad-btn dpad-down"
        onTouchStart={(e) => {
          e.preventDefault();
          handlePress('down', true);
        }}
        onClick={() => handlePress('down', false)}
        aria-label="向下"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
