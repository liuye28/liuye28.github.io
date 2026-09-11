import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PwaUpdateToast.css';

/**
 * PWA 离线感知与平滑热更新通知 Toast (Apple HIG 毛玻璃风格)
 */
export default function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      if (import.meta.env?.DEV) {
        console.log('[PWA] Service Worker 注册成功:', registration);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker 注册失败:', error);
    }
  });

  if (!needRefresh) {
    return null;
  }

  const handleReload = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <aside className="pwa-update-banner" role="alert" aria-live="polite">
      <div className="pwa-update-header">
        <div className="pwa-update-icon" aria-hidden="true">
          ✦
        </div>
        <div className="pwa-update-info">
          <h4 className="pwa-update-title">发现新版本工作台</h4>
          <p className="pwa-update-desc">离线核心资源已就绪，立即更新以体验最新优化</p>
        </div>
      </div>
      <div className="pwa-update-actions">
        <button
          type="button"
          onClick={handleDismiss}
          className="pwa-btn-dismiss"
        >
          稍后
        </button>
        <button
          type="button"
          onClick={handleReload}
          className="pwa-btn-reload"
        >
          立即更新
        </button>
      </div>
    </aside>
  );
}
