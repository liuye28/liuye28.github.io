import React from 'react';
import { readingList, inspirationNotes } from '../../data/profileData';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

// 拟物书本封面背景渐变色调
const BOOK_COVERS = [
  'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)', // 皇家深蓝
  'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)', // 典雅深绯
  'linear-gradient(135deg, #065f46 0%, #022c22 100%)', // 祖母翡翠
  'linear-gradient(135deg, #581c87 0%, #3b0764 100%)', // 帝王紫
  'linear-gradient(135deg, #334155 0%, #0f172a 100%)', // 曜石玄黑
  'linear-gradient(135deg, #78350f 0%, #451a03 100%)'  // 青铜深珀
];

/**
 * 根据书本状态返回样式类名
 */
function getStatusClass(status = '') {
  switch (status) {
    case '在读中':
      return 'reading-status-reading';
    case '已读完':
      return 'reading-status-finished';
    case '常读常新':
      return 'reading-status-evergreen';
    default:
      return 'reading-status-default';
  }
}

/**
 * 在读书单与灵感便签组件（ReadingSection）
 *
 * 遵循 Apple HIG 拟物与极简美学：
 * 1. 在读书单板块（Reading Bookshelf）：拟物立体书脊封面、书名、作者、分类、阅读状态胶囊、5 星评分与核心体会引用
 * 2. 灵感便签流板块（Inspiration Notes）：卡片展示日期、主题标签、正文，配备一键复制便签文本（2 秒微光反馈）
 * 3. 全局兼容深浅色模式 CSS 变量与全屏幕自适应
 *
 * @param {object} props
 * @param {Array} [props.books=readingList] 书籍数据列表
 * @param {Array} [props.notes=inspirationNotes] 灵感便签数据列表
 */
export default function ReadingSection({
  books = readingList,
  notes = inspirationNotes
}) {
  const bookItems = Array.isArray(books) ? books : readingList;
  const noteItems = Array.isArray(notes) ? notes : inspirationNotes;

  // 使用复制 Hook（2 秒定时还原）
  const [copiedId, copy] = useCopyToClipboard(2000);

  return (
    <div className="reading-section-wrapper" aria-label="在读书单与灵感便签">
      <style>{`
        .reading-section-wrapper {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3.25rem;
        }

        .reading-block {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .reading-header-group {
          margin-bottom: 1.5rem;
        }

        .reading-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.4rem;
        }

        .reading-title-indicator {
          width: 4px;
          height: 20px;
          border-radius: var(--radius-pill, 9999px);
          background: linear-gradient(180deg, #ff9500 0%, #af52de 100%);
          flex-shrink: 0;
        }

        .reading-title-indicator-notes {
          background: linear-gradient(180deg, #34c759 0%, #0071e3 100%);
        }

        .reading-section-title {
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--text-primary, #1d1d1f);
          margin: 0;
          font-family: var(--font-sans);
        }

        .reading-section-subtitle {
          font-size: 0.92rem;
          color: var(--text-secondary, #86868b);
          margin: 0;
          line-height: 1.55;
          padding-left: calc(4px + 0.65rem);
        }

        /* 书单网格排版 */
        .reading-books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.35rem;
          width: 100%;
        }

        .reading-book-card {
          background-color: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          border-radius: var(--radius-lg, 18px);
          padding: 1.4rem;
          box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.03));
          transition: var(--transition-fast, all 0.2s cubic-bezier(0.16, 1, 0.3, 1));
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .reading-book-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-card-hover, 0 12px 30px rgba(0, 0, 0, 0.08));
          border-color: var(--border-hover, rgba(0, 0, 0, 0.12));
        }

        .reading-book-main-header {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 0.95rem;
        }

        /* 拟物立体书本色块 */
        .reading-book-cover {
          width: 46px;
          height: 64px;
          border-radius: 3px 6px 6px 3px;
          flex-shrink: 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.25), inset 3px 0 4px rgba(0, 0, 0, 0.4);
          user-select: none;
          color: #ffffff;
        }

        .reading-book-cover::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: rgba(255, 255, 255, 0.2);
        }

        .reading-book-cover-icon {
          width: 22px;
          height: 22px;
          opacity: 0.9;
        }

        .reading-book-meta {
          flex: 1;
          min-width: 0;
        }

        .reading-book-title {
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: var(--text-primary, #1d1d1f);
          margin: 0 0 0.25rem 0;
          line-height: 1.35;
          word-break: break-word;
        }

        .reading-book-author-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: var(--text-secondary, #86868b);
          margin-bottom: 0.45rem;
        }

        .reading-book-category-pill {
          display: inline-flex;
          align-items: center;
          padding: 1px 6px;
          border-radius: var(--radius-pill, 9999px);
          background-color: var(--bg-surface-secondary, #f0f0f2);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          font-size: 0.72rem;
        }

        .reading-badges-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.2rem;
        }

        /* 状态胶囊 */
        .reading-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: var(--radius-pill, 9999px);
          line-height: 1.3;
        }

        .reading-status-reading {
          background-color: rgba(10, 132, 255, 0.12);
          color: var(--accent-color, #0a84ff);
          border: 1px solid rgba(10, 132, 255, 0.25);
        }

        .reading-status-finished {
          background-color: rgba(52, 199, 89, 0.12);
          color: #34c759;
          border: 1px solid rgba(52, 199, 89, 0.25);
        }

        .reading-status-evergreen {
          background-color: rgba(175, 82, 222, 0.12);
          color: #af52de;
          border: 1px solid rgba(175, 82, 222, 0.25);
        }

        .reading-status-default {
          background-color: var(--bg-surface-secondary, #f0f0f2);
          color: var(--text-secondary, #86868b);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
        }

        .reading-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: currentColor;
        }

        /* 评分星星 */
        .reading-star-list {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 0.88rem;
          user-select: none;
        }

        .reading-star-filled {
          color: #ff9f0a;
        }

        .reading-star-empty {
          color: var(--border-hover, rgba(0, 0, 0, 0.15));
        }

        /* 核心体会引用块 */
        .reading-quote-box {
          margin-top: 0.75rem;
          padding: 0.75rem 0.9rem;
          background-color: var(--bg-surface-secondary, #f0f0f2);
          border-left: 3px solid var(--accent-color, #0071e3);
          border-radius: 0 var(--radius-sm, 10px) var(--radius-sm, 10px) 0;
          font-size: 0.85rem;
          color: var(--text-primary, #1d1d1f);
          line-height: 1.6;
          position: relative;
        }

        .reading-quote-mark {
          font-family: Georgia, serif;
          font-size: 1.1rem;
          color: var(--text-tertiary, #a1a1a6);
          margin-right: 0.25rem;
          line-height: 1;
        }

        /* 灵感便签板块 */
        .reading-notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
          gap: 1.25rem;
          width: 100%;
        }

        .reading-note-card {
          background-color: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          border-radius: var(--radius-lg, 18px);
          padding: 1.35rem;
          box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.03));
          transition: var(--transition-fast, all 0.2s cubic-bezier(0.16, 1, 0.3, 1));
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .reading-note-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-card-hover, 0 12px 30px rgba(0, 0, 0, 0.08));
          border-color: var(--border-hover, rgba(0, 0, 0, 0.12));
        }

        .reading-note-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px dashed var(--border-subtle, rgba(0, 0, 0, 0.06));
        }

        .reading-note-tag-group {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .reading-note-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.74rem;
          font-weight: 500;
          background-color: var(--accent-light, #e8f2fc);
          color: var(--accent-color, #0071e3);
        }

        .reading-note-date {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          color: var(--text-tertiary, #a1a1a6);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .reading-note-content {
          font-size: 0.9rem;
          color: var(--text-primary, #1d1d1f);
          line-height: 1.68;
          margin: 0;
          flex-grow: 1;
        }

        .reading-note-footer {
          margin-top: 1.15rem;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .reading-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 4px 10px;
          border-radius: var(--radius-pill, 9999px);
          font-size: 0.76rem;
          font-weight: 500;
          background-color: var(--bg-surface-secondary, #f0f0f2);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          color: var(--text-secondary, #86868b);
          cursor: pointer;
          transition: var(--transition-fast, all 0.2s ease);
        }

        .reading-copy-btn:hover {
          background-color: var(--bg-hover, rgba(0, 0, 0, 0.04));
          color: var(--text-primary, #1d1d1f);
          border-color: var(--border-hover, rgba(0, 0, 0, 0.12));
          transform: translateY(-1px);
        }

        .reading-copy-btn:active {
          transform: scale(0.97);
        }

        .reading-copy-btn.copied {
          background-color: rgba(52, 199, 89, 0.15) !important;
          color: #34c759 !important;
          border-color: rgba(52, 199, 89, 0.3) !important;
        }

        .reading-btn-icon {
          width: 13px;
          height: 13px;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .reading-section-wrapper {
            gap: 2.25rem;
          }
          .reading-books-grid,
          .reading-notes-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .reading-book-card,
          .reading-note-card {
            padding: 1.15rem;
          }
          .reading-section-title {
            font-size: 1.28rem;
          }
          .reading-section-subtitle {
            font-size: 0.86rem;
            padding-left: 0;
          }
          .reading-section-title-wrap {
            gap: 0.5rem;
          }
        }
      `}</style>

      {/* 在读书单板块 */}
      <section className="reading-block" aria-labelledby="reading-heading">
        <div className="reading-header-group">
          <div className="reading-section-title-wrap">
            <span className="reading-title-indicator" aria-hidden="true" />
            <h2 id="reading-heading" className="reading-section-title">
              在读书单 (Reading Bookshelf)
            </h2>
          </div>
          <p className="reading-section-subtitle">
            精选底层原理、分布式系统架构与软件工程心智模型，构建坚实技术壁垒。
          </p>
        </div>

        <div className="reading-books-grid">
          {bookItems.map((book, index) => {
            const coverGradient = BOOK_COVERS[index % BOOK_COVERS.length];
            const ratingValue = typeof book.rating === 'number' ? book.rating : 5;

            return (
              <article key={book.title || index} className="reading-book-card">
                <div className="reading-book-main-header">
                  {/* 拟物立体书本封面 */}
                  <div
                    className="reading-book-cover"
                    style={{ background: coverGradient }}
                    aria-hidden="true"
                    title={book.title}
                  >
                    <svg
                      className="reading-book-cover-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>

                  <div className="reading-book-meta">
                    <h3 className="reading-book-title">{book.title}</h3>
                    <div className="reading-book-author-row">
                      <span>{book.author}</span>
                      {book.category && (
                        <span className="reading-book-category-pill">
                          {book.category}
                        </span>
                      )}
                    </div>

                    <div className="reading-badges-row">
                      {/* 阅读状态胶囊 */}
                      <span
                        className={`reading-status-pill ${getStatusClass(
                          book.status
                        )}`}
                      >
                        <span className="reading-status-dot" />
                        {book.status || '阅读中'}
                      </span>

                      {/* 5 星视觉打分 */}
                      <div
                        className="reading-star-list"
                        role="img"
                        aria-label={`评分 ${ratingValue} 星`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={
                              star <= ratingValue
                                ? 'reading-star-filled'
                                : 'reading-star-empty'
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 核心体会与金句引用 */}
                {book.quote && (
                  <div className="reading-quote-box">
                    <span className="reading-quote-mark" aria-hidden="true">
                      “
                    </span>
                    <span>{book.quote}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* 灵感便签流板块 */}
      <section className="reading-block" aria-labelledby="notes-heading">
        <div className="reading-header-group">
          <div className="reading-section-title-wrap">
            <span
              className="reading-title-indicator reading-title-indicator-notes"
              aria-hidden="true"
            />
            <h2 id="notes-heading" className="reading-section-title">
              灵感便签流 (Inspiration Notes)
            </h2>
          </div>
          <p className="reading-section-subtitle">
            工程实践、架构审视与思维火花的碎片化沉淀，捕捉心流时刻的思考切片。
          </p>
        </div>

        <div className="reading-notes-grid">
          {noteItems.map((note, index) => {
            const noteKey = note.id || `note-${index}`;
            const isCopied = copiedId === noteKey;

            return (
              <article key={noteKey} className="reading-note-card">
                <div className="reading-note-header">
                  <div className="reading-note-tag-group">
                    {note.tag && (
                      <span className="reading-note-tag">{note.tag}</span>
                    )}
                  </div>
                  {note.date && (
                    <div className="reading-note-date">
                      <svg
                        className="reading-btn-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <time dateTime={note.date}>{note.date}</time>
                    </div>
                  )}
                </div>

                <p className="reading-note-content">{note.content}</p>

                <div className="reading-note-footer">
                  <button
                    type="button"
                    onClick={() => copy(note.content, noteKey)}
                    className={`reading-copy-btn ${isCopied ? 'copied' : ''}`}
                    aria-label={`复制便签：${note.tag || '内容'}`}
                    title={isCopied ? '已复制到剪贴板' : '一键复制便签'}
                  >
                    {isCopied ? (
                      <>
                        <svg
                          className="reading-btn-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>已复制 ✓</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="reading-btn-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>复制便签</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export { ReadingSection };
