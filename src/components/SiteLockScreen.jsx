import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  isSiteLocked,
  verifyPassword,
  unlockSite,
  subscribeLockStatus
} from '../utils/siteLock.js';
import './SiteLockScreen.css';

/**
 * Apple HIG 风格全站访问保护锁屏组件
 */
export default function SiteLockScreen() {
  const [locked, setLocked] = useState(() => isSiteLocked());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDays, setRememberDays] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRef = useRef(null);

  // 监听锁状态变化（支持多标签页与一键锁屏联动）
  useEffect(() => {
    setLocked(isSiteLocked());
    const unsubscribe = subscribeLockStatus((newLocked) => {
      setLocked(newLocked);
      if (newLocked) {
        setPassword('');
        setErrorMsg('');
      }
    });
    return () => unsubscribe();
  }, []);

  // 当处于锁定状态时，自动聚焦输入框
  useEffect(() => {
    if (locked) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [locked]);

  // 锁定状态下拦截任何冒泡到 window 的全局快捷键 (如 ` 终端、Cmd+K 命令面板等)
  useEffect(() => {
    if (!locked) return;

    const handleKeyCapture = (e) => {
      // 允许输入框内的常规编辑与回车
      if (inputRef.current && (e.target === inputRef.current || inputRef.current.contains(e.target))) {
        return;
      }
      e.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyCapture, true);
    return () => {
      window.removeEventListener('keydown', handleKeyCapture, true);
    };
  }, [locked]);

  const handleUnlock = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await verifyPassword(password);
      if (res.success) {
        unlockSite({ rememberDays: rememberDays ? 7 : 0 });
        setPassword('');
      } else {
        setErrorMsg(res.error || '密码错误，请重新输入');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        inputRef.current?.select();
      }
    } catch (err) {
      setErrorMsg('解锁发生异常: ' + (err.message || '请重试'));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  }, [password, rememberDays, isSubmitting]);

  if (!locked) {
    return null;
  }

  return (
    <div className="site-lock-overlay" role="dialog" aria-modal="true" aria-label="网站访问锁">
      <div className={`site-lock-card ${shake ? 'shake' : ''}`}>
        <div className={`site-lock-icon-wrap ${errorMsg ? 'error' : ''}`}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 className="site-lock-title">私人工作台已锁定</h2>
        <p className="site-lock-desc">
          本站设有安全访问屏障，请输入访问密码以解锁完整内容与工具。
        </p>

        <form className="site-lock-form" onSubmit={handleUnlock}>
          <div className="site-lock-input-group">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              className={`site-lock-input ${errorMsg ? 'is-error' : ''}`}
              placeholder="请输入访问密码..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="site-lock-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              title={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="site-lock-error-msg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <label className="site-lock-options">
            <input
              type="checkbox"
              checked={rememberDays}
              onChange={(e) => setRememberDays(e.target.checked)}
            />
            <span>记住此设备 7 天（未勾选则仅本次访问有效）</span>
          </label>

          <button
            type="submit"
            className="site-lock-btn"
            disabled={isSubmitting || !password.trim()}
          >
            {isSubmitting ? '正在验证...' : '解锁进入工作台'}
          </button>
        </form>

        <div className="site-lock-footer-hint">
          默认密码可在「系统设置」中自定义或停用锁保护
        </div>
      </div>
    </div>
  );
}
