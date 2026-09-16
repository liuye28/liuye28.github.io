import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import usePageTitle from '../hooks/usePageTitle';
import usePwaInstall from '../hooks/usePwaInstall';
import {
  DATA_MODULES,
  analyzeStorage,
  exportBackup,
  validateBackup,
  importBackup,
  clearModuleData,
  resetFactoryData,
  formatBytes
} from '../utils/backupManager';
import {
  isLockEnabled,
  setLockEnabled,
  lockSite,
  hasCustomPassword,
  changePassword,
  resetPasswordToDefault
} from '../utils/siteLock';
import './Settings.css';

/**
 * 系统设置与数据中心视图组件 (Apple HIG / macOS 系统偏好设置风格)
 */
export default function Settings() {
  usePageTitle('系统设置与数据中心');

  // 本地存储分析快照
  const [analysis, setAnalysis] = useState(analyzeStorage);

  // 状态反馈横幅
  const [feedback, setFeedback] = useState(null);

  // PWA 安装能力与窗口模式监听
  const { canInstall, isStandalone, isIos, installApp } = usePwaInstall();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isPurgingCache, setIsPurgingCache] = useState(false);

  // 导入预检弹窗状态
  const [importModal, setImportModal] = useState({
    isOpen: false,
    rawJson: '',
    snapshot: null,
    meta: null,
    mode: 'merge' // 'merge' | 'overwrite'
  });

  // 危险出厂重置二次防误触弹窗
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');

  // 站点访问保护锁状态
  const [siteLockActive, setSiteLockActive] = useState(() => isLockEnabled());
  const [isCustomPwd, setIsCustomPwd] = useState(() => hasCustomPassword());
  const [changePwdModalOpen, setChangePwdModalOpen] = useState(false);
  const [oldPwdInput, setOldPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [confirmPwdInput, setConfirmPwdInput] = useState('');
  const [pwdError, setPwdError] = useState('');

  const fileInputRef = useRef(null);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const refreshAnalysis = () => {
    setAnalysis(analyzeStorage());
  };

  // 1. PWA 操作
  const handleTriggerInstall = async () => {
    const success = await installApp();
    if (success) {
      showFeedback('🎉 正在启动原生应用安装...');
    }
  };

  const handleCheckUpdate = async () => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
      showFeedback('当前运行环境不支持 Service Worker', 'info');
      return;
    }
    setIsCheckingUpdate(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        showFeedback('已检查更新：当前已是最新版本');
      } else {
        showFeedback('Service Worker 尚未接管或离线缓存未激活', 'info');
      }
    } catch (err) {
      showFeedback(`检查更新失败: ${err.message}`, 'error');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handlePurgeCache = async () => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      showFeedback('当前环境不支持 Cache API', 'info');
      return;
    }
    if (!window.confirm('确定要清空所有离线预缓存资源吗？清空后离线将重新拉取。')) {
      return;
    }
    setIsPurgingCache(true);
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      showFeedback(`已成功清理 ${cacheNames.length} 个离线缓存包`);
    } catch (err) {
      showFeedback(`清理缓存失败: ${err.message}`, 'error');
    } finally {
      setIsPurgingCache(false);
    }
  };

  // 2. 导出备份
  const handleExportAll = () => {
    const success = exportBackup();
    if (success) {
      showFeedback('全站完整备份快照已生成并开始下载');
    } else {
      showFeedback('生成备份失败，请检查浏览器权限', 'error');
    }
  };

  const handleExportSingleModule = (moduleId, moduleName) => {
    const success = exportBackup([moduleId]);
    if (success) {
      showFeedback(`[${moduleName}] 备份快照已生成并开始下载`);
    } else {
      showFeedback(`导出 [${moduleName}] 失败`, 'error');
    }
  };

  // 3. 清理单模块
  const handleClearSingleModule = (moduleId, moduleName) => {
    if (window.confirm(`确定要清空 [${moduleName}] 的所有本地数据吗？此操作不可逆。`)) {
      clearModuleData(moduleId);
      refreshAnalysis();
      showFeedback(`已成功清空 [${moduleName}] 数据`);
    }
  };

  // 4. 文件上传导入与预检
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const validation = validateBackup(content);
      if (!validation.valid) {
        showFeedback(`校验失败: ${validation.error}`, 'error');
        return;
      }
      setImportModal({
        isOpen: true,
        rawJson: content,
        snapshot: validation.snapshot,
        meta: validation.meta,
        mode: 'merge'
      });
    };
    reader.onerror = () => {
      showFeedback('读取文件发生错误', 'error');
    };
    reader.readAsText(file);
    // 重置 input 避免选择同一文件不触发 onChange
    e.target.value = '';
  };

  const handleExecuteImport = () => {
    if (!importModal.snapshot) return;
    const res = importBackup(importModal.snapshot, importModal.mode);
    if (res.success) {
      refreshAnalysis();
      setImportModal({ isOpen: false, rawJson: '', snapshot: null, meta: null, mode: 'merge' });
      showFeedback(`🎉 导入成功！已恢复 ${res.restoredCount} 个数据项`);
    } else {
      showFeedback(`导入失败: ${res.error}`, 'error');
    }
  };

  // 5. 危险出厂重置
  const handleExecuteReset = () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'RESET') {
      showFeedback('确认口令输入不匹配，已取消操作', 'error');
      return;
    }
    resetFactoryData();
    refreshAnalysis();
    setResetModalOpen(false);
    setResetConfirmInput('');
    showFeedback('已将全站数据恢复至出厂状态');
  };

  // 6. 站点访问锁操作
  const handleToggleLock = (e) => {
    const nextVal = e.target.checked;
    setLockEnabled(nextVal);
    setSiteLockActive(nextVal);
    showFeedback(nextVal ? '🔒 站点访问锁已开启（密码保护生效）' : '🔓 站点访问锁已停用（公开访问）');
  };

  const handleImmediateLock = () => {
    lockSite();
  };

  const handleOpenChangePwd = () => {
    setOldPwdInput('');
    setNewPwdInput('');
    setConfirmPwdInput('');
    setPwdError('');
    setChangePwdModalOpen(true);
  };

  const handleExecuteChangePwd = async (e) => {
    if (e) e.preventDefault();
    setPwdError('');

    if (!newPwdInput.trim()) {
      setPwdError('新密码不能为空');
      return;
    }
    if (newPwdInput !== confirmPwdInput) {
      setPwdError('两次输入的新密码不一致');
      return;
    }

    const res = await changePassword(oldPwdInput, newPwdInput);
    if (res.success) {
      setIsCustomPwd(true);
      setChangePwdModalOpen(false);
      showFeedback('🎉 网站访问密码已成功更新！');
    } else {
      setPwdError(res.error || '修改密码失败，请核对原密码');
    }
  };

  const handleResetDefaultPwd = () => {
    if (window.confirm('确定要恢复默认访问密码（520）吗？')) {
      resetPasswordToDefault();
      setIsCustomPwd(false);
      showFeedback('已成功恢复默认密码 (520)');
    }
  };

  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        <Header />

        <div className="settings-container">
          {/* 页面标头 */}
          <div className="settings-hero">
            <h2 className="settings-hero-title">系统设置与数据中心</h2>
            <p className="settings-hero-subtitle">
              PWA 离线应用运行状态、本地存储用量深度分析与全站数据无损备份/迁移中心
            </p>
          </div>

          {/* 反馈通知横幅 */}
          {feedback && (
            <div className={`settings-feedback-banner ${feedback.type}`}>
              <span>{feedback.message}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="settings-btn settings-btn-sm settings-btn-secondary"
                style={{ padding: '0.15rem 0.5rem', marginLeft: '1rem' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* =================================================================
              卡片 1：PWA 离线与桌面应用状态
              ================================================================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <div className="settings-card-title-group">
                  <span className="settings-card-icon">📱</span>
                  <h3 className="settings-card-title">PWA 离线应用与运行状态</h3>
                </div>
                <p className="settings-card-desc">
                  本站支持 Service Worker 全量预缓存与原生桌面/移动端独立窗口模式
                </p>
              </div>
            </div>

            <div className="pwa-status-pill-group">
              <span className="pwa-status-badge ready">
                <span className="pwa-dot" /> 离线预缓存已就绪 (Offline Ready)
              </span>

              {isStandalone ? (
                <span className="pwa-status-badge ready">
                  <span className="pwa-dot" /> 独立原生窗口模式 (Standalone)
                </span>
              ) : (
                <span className="pwa-status-badge">
                  <span className="pwa-dot" /> 浏览器标签页运行中
                </span>
              )}

              {isIos && (
                <span className="pwa-status-badge">
                  💡 iOS Safari：可点击底部“分享”→“添加到主屏幕”
                </span>
              )}
            </div>

            <div className="settings-action-row">
              {canInstall && (
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="settings-btn settings-btn-primary"
                >
                  ⬇️ 安装到桌面应用 (PWA)
                </button>
              )}

              <button
                type="button"
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate}
                className="settings-btn settings-btn-secondary"
              >
                {isCheckingUpdate ? '正在检查...' : '🔄 检查应用更新'}
              </button>

              <button
                type="button"
                onClick={handlePurgeCache}
                disabled={isPurgingCache}
                className="settings-btn settings-btn-secondary"
              >
                {isPurgingCache ? '正在清理...' : '🧹 清空离线缓存'}
              </button>
            </div>
          </section>

          {/* =================================================================
              卡片 2：站点访问锁与隐私防护 (Site Security & Lock)
              ================================================================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <div className="settings-card-title-group">
                  <span className="settings-card-icon">🔐</span>
                  <h3 className="settings-card-title">站点访问锁与隐私防护</h3>
                </div>
                <p className="settings-card-desc">
                  开启后访客必须输入访问密码才能浏览本站；基于浏览器原生 SHA-256 安全哈希比对
                </p>
              </div>
            </div>

            <div className="pwa-status-pill-group">
              <span className={`pwa-status-badge ${siteLockActive ? 'ready' : ''}`}>
                <span className="pwa-dot" /> {siteLockActive ? '访问锁生效中 (已保护)' : '访问锁已停用 (公开浏览)'}
              </span>
              <span className="pwa-status-badge">
                🔑 密码状态：{isCustomPwd ? '已配置自定义密码' : '默认初始密码 (520)'}
              </span>
            </div>

            <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={siteLockActive}
                  onChange={handleToggleLock}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
                />
                <span>启用整站访问密码保护屏障</span>
              </label>
            </div>

            <div className="settings-action-row">
              <button
                type="button"
                onClick={handleImmediateLock}
                className="settings-btn settings-btn-primary"
                title="立即锁定当前页面，测试解锁屏幕"
              >
                🔒 立即锁定测试
              </button>

              <button
                type="button"
                onClick={handleOpenChangePwd}
                className="settings-btn settings-btn-secondary"
              >
                ✏️ 修改访问密码
              </button>

              {isCustomPwd && (
                <button
                  type="button"
                  onClick={handleResetDefaultPwd}
                  className="settings-btn settings-btn-secondary"
                >
                  ↺ 恢复默认密码 (520)
                </button>
              )}
            </div>
          </section>

          {/* =================================================================
              卡片 3：本地存储用量分析 (Storage Inspector)
              ================================================================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <div className="settings-card-title-group">
                  <span className="settings-card-icon">📊</span>
                  <h3 className="settings-card-title">本地存储容量与模块洞察</h3>
                </div>
                <p className="settings-card-desc">
                  实时分析 localStorage 各模块真实占用大小，所有数据纯本地保存，绝不上云
                </p>
              </div>
              <button
                type="button"
                onClick={refreshAnalysis}
                className="settings-btn settings-btn-sm settings-btn-secondary"
                title="重新统计"
              >
                刷新统计
              </button>
            </div>

            {/* 容量进度条 */}
            <div className="storage-overview-box">
              <div className="storage-quota-header">
                <span>已用空间：<strong className="storage-quota-value">{analysis.formattedTotalSize}</strong></span>
                <span>标准配额约 5.0 MB (已用 {analysis.usedPercent}%)</span>
              </div>
              <div className="storage-meter-track" title={`已使用 ${analysis.usedPercent}%`}>
                {analysis.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="storage-meter-fill"
                    style={{
                      width: `${mod.percentOfUsed}%`,
                      backgroundColor: mod.color
                    }}
                    title={`${mod.name}: ${mod.formattedSize}`}
                  />
                ))}
              </div>
            </div>

            {/* 模块明细列表 */}
            <div className="module-list">
              {analysis.modules.map((mod) => (
                <div key={mod.id} className="module-item">
                  <div className="module-meta">
                    <span className="module-icon">{mod.icon}</span>
                    <div className="module-text">
                      <div className="module-name-group">
                        <span className="module-name">{mod.name}</span>
                        <span className="module-count-tag">{mod.itemCount} 项</span>
                      </div>
                      <span className="module-desc">{mod.description}</span>
                    </div>
                  </div>

                  <div className="module-stats">
                    {mod.formattedSize}
                  </div>

                  <div className="module-buttons">
                    <button
                      type="button"
                      onClick={() => handleExportSingleModule(mod.id, mod.name)}
                      className="settings-btn settings-btn-sm settings-btn-secondary"
                    >
                      导出
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearSingleModule(mod.id, mod.name)}
                      disabled={mod.sizeBytes === 0}
                      className="settings-btn settings-btn-sm settings-btn-secondary"
                    >
                      清空
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================================
              卡片 3：全站数据备份与迁移
              ================================================================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <div className="settings-card-title-group">
                  <span className="settings-card-icon">💾</span>
                  <h3 className="settings-card-title">全站数据备份与迁移</h3>
                </div>
                <p className="settings-card-desc">
                  一键生成包含时间戳与校验元数据的整站 JSON 备份，方便换设备、换浏览器无缝迁移
                </p>
              </div>
            </div>

            <div className="backup-grid">
              {/* 导出区域 */}
              <div className="backup-box">
                <div className="backup-box-info">
                  <h4>导出全站快照</h4>
                  <p>将当前所有便签、代码草稿与偏好设置打包为标准 .json 文件下载。</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="settings-btn settings-btn-primary"
                >
                  💾 导出完整备份 (JSON)
                </button>
              </div>

              {/* 导入区域 */}
              <div className="backup-box">
                <div className="backup-box-info">
                  <h4>导入恢复快照</h4>
                  <p>选择先前导出的 .json 备份文件，导入前支持预览内容并选择合并或覆盖。</p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="settings-btn settings-btn-secondary"
                    style={{ width: '100%' }}
                  >
                    📂 选择备份文件并恢复...
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================================
              卡片 4：危险区域 (Danger Zone)
              ================================================================= */}
          <section className="settings-card danger">
            <div className="settings-card-header">
              <div>
                <div className="settings-card-title-group">
                  <span className="settings-card-icon">⚠️</span>
                  <h3 className="settings-card-title">危险区域 (Danger Zone)</h3>
                </div>
                <p className="settings-card-desc">
                  清空此浏览器本地存储的所有便签、代码草稿与自定义配置，重置到纯净出厂状态
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setResetConfirmInput('');
                setResetModalOpen(true);
              }}
              className="settings-btn settings-btn-danger"
            >
              🗑️ 恢复出厂设置（清空所有数据）
            </button>
          </section>
        </div>

        {/* =================================================================
            模态弹窗 1：导入预览与模式选择
            ================================================================= */}
        {importModal.isOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3>快照校验就绪</h3>
                <p>已成功验证备份文件的结构与版本规范，请确认导入方式：</p>
              </div>

              {importModal.meta && (
                <div className="modal-preview-table">
                  <div className="modal-preview-row">
                    <span>备份来源</span>
                    <strong>{importModal.meta.appName} (v{importModal.meta.version})</strong>
                  </div>
                  <div className="modal-preview-row">
                    <span>导出时刻</span>
                    <strong>{new Date(importModal.meta.exportedAt).toLocaleString()}</strong>
                  </div>
                  <div className="modal-preview-row">
                    <span>便签数量</span>
                    <strong>{importModal.meta.itemCounts.scratchpad || 0} 篇</strong>
                  </div>
                  <div className="modal-preview-row">
                    <span>代码板草稿</span>
                    <strong>{importModal.meta.itemCounts.codepad || 0} 份</strong>
                  </div>
                  <div className="modal-preview-row">
                    <span>数据包体积</span>
                    <strong>{formatBytes(importModal.meta.totalBytes)}</strong>
                  </div>
                </div>
              )}

              <div className="import-mode-selector">
                <label className={`mode-option ${importModal.mode === 'merge' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importModal.mode === 'merge'}
                    onChange={() => setImportModal((prev) => ({ ...prev, mode: 'merge' }))}
                  />
                  <div className="mode-option-text">
                    <span className="mode-title">智能追加合并 (Merge - 推荐)</span>
                    <span className="mode-desc">保留现有便签，按最新修改时间去重合并，不丢失现有内容</span>
                  </div>
                </label>

                <label className={`mode-option ${importModal.mode === 'overwrite' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importModal.mode === 'overwrite'}
                    onChange={() => setImportModal((prev) => ({ ...prev, mode: 'overwrite' }))}
                  />
                  <div className="mode-option-text">
                    <span className="mode-title">完全覆盖替换 (Overwrite)</span>
                    <span className="mode-desc">以备份文件中的数据为准，彻底替换本地对应模块</span>
                  </div>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setImportModal({ isOpen: false, rawJson: '', snapshot: null, meta: null, mode: 'merge' })}
                  className="settings-btn settings-btn-secondary"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="settings-btn settings-btn-primary"
                >
                  确认导入恢复
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            模态弹窗 2：出厂重置二次防误触确认
            ================================================================= */}
        {resetModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3 style={{ color: '#ff3b30' }}>确定要恢复出厂设置吗？</h3>
                <p>
                  此操作将永久清空保存在此浏览器中的所有便签草稿、代码草稿与偏好配置。若未提前备份，数据将无法找回。
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  请在下方输入框中键入大写 <strong>RESET</strong> 以确认执行：
                </p>
                <input
                  type="text"
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  placeholder="在此输入 RESET"
                  className="danger-confirm-input"
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="settings-btn settings-btn-secondary"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  disabled={resetConfirmInput.trim().toUpperCase() !== 'RESET'}
                  className="settings-btn settings-btn-danger"
                >
                  确认清空并重置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            模态弹窗 3：修改站点访问密码
            ================================================================= */}
        {changePwdModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3>修改站点访问密码</h3>
                <p>
                  请输入当前原密码，并设置新的访问密码。修改成功后新密码即刻生效。
                </p>
              </div>

              <form onSubmit={handleExecuteChangePwd} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    原密码（初次默认为 520）：
                  </label>
                  <input
                    type="password"
                    value={oldPwdInput}
                    onChange={(e) => setOldPwdInput(e.target.value)}
                    placeholder="请输入当前原密码"
                    className="danger-confirm-input"
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    新访问密码：
                  </label>
                  <input
                    type="password"
                    value={newPwdInput}
                    onChange={(e) => setNewPwdInput(e.target.value)}
                    placeholder="请输入新密码"
                    className="danger-confirm-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    再次确认新密码：
                  </label>
                  <input
                    type="password"
                    value={confirmPwdInput}
                    onChange={(e) => setConfirmPwdInput(e.target.value)}
                    placeholder="请再次输入新密码"
                    className="danger-confirm-input"
                  />
                </div>

                {pwdError && (
                  <div style={{ color: '#ff453a', fontSize: '0.84rem' }}>
                    ⚠️ {pwdError}
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setChangePwdModalOpen(false)}
                    className="settings-btn settings-btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="settings-btn settings-btn-primary"
                  >
                    确认修改密码
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <footer className="apple-footer">
          <p>Ly · Settings & Data Management Center</p>
        </footer>
      </div>
    </main>
  );
}
