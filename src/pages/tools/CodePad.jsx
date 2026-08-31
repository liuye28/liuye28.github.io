import React, { useState, useEffect, useRef, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';
import './CodePad.css';

// 预置语言基础模板代码
const CODE_TEMPLATES = {
  empty: '',
  java: `public class Solution {
    public static void main(String[] args) {
        Solution solution = new Solution();
        // TODO: 在此调用并测试你的代码
        
    }

    public void solve() {
        
    }
}
`,
  javascript: `/**
 * @param {any} input
 * @return {any}
 */
function solution(input) {
    // TODO: 实现解题逻辑
    
}

// 测试用例
console.log(solution());
`,
  python: `def solution():
    # TODO: 实现解题逻辑
    pass


if __name__ == "__main__":
    solution()
`,
  golang: `package main

import "fmt"

func solve() {
    // TODO: 实现解题逻辑
    
}

func main() {
    solve()
    fmt.Println("Done")
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

class Solution {
public:
    void solve() {
        // TODO: 实现解题逻辑
        
    }
};

int main() {
    Solution sol;
    sol.solve();
    return 0;
}
`,
  sql: `-- 编写并测试你的 SQL 查询
SELECT 
    *
FROM 
    your_table
WHERE 
    1 = 1;
`
};

const STORAGE_KEY_CODE = 'ly_codepad_code_content';
const STORAGE_KEY_PROBLEM = 'ly_codepad_problem_content';
const STORAGE_KEY_CONFIG = 'ly_codepad_config';

/**
 * 代码练习板 (Code Scratchpad)
 * 专为网页题目手敲练习设计，无须开启笨重 IDE，智能控制缩进排版与分屏对照
 */
export default function CodePad() {
  // 状态初始化：从 LocalStorage 恢复或使用初始值
  const [code, setCode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CODE) || CODE_TEMPLATES.java;
  });

  const [problemNotes, setProblemNotes] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PROBLEM) || '/* 在此粘贴你在网页上看到的题目描述、输入输出样例或随手笔记...\n * 支持分屏对照手敲代码，不干扰右侧编辑区。\n */';
  });

  // 配置项：分屏、缩进大小、括号自动闭合、字号
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore error
      }
    }
    return {
      splitMode: true,
      indentSize: 4, // 2, 4, or 'tab'
      autoClosePairs: true,
      fontSize: 14 // px
    };
  });

  const [selectedTemplate, setSelectedTemplate] = useState('java');
  const [copySuccess, setCopySuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);

  // DOM 引用
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // 同步统计数据与本地持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CODE, code);
    setCharCount(code.length);
    setLineCount(code.split('\n').length);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROBLEM, problemNotes);
  }, [problemNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  // 同步行号滚动
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // 获取当前配置对应的缩进字符串
  const getIndentString = useCallback(() => {
    if (config.indentSize === 'tab') return '\t';
    return ' '.repeat(Number(config.indentSize) || 4);
  }, [config.indentSize]);

  // 核心键盘事件监听：处理 Tab 缩进、Shift+Tab 反向缩进、Enter 继承缩进、括号自动补全与成对跳过
  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const indentStr = getIndentString();
    const isMultiLine = selectionStart !== selectionEnd && value.slice(selectionStart, selectionEnd).includes('\n');

    // 1. 处理 Tab / Shift + Tab
    if (e.key === 'Tab') {
      e.preventDefault();

      if (isMultiLine) {
        // 多行选中批量缩进 / 批量反向缩进
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        let lineEnd = value.indexOf('\n', selectionEnd);
        if (lineEnd === -1) lineEnd = value.length;

        const selectedBlock = value.slice(lineStart, lineEnd);
        const lines = selectedBlock.split('\n');

        let modifiedLines;
        if (e.shiftKey) {
          // 反向缩进：移除行首缩进
          modifiedLines = lines.map(line => {
            if (line.startsWith(indentStr)) return line.slice(indentStr.length);
            if (line.startsWith('\t')) return line.slice(1);
            if (line.startsWith('  ')) return line.slice(2);
            if (line.startsWith(' ')) return line.slice(1);
            return line;
          });
        } else {
          // 正向缩进：行首增加缩进
          modifiedLines = lines.map(line => indentStr + line);
        }

        const newBlock = modifiedLines.join('\n');
        const updatedValue = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
        setCode(updatedValue);

        // 维持选中范围
        setTimeout(() => {
          textarea.setSelectionRange(lineStart, lineStart + newBlock.length);
        }, 0);
      } else {
        // 单行或无选中缩进
        if (e.shiftKey) {
          // 单行反向缩进
          const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
          const currentLine = value.slice(lineStart, selectionStart);
          let dedentCount = 0;
          if (currentLine.startsWith(indentStr)) {
            dedentCount = indentStr.length;
          } else if (currentLine.startsWith(' ')) {
            dedentCount = 1;
          }

          if (dedentCount > 0) {
            const updatedValue = value.slice(0, lineStart) + value.slice(lineStart + dedentCount);
            setCode(updatedValue);
            setTimeout(() => {
              const newPos = Math.max(lineStart, selectionStart - dedentCount);
              textarea.setSelectionRange(newPos, newPos);
            }, 0);
          }
        } else {
          // 插入缩进
          const updatedValue = value.slice(0, selectionStart) + indentStr + value.slice(selectionEnd);
          setCode(updatedValue);
          setTimeout(() => {
            const newPos = selectionStart + indentStr.length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        }
      }
      return;
    }

    // 2. 处理 Enter 换行自动继承缩进与大括号换行排版
    if (e.key === 'Enter') {
      e.preventDefault();

      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLineBeforeCursor = value.slice(lineStart, selectionStart);
      const leadingIndentMatch = currentLineBeforeCursor.match(/^[\t ]*/);
      let baseIndent = leadingIndentMatch ? leadingIndentMatch[0] : '';

      const trimmedBefore = currentLineBeforeCursor.trimEnd();
      const isBlockOpener = trimmedBefore.endsWith('{') || trimmedBefore.endsWith(':') || trimmedBefore.endsWith('(') || trimmedBefore.endsWith('[');
      const nextChar = value.slice(selectionStart, selectionStart + 1);

      // 特殊情况：处于 { 与 } 之间回车时，展开并保持两层缩进
      if (trimmedBefore.endsWith('{') && nextChar === '}') {
        const extraIndent = baseIndent + indentStr;
        const insertText = '\n' + extraIndent + '\n' + baseIndent;
        const updatedValue = value.slice(0, selectionStart) + insertText + value.slice(selectionEnd);
        setCode(updatedValue);

        setTimeout(() => {
          const cursorPosition = selectionStart + 1 + extraIndent.length;
          textarea.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
        return;
      }

      // 常规换行：继承上一行缩进，若行尾是开括号则加一级缩进
      let nextLineIndent = baseIndent;
      if (isBlockOpener) {
        nextLineIndent += indentStr;
      }

      const insertText = '\n' + nextLineIndent;
      const updatedValue = value.slice(0, selectionStart) + insertText + value.slice(selectionEnd);
      setCode(updatedValue);

      setTimeout(() => {
        const cursorPosition = selectionStart + insertText.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
      return;
    }

    // 3. 自动闭合括号与引号处理
    if (config.autoClosePairs) {
      const pairs = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'",
        '`': '`'
      };

      // 键入开括号/引号
      if (pairs[e.key]) {
        const closeChar = pairs[e.key];
        // 如果有选中文本，包裹选中文本
        if (selectionStart !== selectionEnd) {
          e.preventDefault();
          const selectedText = value.slice(selectionStart, selectionEnd);
          const wrapped = e.key + selectedText + closeChar;
          const updatedValue = value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd);
          setCode(updatedValue);
          setTimeout(() => {
            textarea.setSelectionRange(selectionStart + 1, selectionEnd + 1);
          }, 0);
          return;
        }

        // 无选中时，如果是引号且紧跟相同的字符，则直接跳过
        const nextChar = value.slice(selectionStart, selectionStart + 1);
        if ((e.key === '"' || e.key === "'" || e.key === '`') && nextChar === e.key) {
          e.preventDefault();
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
          return;
        }

        // 插入成对符号
        e.preventDefault();
        const updatedValue = value.slice(0, selectionStart) + e.key + closeChar + value.slice(selectionEnd);
        setCode(updatedValue);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }, 0);
        return;
      }

      // 键入闭合字符时，若下一个字符刚好是该闭合字符，则光标后移一位跳过
      if ([')', ']', '}', '"', "'", '`'].includes(e.key)) {
        const nextChar = value.slice(selectionStart, selectionStart + 1);
        if (nextChar === e.key) {
          e.preventDefault();
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
          return;
        }
      }

      // 处理 Backspace 删除成对符号
      if (e.key === 'Backspace' && selectionStart === selectionEnd && selectionStart > 0) {
        const prevChar = value.slice(selectionStart - 1, selectionStart);
        const nextChar = value.slice(selectionStart, selectionStart + 1);
        if (pairs[prevChar] && pairs[prevChar] === nextChar) {
          e.preventDefault();
          const updatedValue = value.slice(0, selectionStart - 1) + value.slice(selectionStart + 1);
          setCode(updatedValue);
          setTimeout(() => {
            textarea.setSelectionRange(selectionStart - 1, selectionStart - 1);
          }, 0);
          return;
        }
      }
    }
  };

  // 复制完整代码
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  // 载入模版
  const handleLoadTemplate = (tplKey) => {
    setSelectedTemplate(tplKey);
    if (tplKey && CODE_TEMPLATES[tplKey] !== undefined) {
      if (code.trim() && !window.confirm('加载模版将覆盖当前代码板内容，是否继续？')) {
        return;
      }
      setCode(CODE_TEMPLATES[tplKey]);
    }
  };

  // 清空代码
  const handleClearCode = () => {
    if (window.confirm('确定清空代码板内容吗？')) {
      setCode('');
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  // 清空题目笔记
  const handleClearNotes = () => {
    if (window.confirm('确定清空左侧题目/笔记内容吗？')) {
      setProblemNotes('');
    }
  };

  // 生成行号列表
  const lineNumbersArray = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  return (
    <ToolLayout
      title="代码练习板"
      desc="专为手敲练习与题目演算设计的轻量代码板。支持智能 Tab 缩进、回车继承对齐、双栏对照与防丢自动暂存。"
    >
      <div className="codepad-container">
        {/* 顶部总控制栏 */}
        <div className="codepad-toolbar">
          {/* 左侧主要操作组 */}
          <div className="codepad-toolbar-left">
            {/* 分屏对照模式切换 */}
            <button
              type="button"
              className={`apple-btn apple-btn-sm ${config.splitMode ? 'apple-btn-primary' : 'apple-btn-secondary'}`}
              onClick={() => setConfig(prev => ({ ...prev, splitMode: !prev.splitMode }))}
              title={config.splitMode ? '点击切换为纯净单栏全宽模式' : '点击开启双栏对照模式'}
            >
              <svg className="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
              <span>{config.splitMode ? '双栏对照' : '单栏专注'}</span>
            </button>

            {/* 语言模板快速载入 */}
            <div className="codepad-select-wrapper">
              <label className="codepad-label-inline">模板:</label>
              <select
                className="apple-select codepad-mini-select"
                value={selectedTemplate}
                onChange={(e) => handleLoadTemplate(e.target.value)}
                title="选择语言预置骨架代码"
              >
                <option value="empty">空白纯净板</option>
                <option value="java">Java Solution</option>
                <option value="javascript">JavaScript / Node</option>
                <option value="python">Python 3</option>
                <option value="golang">Go (Golang)</option>
                <option value="cpp">C++ 17</option>
                <option value="sql">SQL 查询</option>
              </select>
            </div>

            {/* 缩进设置 */}
            <div className="codepad-select-wrapper">
              <label className="codepad-label-inline">缩进:</label>
              <select
                className="apple-select codepad-mini-select"
                value={config.indentSize}
                onChange={(e) => setConfig(prev => ({ ...prev, indentSize: e.target.value }))}
                title="选择按下 Tab 键插入的缩进宽度"
              >
                <option value="4">4 空格</option>
                <option value="2">2 空格</option>
                <option value="tab">Tab 制表符</option>
              </select>
            </div>

            {/* 括号自动闭合开关 */}
            <button
              type="button"
              className={`codepad-toggle-btn ${config.autoClosePairs ? 'active' : ''}`}
              onClick={() => setConfig(prev => ({ ...prev, autoClosePairs: !prev.autoClosePairs }))}
              title="自动补全成对括号 () [] {} '' ''"
            >
              <span className="toggle-indicator"></span>
              <span>自动括号</span>
            </button>
          </div>

          {/* 右侧操作组 */}
          <div className="codepad-toolbar-right">
            {/* 字号缩放 */}
            <div className="codepad-font-controls">
              <button
                type="button"
                className="apple-btn apple-btn-secondary apple-btn-sm codepad-icon-btn"
                onClick={() => setConfig(prev => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 1) }))}
                title="缩小字号"
              >
                A-
              </button>
              <span className="codepad-font-size-text">{config.fontSize}px</span>
              <button
                type="button"
                className="apple-btn apple-btn-secondary apple-btn-sm codepad-icon-btn"
                onClick={() => setConfig(prev => ({ ...prev, fontSize: Math.min(22, prev.fontSize + 1) }))}
                title="放大字号"
              >
                A+
              </button>
            </div>

            {/* 一键复制代码 */}
            <button
              type="button"
              className={`apple-btn apple-btn-sm ${copySuccess ? 'apple-btn-primary' : 'apple-btn-secondary'}`}
              onClick={handleCopyCode}
              title="复制全部代码到剪贴板"
            >
              {copySuccess ? (
                <>
                  <svg className="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <svg className="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>复制代码</span>
                </>
              )}
            </button>

            {/* 清空代码 */}
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm codepad-clear-btn"
              onClick={handleClearCode}
              title="清空当前代码输入区"
            >
              清空
            </button>
          </div>
        </div>

        {/* 主体工作区 (双栏分屏 或 单栏沉浸) */}
        <div className={`codepad-workspace ${config.splitMode ? 'split-layout' : 'single-layout'}`}>
          {/* 左侧：题目 / 参考草稿区 (仅在分屏模式展示) */}
          {config.splitMode && (
            <div className="codepad-pane codepad-problem-pane">
              <div className="codepad-pane-header">
                <div className="codepad-pane-title">
                  <svg className="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>题目描述 / 参考用例</span>
                </div>
                <div className="codepad-pane-actions">
                  <button
                    type="button"
                    className="codepad-text-btn"
                    onClick={handleClearNotes}
                    title="清空题目区"
                  >
                    清空题目
                  </button>
                </div>
              </div>
              <div className="codepad-pane-content">
                <textarea
                  className="codepad-problem-textarea"
                  value={problemNotes}
                  onChange={(e) => setProblemNotes(e.target.value)}
                  placeholder="在此粘贴或记录你在网页、LeetCode、牛客或博客中看到的题目要求、输入输出测试用例或思路要点..."
                  spellCheck="false"
                />
              </div>
            </div>
          )}

          {/* 右侧：代码编辑主窗口 */}
          <div className="codepad-pane codepad-editor-pane">
            <div className="codepad-pane-header">
              <div className="codepad-pane-title">
                <svg className="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span>手写代码板</span>
                <span className="codepad-autosave-badge">● 本地自动保存</span>
              </div>
              <div className="codepad-stats-info">
                <span>{lineCount} 行</span>
                <span className="stat-divider">/</span>
                <span>{charCount} 字符</span>
              </div>
            </div>

            <div className="codepad-editor-body" style={{ fontSize: `${config.fontSize}px` }}>
              {/* 行号侧栏 */}
              <div className="codepad-linenumbers" ref={lineNumbersRef} aria-hidden="true">
                {lineNumbersArray.map((num) => (
                  <div key={num} className="codepad-line-num">
                    {num}
                  </div>
                ))}
              </div>

              {/* 核心输入文本域 */}
              <textarea
                ref={textareaRef}
                className="codepad-code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder="开始手敲你的代码逻辑... (支持 Tab 智能缩进、Shift+Tab 反向对齐、回车继承上一行缩进)"
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
              />
            </div>
          </div>
        </div>

        {/* 底部贴心小贴士 */}
        <div className="codepad-footer-tips">
          <div className="tip-item">
            <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> 智能缩进与反向缩进
          </div>
          <div className="tip-item">
            <kbd>Enter</kbd> 智能继承上一行缩进（遇 <code>{'{'}</code> 自动换行缩进展开）
          </div>
          <div className="tip-item">
            <kbd>() [] {} ""</kbd> 成对自动包裹与自动闭合
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
