import { useState, useEffect, useCallback } from 'react';

/**
 * PWA 安装状态监听与调起 Hook
 *
 * 核心功能：
 * 1. 捕获浏览器 beforeinstallprompt 原生安装提示事件
 * 2. 检测当前是否处于独立原生窗口运行（Standalone 模式）
 * 3. 识别 iOS Safari 环境并辅助提示用户“添加到主屏幕”
 * 4. 触发原生安装弹窗并处理结果
 *
 * @returns {{
 *   canInstall: boolean,
 *   isStandalone: boolean,
 *   isIos: boolean,
 *   installApp: () => Promise<boolean>
 * }}
 */
export default function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. 检查是否已经是独立窗口运行
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // 2. 检测 iOS 设备
    const ua = window.navigator.userAgent || '';
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIos(isIosDevice);

    // 3. 监听 beforeinstallprompt 事件
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 4. 监听安装成功事件
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[usePwaInstall] 触发安装异常:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall: Boolean(deferredPrompt),
    isStandalone,
    isIos,
    installApp
  };
}
