import React, { useState, useEffect, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';

const STORAGE_KEY_NOTES = 'personweb_local_scratchpad_notes';

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: '临时开发备忘与接口待办',
    content: `1. 优化 Ozon 尺码表俄文自动翻译规则
2. 梳理 Spring Boot 事务失效排查手册
3. 学习 Java 21 Virtual Threads 虚拟线程性能表现`,
    updatedAt: Date.now()
  },
  {
    id: 'note-2',
    title: '常用 Linux 排查备忘 ID',
    content: `生产容器 ID: 8f9b21a4e0c1
Prometheus 监控端口: 9090
测试用鉴权 Token: eyJhbGciOiJIUzI1Ni...`,
    updatedAt: Date.now() - 3600000
  }
];

/**
 * 格式化相对更新时间
 */
function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffHours = (now.getTime() - d.getTime()) / 3600000;
  if (diffHours < 24 && now.getDate() === d.getDate()) {
    const h = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
    const m = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes();
    return `今天 ${h}:${m}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * Apple Notes 风格本地极简便签
 */
export default function LocalScratchpad() {
  const [notes, setNotes] = useState(() => {
    const parsed = safeGetJSON(STORAGE_KEY_NOTES, null);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_NOTES;
  });

  const [activeId, setActiveId] = useState(() => (notes[0] ? notes[0].id : null));
  const [searchWord, setSearchWord] = useState('');
  const [copied, copy] = useCopyToClipboard();

  // 本地存储自动保存
  useEffect(() => {
    safeSetJSON(STORAGE_KEY_NOTES, notes);
  }, [notes]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeId) || notes[0];
  }, [notes, activeId]);

  // 便签过滤
  const filteredNotes = useMemo(() => {
    const q = searchWord.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, searchWord]);

  // 新建便签
  const handleCreateNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: '新建便签',
      content: '',
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveId(newNote.id);
  };

  // 更新便签内容
  const handleUpdateActive = (field, val) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNote.id) {
          const updated = { ...n, [field]: val, updatedAt: Date.now() };
          if (field === 'content' && (!n.title || n.title === '新建便签')) {
            const firstLine = val.trim().split('\n')[0];
            if (firstLine) {
              updated.title = firstLine.slice(0, 20);
            }
          }
          return updated;
        }
        return n;
      })
    );
  };

  // 删除便签
  const handleDeleteActive = () => {
    if (!activeNote) return;
    const remaining = notes.filter((n) => n.id !== activeNote.id);
    setNotes(remaining);
    if (remaining.length > 0) {
      setActiveId(remaining[0].id);
    } else {
      setActiveId(null);
    }
  };

  // 备份导出为 JSON
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `scratchpad_backup_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // 从 JSON 恢复导入
  const handleImport = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          setNotes(imported);
          if (imported.length > 0) setActiveId(imported[0].id);
        }
      } catch {
        alert('导入失败：无效的 JSON 便签文件格式');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyContent = () => {
    if (!activeNote) return;
    copy(activeNote.content);
  };

  return (
    <ToolLayout
      title="Apple Notes 风格本地极简便签"
      desc="数据完全存储在本地浏览器 localStorage，开箱即用，绝对隐私安全，支持一键备份与恢复"
    >
      <div className="tool-grid-2col" style={{ gridTemplateColumns: '300px 1fr' }}>
        {/* 左侧：便签列表 */}
        <section className="tool-section" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>备忘录清单 ({notes.length})</span>
            <button
              type="button"
              className="apple-btn apple-btn-primary apple-btn-sm"
              onClick={handleCreateNote}
              title="新建便签"
            >
              + 新建
            </button>
          </div>

          <input
            type="text"
            className="apple-input"
            style={{ marginBottom: '0.75rem', fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
            placeholder="搜索便签内容..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((n) => {
                const isActive = activeNote && activeNote.id === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      padding: '0.65rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid transparent',
                      backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                      borderColor: isActive ? 'var(--border-focus)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                    onClick={() => setActiveId(n.id)}
                  >
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {n.title || '无标题便签'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      <span>{formatTime(n.updatedAt)}</span>
                      <span>{n.content ? `${n.content.length} 字` : '空'}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.825rem' }}>
                暂无匹配便签
              </div>
            )}
          </div>

          {/* 备份与恢复 */}
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={handleExport}
            >
              备份导出 (JSON)
            </button>
            <label
              className="apple-btn apple-btn-secondary apple-btn-sm"
              style={{ fontSize: '0.75rem', cursor: 'pointer', margin: 0 }}
            >
              恢复导入
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </section>

        {/* 右侧：便签编辑主展区 */}
        <section className="tool-section" style={{ display: 'flex', flexDirection: 'column' }}>
          {activeNote ? (
            <>
              <div className="tool-section-title" style={{ marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="apple-input"
                  style={{
                    border: 'none',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    padding: '0.25rem 0',
                    backgroundColor: 'transparent'
                  }}
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActive('title', e.target.value)}
                  placeholder="便签标题..."
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
                    onClick={handleCopyContent}
                  >
                    {copied ? '✓ 已复制' : '复制内容'}
                  </button>
                  <button
                    type="button"
                    className="apple-btn apple-btn-ghost apple-btn-sm"
                    style={{ color: '#ff453a' }}
                    onClick={handleDeleteActive}
                    title="删除当前便签"
                  >
                    删除
                  </button>
                </div>
              </div>

              <textarea
                className="apple-textarea"
                style={{
                  flex: 1,
                  minHeight: '460px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }}
                value={activeNote.content}
                onChange={(e) => handleUpdateActive('content', e.target.value)}
                placeholder="随手记下待办、临时配置、日志片段或灵感..."
              />
            </>
          ) : (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              请点击左侧“+ 新建”便签
            </div>
          )}
        </section>
      </div>
    </ToolLayout>
  );
}
