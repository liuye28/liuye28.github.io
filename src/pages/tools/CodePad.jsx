import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';
import './CodePad.css';

// LeetCode 经典语言预置代码模版
const LEETCODE_TEMPLATES = {
  java: {
    name: 'Java (17+)',
    monacoLang: 'java',
    template: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // TODO: 请在此手敲实现你的解题逻辑
        
        return new int[0];
    }
}
`
  },
  python: {
    name: 'Python 3',
    monacoLang: 'python',
    template: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # TODO: 请在此手敲实现你的解题逻辑
        pass
`
  },
  cpp: {
    name: 'C++ 17',
    monacoLang: 'cpp',
    template: `#include <vector>
#include <unordered_map>
#include <iostream>

using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // TODO: 请在此手敲实现你的解题逻辑
        
        return {};
    }
};
`
  },
  golang: {
    name: 'Go (Golang)',
    monacoLang: 'go',
    template: `package main

func twoSum(nums []int, target int) []int {
    // TODO: 请在此手敲实现你的解题逻辑
    
    return []int{}
}
`
  },
  javascript: {
    name: 'JavaScript (ES6)',
    monacoLang: 'javascript',
    template: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // TODO: 请在此手敲实现你的解题逻辑
    
};
`
  },
  sql: {
    name: 'MySQL / SQL',
    monacoLang: 'sql',
    template: `-- Write your SQL query statement below
SELECT 
    name,
    score
FROM 
    StudentScores
WHERE 
    score >= 60
ORDER BY 
    score DESC;
`
  }
};

const STORAGE_KEY_CODE = 'ly_leetcode_pad_code';
const STORAGE_KEY_PROBLEM = 'ly_leetcode_pad_problem';
const STORAGE_KEY_CONFIG = 'ly_leetcode_pad_config';

const DEFAULT_PROBLEM_TEXT = `【题目描述】
给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出 和为目标值 target 的那两个整数，并返回它们的数组下标。

【示例 1】
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。

【提示】
* 2 <= nums.length <= 10^4
* -10^9 <= nums[i] <= 10^9
* -10^9 <= target <= 10^9
* 只会存在一个有效答案
`;

/**
 * LeetCode 风格专业代码练习板 (Powered by Monaco Editor)
 */
export default function CodePad() {
  const editorRef = useRef(null);

  // 语言选择与代码内容
  const [currentLang, setCurrentLang] = useState(() => {
    return 'java';
  });

  const [code, setCode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CODE) || LEETCODE_TEMPLATES.java.template;
  });

  const [problemNotes, setProblemNotes] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PROBLEM) || DEFAULT_PROBLEM_TEXT;
  });

  // 配置项：双栏对照、全屏沉浸、主题、字号、小地图、自动换行
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
      zenMode: false,
      theme: 'vs-dark', // 'vs-dark', 'light', 'hc-black'
      fontSize: 14,
      minimap: false,
      wordWrap: 'on',
      tabSize: 4
    };
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [stats, setStats] = useState({ lines: 1, chars: 0 });

  // 本地自动持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CODE, code || '');
    const lines = (code || '').split('\n').length;
    setStats({ lines, chars: (code || '').length });
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROBLEM, problemNotes);
  }, [problemNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  // 全屏模式下监听 Esc 退出
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' && config.zenMode) {
        setConfig(prev => ({ ...prev, zenMode: false }));
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [config.zenMode]);

  // Monaco Editor 挂载完成回调
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // 自定义深色 LeetCode 风格主题
    monaco.editor.defineTheme('leetcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e80',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070'
      }
    });

    if (config.theme === 'vs-dark') {
      monaco.editor.setTheme('leetcode-dark');
    }
  };

  // 切换编程语言
  const handleLanguageChange = (newLangKey) => {
    setCurrentLang(newLangKey);
    const targetTpl = LEETCODE_TEMPLATES[newLangKey];
    if (targetTpl) {
      if (!code.trim() || window.confirm(`是否载入 ${targetTpl.name} 的 LeetCode 默认解题模版？`)) {
        setCode(targetTpl.template);
      }
    }
  };

  // 重置为当前语言默认模版
  const handleResetTemplate = () => {
    const currentTpl = LEETCODE_TEMPLATES[currentLang];
    if (currentTpl && window.confirm(`确定还原为 ${currentTpl.name} 的默认 LeetCode 模版吗？`)) {
      setCode(currentTpl.template);
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };

  // 代码格式化
  const handleFormatCode = () => {
    if (editorRef.current) {
      const action = editorRef.current.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
      }
    }
  };

  // 复制代码
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  // 清空代码
  const handleClearCode = () => {
    if (window.confirm('确定清空代码编辑器内容吗？')) {
      setCode('');
      if (editorRef.current) editorRef.current.focus();
    }
  };

  // 插入样例模板至题目区
  const handleInsertExample = () => {
    const sample = `\n【新示例】\n输入：\n输出：\n解释：\n`;
    setProblemNotes(prev => prev + sample);
  };

  // 工作台主体 UI
  const workbenchContent = (
    <div className={`leetcode-workbench ${config.zenMode ? 'zen-mode' : ''}`}>
      {/* 顶部 LeetCode 经典黑晶控制条 */}
      <div className="leetcode-topbar">
        {/* 左侧区域：语言选择、重置、格式化 */}
        <div className="topbar-left">
          {/* 语言选择下拉 */}
          <div className="leetcode-select-group">
            <svg className="leetcode-top-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <select
              className="leetcode-lang-select"
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              title="选择编程语言"
            >
              {Object.entries(LEETCODE_TEMPLATES).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="topbar-divider" />

          {/* 还原默认代码模版 */}
          <button
            type="button"
            className="leetcode-bar-btn"
            onClick={handleResetTemplate}
            title="还原为 LeetCode 默认类定义"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>重置模版</span>
          </button>

          {/* 格式化代码 */}
          <button
            type="button"
            className="leetcode-bar-btn"
            onClick={handleFormatCode}
            title="格式化代码 (Format Code)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="3" y2="18" />
            </svg>
            <span>格式化</span>
          </button>

          {/* 分屏对照切换 */}
          <button
            type="button"
            className={`leetcode-bar-btn ${config.splitMode ? 'active' : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, splitMode: !prev.splitMode }))}
            title={config.splitMode ? '隐藏左侧题目，切换为纯净单栏' : '展开左侧题目对照区'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            <span>{config.splitMode ? '分屏对照' : '单栏模式'}</span>
          </button>
        </div>

        {/* 右侧区域：主题、字号、小地图、全屏、复制 */}
        <div className="topbar-right">
          {/* 主题选择 */}
          <select
            className="leetcode-lang-select mini"
            value={config.theme}
            onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value }))}
            title="切换编辑器主题"
          >
            <option value="vs-dark">深色暗黑 (LeetCode)</option>
            <option value="light">清爽浅色</option>
            <option value="hc-black">高对比度</option>
          </select>

          {/* 字号调整 */}
          <div className="leetcode-font-adjust">
            <button
              type="button"
              className="font-btn"
              onClick={() => setConfig(prev => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 1) }))}
              title="缩小字号"
            >
              A-
            </button>
            <span className="font-val">{config.fontSize}</span>
            <button
              type="button"
              className="font-btn"
              onClick={() => setConfig(prev => ({ ...prev, fontSize: Math.min(22, prev.fontSize + 1) }))}
              title="放大字号"
            >
              A+
            </button>
          </div>

          {/* Minimap 开关 */}
          <button
            type="button"
            className={`leetcode-bar-btn icon-only ${config.minimap ? 'active' : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, minimap: !prev.minimap }))}
            title={config.minimap ? '隐藏小地图 (Minimap)' : '开启小地图 (Minimap)'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="17" y1="7" x2="19" y2="7" />
              <line x1="17" y1="11" x2="19" y2="11" />
            </svg>
          </button>

          {/* 网页沉浸全屏 Zen Mode 切换 */}
          <button
            type="button"
            className={`leetcode-bar-btn ${config.zenMode ? 'active' : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, zenMode: !prev.zenMode }))}
            title={config.zenMode ? '退出沉浸全屏模式 (Esc)' : '进入网页沉浸全屏模式 (Zen Mode)'}
          >
            {config.zenMode ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>退出全屏</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>沉浸全屏</span>
              </>
            )}
          </button>

          {/* 一键复制代码 */}
          <button
            type="button"
            className={`leetcode-bar-btn copy-btn ${copySuccess ? 'copied' : ''}`}
            onClick={handleCopyCode}
            title="复制代码到剪贴板"
          >
            {copySuccess ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>已复制</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="leetcode-bar-btn danger"
            onClick={handleClearCode}
            title="清空当前代码"
          >
            清空
          </button>
        </div>
      </div>

      {/* 工作区分割区：左侧题目 + 右侧 Monaco Editor */}
      <div className={`leetcode-split-area ${config.splitMode ? 'has-sidebar' : 'no-sidebar'}`}>
        {/* 左侧：题目描述与用例面板 */}
        {config.splitMode && (
          <aside className="leetcode-problem-panel">
            <div className="panel-tab-header">
              <div className="tab-title active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>题目描述 & 用例</span>
              </div>
              <div className="tab-actions">
                <button
                  type="button"
                  className="panel-mini-btn"
                  onClick={handleInsertExample}
                  title="插入用例模版"
                >
                  + 加示例
                </button>
                <button
                  type="button"
                  className="panel-mini-btn danger"
                  onClick={() => {
                    if (window.confirm('确定清空题目内容吗？')) setProblemNotes('');
                  }}
                  title="清空题目内容"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="panel-text-content">
              <textarea
                className="problem-textarea"
                value={problemNotes}
                onChange={(e) => setProblemNotes(e.target.value)}
                placeholder="在此粘贴题目描述、输入输出样例或笔记思路..."
                spellCheck="false"
              />
            </div>
          </aside>
        )}

        {/* 右侧：Monaco 代码编辑器 */}
        <main className="leetcode-editor-panel">
          <div className="editor-tab-bar">
            <div className="editor-active-tab">
              <span className="lang-indicator">●</span>
              <span>Solution.{currentLang === 'python' ? 'py' : currentLang === 'golang' ? 'go' : currentLang === 'cpp' ? 'cpp' : currentLang === 'sql' ? 'sql' : currentLang === 'javascript' ? 'js' : 'java'}</span>
            </div>
            <div className="editor-status-bar">
              <span className="auto-save-status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                实时暂存
              </span>
              <span className="status-item">{stats.lines} 行</span>
              <span className="status-item">{stats.chars} 字符</span>
            </div>
          </div>

          <div className="monaco-wrapper">
            <Editor
              height="100%"
              language={LEETCODE_TEMPLATES[currentLang]?.monacoLang || 'java'}
              value={code}
              theme={config.theme}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: config.fontSize,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Menlo, Monaco, monospace",
                fontLigatures: true,
                tabSize: config.tabSize,
                minimap: { enabled: config.minimap },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                guides: {
                  indentation: true,
                  bracketPairs: true
                },
                wordWrap: config.wordWrap,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                formatOnPaste: true,
                formatOnType: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                padding: { top: 12, bottom: 12 }
              }}
              loading={<div className="monaco-loading-spinner">正在加载 LeetCode 编辑器内核...</div>}
            />
          </div>
        </main>
      </div>

      {/* 底部快捷键状态提示 */}
      <footer className="leetcode-bottom-tips">
        <div className="tip-chip">
          <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> 智能缩进
        </div>
        <div className="tip-chip">
          <kbd>Alt+Shift+F</kbd> (Mac: Option+Shift+F) 格式化代码
        </div>
        <div className="tip-chip">
          <kbd>Ctrl+F</kbd> 代码查找替换
        </div>
        <div className="tip-chip">
          <kbd>Esc</kbd> 退出全屏
        </div>
      </footer>
    </div>
  );

  return (
    <ToolLayout
      title="代码练习板"
      desc="LeetCode 同款 Monaco Editor 沉浸式代码手敲工作台，支持真实语法高亮、代码折叠、智能缩进与双栏对照。"
    >
      {workbenchContent}
    </ToolLayout>
  );
}
