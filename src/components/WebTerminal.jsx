import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeSetJSON } from '../utils/storage';
import './WebTerminal.css';

const WELCOME_MESSAGE = `Ly's Workspace Terminal [Version 2.0.0]
(c) 2026 Ly. All rights reserved. 100% Pure Client-side.
输入 'help' 可列出所有支持的命令，输入 'matrix' 触发代码雨彩蛋。`;

export default function WebTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([
    { type: 'system', text: WELCOME_MESSAGE }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);

  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // 绑定全局打开/关闭触发器与按键监听 (` 反引号)
  useEffect(() => {
    window.toggleWebTerminal = () => {
      setIsOpen((prev) => !prev);
    };

    const handleKeyDown = (e) => {
      if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (showMatrix) {
          setShowMatrix(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete window.toggleWebTerminal;
    };
  }, [isOpen, showMatrix]);

  // 展开时自动聚焦输入框并滚到底部
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  // Matrix 代码雨 Canvas 动画引擎
  useEffect(() => {
    if (!showMatrix || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01アイウエオカキクケコサシスセソタチツテトJAVA0101XYZ';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    let animationId;
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [showMatrix]);

  // 命令解释执行器
  const handleExecute = (e) => {
    if (e.key !== 'Enter') return;
    const cmd = inputVal.trim();
    setInputVal('');

    if (!cmd) return;

    // 添加输入行
    const newHistory = [...history, { type: 'cmd', text: `ly@workspace:~$ ${cmd}` }];

    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const arg = parts[1];

    switch (mainCmd) {
      case 'help':
        newHistory.push({
          type: 'output',
          text: `支持的常用命令列表：
  help               - 显示此帮助信息
  tools              - 列出全部 18 款实用小工具
  open <tool_id>     - 快速直达指定小工具 (如 open ozon-calc, open diff)
  nav                - 返回网站导航首页
  cheatsheet         - 打开极简技术速查备忘录
  about              - 打开关于我与技术雷达
  theme <dark|light> - 切换全站深浅外观 (如 theme dark)
  date               - 查看当前本地时间与莫斯科时区时间
  matrix             - 触发黑客帝国全屏代码雨特效
  clear              - 清空终端屏幕
  exit               - 关闭终端浮层`
        });
        break;

      case 'tools':
        newHistory.push({
          type: 'output',
          text: `可用小工具 ID 列表：
  [开发] sql-to-pojo, diff, json-to-java, cron, code-pad, timestamp, regex, curl
  [跨境] ozon-rich, ozon-size, ozon-calc
  [编码] json, codec, jwt
  [安全] base-convert, hash
  [专注] scratchpad, zen-focus
输入 'open <id>' (如 open diff) 即可直达！`
        });
        break;

      case 'open':
        if (!arg) {
          newHistory.push({ type: 'error', text: '错误: 请输入工具 ID，例如 open diff 或 open ozon-calc' });
        } else {
          newHistory.push({ type: 'output', text: `正在跳转至 /tools/${arg} ...` });
          navigate(`/tools/${arg}`);
          setIsOpen(false);
        }
        break;

      case 'nav':
        navigate('/');
        setIsOpen(false);
        break;

      case 'cheatsheet':
        navigate('/cheatsheet');
        setIsOpen(false);
        break;

      case 'about':
        navigate('/about');
        setIsOpen(false);
        break;

      case 'date':
        const now = new Date();
        const mskOffset = 3; // UTC+3
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const mskTime = new Date(utc + (3600000 * mskOffset));
        newHistory.push({
          type: 'output',
          text: `本地时间: ${now.toLocaleString()}\n莫斯科时区 (MSK / UTC+3): ${mskTime.toLocaleString()}`
        });
        break;

      case 'theme':
        if (arg === 'dark' || arg === 'light') {
          document.documentElement.setAttribute('data-theme', arg);
          safeSetJSON('theme_pref', { theme: arg, manual: true });
          newHistory.push({ type: 'output', text: `已成功切换为 ${arg} 外观。` });
        } else {
          newHistory.push({ type: 'error', text: '用法: theme dark 或 theme light' });
        }
        break;

      case 'matrix':
        setShowMatrix(true);
        newHistory.push({ type: 'system', text: '已启动代码雨特效 (按 ESC 或点击屏幕任意位置退出)' });
        break;

      case 'clear':
        setHistory([]);
        return;

      case 'exit':
      case 'quit':
        setIsOpen(false);
        break;

      default:
        newHistory.push({
          type: 'error',
          text: `未知命令: '${cmd}'. 输入 'help' 查看支持的命令。`
        });
        break;
    }

    setHistory(newHistory);
  };

  return (
    <>
      {/* 全屏 Matrix 代码雨 Canvas */}
      {showMatrix && (
        <canvas
          ref={canvasRef}
          className="matrix-canvas-fullscreen"
          onClick={() => setShowMatrix(false)}
          title="点击任意位置退出代码雨"
        />
      )}

      {/* 终端底部浮层 */}
      <div className={`web-terminal-overlay ${isOpen ? 'open' : ''}`}>
        <div className="web-terminal-window">
          <div className="web-terminal-header">
            <div className="terminal-dots">
              <div className="terminal-dot red" onClick={() => setIsOpen(false)} title="关闭 (ESC)" />
              <div className="terminal-dot yellow" onClick={() => setHistory([])} title="清屏" />
              <div className="terminal-dot green" onClick={() => setShowMatrix(true)} title="代码雨" />
            </div>
            <div className="terminal-title">ly@workspace: ~ (zsh) · 快捷键 ` 唤出</div>
            <div style={{ width: '40px' }} />
          </div>

          <div className="web-terminal-body" ref={bodyRef}>
            {history.map((item, idx) => (
              <div key={idx} className={`terminal-line ${item.type}`}>
                <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                  {item.text}
                </pre>
              </div>
            ))}

            <div className="terminal-input-row">
              <span className="terminal-prompt">ly@workspace:~$</span>
              <input
                ref={inputRef}
                type="text"
                className="terminal-input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleExecute}
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
