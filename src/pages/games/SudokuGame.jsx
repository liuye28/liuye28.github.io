import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader, { formatGameTime } from '../../components/games/GameHeader.jsx';
import GameHelpModal from '../../components/games/GameHelpModal.jsx';
import GameOverModal from '../../components/games/GameOverModal.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import {
  generateSudokuPuzzle,
  findConflicts,
  getValidCandidates,
  isBoardComplete,
  copyBoard,
  createEmptyBoard,
} from '../../utils/games/sudokuLogic.js';
import { gameAudio } from '../../utils/gameAudio.js';
import { getGameRecord, updateRecord } from '../../utils/gameStorage.js';
import './GamesCommon.css';

/**
 * 难度配置
 */
const DIFFICULTY_CONFIG = [
  { key: 'easy', name: '初级', clues: '36~40 提示', desc: '轻松入门 · 逻辑推演' },
  { key: 'medium', name: '中级', clues: '30~34 提示', desc: '进阶挑战 · 技巧并用' },
  { key: 'hard', name: '高级', clues: '24~28 提示', desc: '硬核数独 · 深度推演' },
];

/**
 * 9×9 候选笔记矩阵初始化工具
 */
function createEmptyNotes() {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );
}

/**
 * 候选笔记矩阵深拷贝
 */
function cloneNotes(notesMatrix) {
  return notesMatrix.map(row => row.map(set => new Set(set)));
}

/**
 * 数独经典益智游戏页面 (SudokuGame)
 *
 * 核心特性：
 * 1. Apple HIG 磨砂玻璃科技拟态与 9×9 九宫格多级粗细边框；
 * 2. 聚光灯十字交互：选中单元格时同行、同列、所属 3×3 宫格及全盘所有相同数字均柔和高亮；
 * 3. 实时冲突呼吸警示：当同行/列/宫产生重复数字时，冲突格呈现暗红微动效警示；
 * 4. 候选笔记（Pencil Notes）：空单元格内 3×3 微型网格排布 1~9 候选字，支持填数自动联动排除；
 * 5. 全键盘与移动端虚拟按键双端支持：数字键 1~9、Shift 笔记、方向键导航、撤销、擦除；
 * 6. 原生 Web Audio 交互音效、自动秒表计时与最佳用时本地持久化。
 */
export default function SudokuGame() {
  usePageTitle('数独');
  const navigate = useNavigate();

  // 难度与关卡出题数据
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzleData, setPuzzleData] = useState(() => {
    return generateSudokuPuzzle('easy') || {
      initialBoard: createEmptyBoard(),
      solutionBoard: createEmptyBoard(),
    };
  });

  // 棋盘数据与候选笔记
  const [board, setBoard] = useState(() => copyBoard(puzzleData.initialBoard));
  const [notes, setNotes] = useState(() => createEmptyNotes());

  // 交互控制状态
  const [selectedCell, setSelectedCell] = useState(null); // [r, c] | null
  const [pencilMode, setPencilMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [moveCount, setMoveCount] = useState(0);

  // 游戏流程与计时状态
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'won'
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 弹窗与战绩存储
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [records, setRecords] = useState(() => getGameRecord('sudoku'));

  // 定时器引用与 Refs
  const timerRef = useRef(null);
  const modalTimerRef = useRef(null);
  const elapsedTimeRef = useRef(0);
  elapsedTimeRef.current = elapsedTime;

  const currentDiffConfig = useMemo(
    () => DIFFICULTY_CONFIG.find(d => d.key === difficulty) || DIFFICULTY_CONFIG[0],
    [difficulty]
  );

  // 战绩数据计算
  const currentBestTime = useMemo(() => {
    if (difficulty === 'easy') return records.easyBestTime;
    if (difficulty === 'medium') return records.mediumBestTime;
    if (difficulty === 'hard') return records.hardBestTime;
    return null;
  }, [difficulty, records]);

  // 全盘数字出现频次统计（9个即完成）
  const numberCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val >= 1 && val <= 9) {
          counts[val]++;
        }
      }
    }
    return counts;
  }, [board]);

  // 剩余未填空格数
  const emptyCellsCount = useMemo(() => {
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) count++;
      }
    }
    return count;
  }, [board]);

  // 全盘冲突坐标集合
  const conflicts = useMemo(() => findConflicts(board), [board]);

  // 选中的格子的数值
  const selectedValue = useMemo(() => {
    if (!selectedCell) return 0;
    const [r, c] = selectedCell;
    return board[r][c] || 0;
  }, [selectedCell, board]);

  // 计时器驱动
  useEffect(() => {
    if (gameState === 'playing' && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, isPaused]);

  // 清理模态框计时器
  useEffect(() => {
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
        modalTimerRef.current = null;
      }
    };
  }, []);

  /**
   * 记录历史状态快照以供撤销 (Undo)
   */
  const saveSnapshot = useCallback((curBoard, curNotes) => {
    setHistory(prev => {
      const next = [...prev, { board: copyBoard(curBoard), notes: cloneNotes(curNotes) }];
      if (next.length > 50) next.shift();
      return next;
    });
  }, []);

  /**
   * 启动游戏计时
   */
  const ensureGameStarted = useCallback(() => {
    if (gameState === 'idle') {
      setGameState('playing');
    }
  }, [gameState]);

  /**
   * 切换难度
   */
  const handleDifficultyChange = useCallback((newDiff) => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    setIsGameOverModalOpen(false);
    setIsPaused(false);
    setDifficulty(newDiff);
    setGameState('idle');
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    setSelectedCell(null);
    setHistory([]);
    setMoveCount(0);

    const newPuzzle = generateSudokuPuzzle(newDiff) || {
      initialBoard: createEmptyBoard(),
      solutionBoard: createEmptyBoard(),
    };
    setPuzzleData(newPuzzle);
    setBoard(copyBoard(newPuzzle.initialBoard));
    setNotes(createEmptyNotes());
  }, []);

  /**
   * 重置当前谜题
   */
  const handleRestart = useCallback(() => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    setIsGameOverModalOpen(false);
    setIsPaused(false);
    setGameState('idle');
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    setSelectedCell(null);
    setHistory([]);
    setMoveCount(0);
    setBoard(copyBoard(puzzleData.initialBoard));
    setNotes(createEmptyNotes());
    gameAudio.playSudokuErase();
  }, [puzzleData]);

  /**
   * 单元格选择
   */
  const handleSelectCell = useCallback((r, c) => {
    if (gameState === 'won' || isPaused) return;
    setSelectedCell([r, c]);
  }, [gameState, isPaused]);

  /**
   * 录入数字 (常规填数或候选笔记)
   */
  const handleInputNumber = useCallback((num, forcePencil = false) => {
    if (gameState === 'won' || isPaused || !selectedCell) return;
    const [r, c] = selectedCell;

    // 题设初始线索不可编辑
    if (puzzleData.initialBoard[r][c] !== 0) return;

    ensureGameStarted();
    const isPencilAction = forcePencil || pencilMode;

    if (isPencilAction) {
      // 笔记模式：切换候选数
      saveSnapshot(board, notes);
      const nextNotes = cloneNotes(notes);
      if (nextNotes[r][c].has(num)) {
        nextNotes[r][c].delete(num);
      } else {
        nextNotes[r][c].add(num);
      }
      setNotes(nextNotes);
      setMoveCount(prev => prev + 1);
      gameAudio.playSudokuPencil();
    } else {
      // 正常填数模式
      const currentVal = board[r][c];

      // 若点击已填入的相同数字，则快捷清除
      if (currentVal === num) {
        saveSnapshot(board, notes);
        const nextBoard = copyBoard(board);
        nextBoard[r][c] = 0;
        setBoard(nextBoard);
        setMoveCount(prev => prev + 1);
        gameAudio.playSudokuErase();
        return;
      }

      saveSnapshot(board, notes);
      const nextBoard = copyBoard(board);
      nextBoard[r][c] = num;

      // 联动自动清除当前格笔记，以及同行、同列、同宫的该候选数
      const nextNotes = cloneNotes(notes);
      nextNotes[r][c].clear();
      for (let i = 0; i < 9; i++) {
        nextNotes[r][i].delete(num);
        nextNotes[i][c].delete(num);
      }
      const boxStartR = Math.floor(r / 3) * 3;
      const boxStartC = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          nextNotes[boxStartR + dr][boxStartC + dc].delete(num);
        }
      }

      setBoard(nextBoard);
      setNotes(nextNotes);
      setMoveCount(prev => prev + 1);

      // 实时冲突音效反馈
      const nextConflicts = findConflicts(nextBoard);
      if (nextConflicts.has(`${r},${c}`)) {
        gameAudio.playSudokuError();
      } else {
        gameAudio.playSudokuPencil();
      }

      // 检验整盘是否成功通关
      if (isBoardComplete(nextBoard)) {
        setGameState('won');
        gameAudio.playWin();

        const finalSeconds = Math.max(1, elapsedTimeRef.current);
        const updated = updateRecord('sudoku', {
          level: difficulty,
          time: finalSeconds,
        });
        setRecords(updated);

        if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
        modalTimerRef.current = setTimeout(() => {
          setIsGameOverModalOpen(true);
        }, 500);
      }
    }
  }, [
    gameState,
    isPaused,
    selectedCell,
    puzzleData,
    pencilMode,
    board,
    notes,
    ensureGameStarted,
    saveSnapshot,
    difficulty,
  ]);

  /**
   * 擦除当前选中格 (数字与笔记)
   */
  const handleErase = useCallback(() => {
    if (gameState === 'won' || isPaused || !selectedCell) return;
    const [r, c] = selectedCell;

    if (puzzleData.initialBoard[r][c] !== 0) return;
    if (board[r][c] === 0 && notes[r][c].size === 0) return;

    ensureGameStarted();
    saveSnapshot(board, notes);

    const nextBoard = copyBoard(board);
    nextBoard[r][c] = 0;
    const nextNotes = cloneNotes(notes);
    nextNotes[r][c].clear();

    setBoard(nextBoard);
    setNotes(nextNotes);
    setMoveCount(prev => prev + 1);
    gameAudio.playSudokuErase();
  }, [gameState, isPaused, selectedCell, puzzleData, board, notes, ensureGameStarted, saveSnapshot]);

  /**
   * 撤销上一步操作
   */
  const handleUndo = useCallback(() => {
    if (gameState === 'won' || isPaused || history.length === 0) return;

    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setBoard(copyBoard(previous.board));
    setNotes(cloneNotes(previous.notes));
    setMoveCount(prev => prev + 1);
    gameAudio.playSudokuErase();
  }, [gameState, isPaused, history]);

  /**
   * 智能候选数推导 (单格或全盘推导)
   */
  const handleAutoCandidates = useCallback(() => {
    if (gameState === 'won' || isPaused) return;

    ensureGameStarted();
    saveSnapshot(board, notes);

    const nextNotes = cloneNotes(notes);
    let changed = false;

    // 若当前选中了空格，且该格候选数尚未完整填入，则推导当前格
    if (selectedCell && board[selectedCell[0]][selectedCell[1]] === 0) {
      const [r, c] = selectedCell;
      const cands = getValidCandidates(board, r, c);
      const curSet = nextNotes[r][c];
      const needsUpdate = cands.length !== curSet.size || cands.some(n => !curSet.has(n));

      if (needsUpdate) {
        nextNotes[r][c] = new Set(cands);
        changed = true;
      }
    }

    // 若当前格已推导完或未选中空格，则为全盘所有空格自动推导候选
    if (!changed) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === 0) {
            const cands = getValidCandidates(board, r, c);
            nextNotes[r][c] = new Set(cands);
            changed = true;
          }
        }
      }
    }

    if (changed) {
      setNotes(nextNotes);
      setMoveCount(prev => prev + 1);
      gameAudio.playSudokuPencil();
    }
  }, [gameState, isPaused, ensureGameStarted, saveSnapshot, board, notes, selectedCell]);

  // 全局键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isHelpOpen || isGameOverModalOpen) return;
      if (e.altKey) return;

      // 撤销快捷键 Ctrl+Z / Cmd+Z / U
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) return;

      // 方向键导航
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell(prev => {
          if (!prev) return [4, 4];
          const [r, c] = prev;
          if (e.key === 'ArrowUp') return [(r - 1 + 9) % 9, c];
          if (e.key === 'ArrowDown') return [(r + 1) % 9, c];
          if (e.key === 'ArrowLeft') return [r, (c - 1 + 9) % 9];
          if (e.key === 'ArrowRight') return [r, (c + 1) % 9];
          return prev;
        });
        return;
      }

      // 数字键 1 ~ 9 (支持 Shift 强制笔记)
      const numMatch = e.key.match(/^[1-9]$/);
      if (numMatch) {
        e.preventDefault();
        const digit = parseInt(numMatch[0], 10);
        handleInputNumber(digit, e.shiftKey);
        return;
      }

      // 擦除键 Backspace / Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleErase();
        return;
      }

      // 铅笔笔记模式切换 P / N
      if (e.key === 'p' || e.key === 'P' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setPencilMode(prev => !prev);
        return;
      }

      // 重新开局 R
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
        return;
      }

      // 取消选中 Esc
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedCell(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isHelpOpen,
    isGameOverModalOpen,
    handleUndo,
    handleInputNumber,
    handleErase,
    handleRestart,
  ]);

  // 模态弹窗统计数据
  const modalStats = [
    { label: '游戏难度', value: currentDiffConfig.name },
    { label: '通关耗时', value: formatGameTime(elapsedTime), highlight: true },
    {
      label: '历史纪录',
      value: currentBestTime ? formatGameTime(currentBestTime) : formatGameTime(elapsedTime),
    },
    { label: '推演步数', value: `${moveCount} 步` },
  ];

  return (
    <div className="game-page-container">
      {/* 统一顶部导航与状态栏 */}
      <GameHeader
        title="数独"
        time={elapsedTime}
        onRestart={handleRestart}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(prev => !prev)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="game-stage-wrapper">
        <div className="game-board-card sudoku-card">
          {/* Apple HIG 胶囊分段难度切换 */}
          <div className="sudoku-diff-selector" role="tablist" aria-label="难度选择">
            {DIFFICULTY_CONFIG.map(diff => {
              const isSelected = difficulty === diff.key;
              return (
                <button
                  key={diff.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`sudoku-diff-tab ${isSelected ? 'active' : ''}`}
                  onClick={() => handleDifficultyChange(diff.key)}
                >
                  <span className="diff-name">{diff.name}</span>
                  <span className="diff-desc">{diff.clues}</span>
                </button>
              );
            })}
          </div>

          {/* 实时状态指示面板 */}
          <div className="sudoku-status-bar">
            <div className="sudoku-status-item">
              <span className="status-label">难度</span>
              <span className="status-value">{currentDiffConfig.name}</span>
            </div>
            <div className="sudoku-status-item">
              <span className="status-label">时间</span>
              <span className="status-value timer">{formatGameTime(elapsedTime)}</span>
            </div>
            <div className="sudoku-status-item">
              <span className="status-label">待填空格</span>
              <span className="status-value">{emptyCellsCount}</span>
            </div>
            <div className="sudoku-status-item">
              <span className="status-label">最佳纪录</span>
              <span className="status-value">
                {currentBestTime ? formatGameTime(currentBestTime) : '--:--'}
              </span>
            </div>
          </div>

          {/* 9×9 数独棋盘主视口 */}
          <div className="sudoku-board-viewport">
            <div
              className="sudoku-grid"
              role="grid"
              aria-label="数独 9×9 棋盘"
            >
              {board.map((row, r) =>
                row.map((val, c) => {
                  const isInitial = puzzleData.initialBoard[r][c] !== 0;
                  const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                  const isConflict = conflicts.has(`${r},${c}`);

                  let isSameRow = false;
                  let isSameCol = false;
                  let isSameBox = false;
                  let isSameValue = false;

                  if (selectedCell) {
                    const [selR, selC] = selectedCell;
                    const selVal = board[selR][selC];
                    isSameRow = r === selR;
                    isSameCol = c === selC;
                    isSameBox =
                      Math.floor(r / 3) === Math.floor(selR / 3) &&
                      Math.floor(c / 3) === Math.floor(selC / 3);
                    isSameValue = selVal > 0 && val === selVal;
                  }

                  const isCrosshair = isSameRow || isSameCol || isSameBox;

                  // 拼接九宫格边框与高亮类名
                  const cellClasses = ['sudoku-cell'];
                  if (isSelected) cellClasses.push('selected');
                  else if (isSameValue) cellClasses.push('same-value');
                  else if (isCrosshair) cellClasses.push('crosshair');

                  if (isConflict) cellClasses.push('conflict');
                  if (isInitial) cellClasses.push('initial');
                  else if (val > 0) cellClasses.push('player-filled');

                  // 3×3 粗线宫格分界
                  if (c === 2 || c === 5) cellClasses.push('subgrid-right');
                  if (r === 2 || r === 5) cellClasses.push('subgrid-bottom');

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={cellClasses.join(' ')}
                      onClick={() => handleSelectCell(r, c)}
                      role="gridcell"
                      aria-selected={isSelected}
                      aria-label={`第 ${r + 1} 行第 ${c + 1} 列，${
                        val > 0 ? `数字 ${val}` : '空格'
                      }`}
                    >
                      {val > 0 ? (
                        <span className="sudoku-cell-number">{val}</span>
                      ) : (
                        /* 3×3 候选笔记迷你网格 */
                        <div className="sudoku-notes-grid" aria-hidden="true">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <span
                              key={n}
                              className={`sudoku-note-item ${
                                notes[r][c]?.has(n) ? 'active' : ''
                              }`}
                            >
                              {notes[r][c]?.has(n) ? n : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 暂停保护遮罩 */}
            {isPaused && (
              <div className="sudoku-pause-overlay">
                <div className="sudoku-pause-card">
                  <div className="pause-icon">⏸️</div>
                  <h3 className="pause-title">游戏已暂停</h3>
                  <p className="pause-subtitle">点击继续游戏按钮恢复对局推演</p>
                  <button
                    type="button"
                    className="game-btn game-btn-primary"
                    onClick={() => setIsPaused(false)}
                  >
                    继续对局
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 快捷操作药丸工具栏 */}
          <div className="sudoku-tools-row" role="group" aria-label="快捷工具栏">
            <button
              type="button"
              className={`sudoku-tool-pill ${pencilMode ? 'active-pencil' : ''}`}
              onClick={() => setPencilMode(prev => !prev)}
              title="切换正常填数 / 候选笔记模式 (快捷键: P)"
            >
              <span className="tool-icon">✏️</span>
              <span className="tool-text">笔记模式</span>
              <span className="tool-status-dot" />
            </button>

            <button
              type="button"
              className="sudoku-tool-pill"
              onClick={handleErase}
              title="擦除选中格数字或候选笔记 (快捷键: Delete)"
            >
              <span className="tool-icon">⌫</span>
              <span className="tool-text">橡皮擦</span>
            </button>

            <button
              type="button"
              className="sudoku-tool-pill"
              disabled={history.length === 0}
              onClick={handleUndo}
              title="撤销上一步操作 (快捷键: Ctrl+Z / U)"
            >
              <span className="tool-icon">↩️</span>
              <span className="tool-text">撤销</span>
              {history.length > 0 && <span className="tool-badge">{history.length}</span>}
            </button>

            <button
              type="button"
              className="sudoku-tool-pill"
              onClick={handleAutoCandidates}
              title="智能推导排除后的合法候选数 (快捷键: 💡)"
            >
              <span className="tool-icon">💡</span>
              <span className="tool-text">自动候选</span>
            </button>
          </div>

          {/* 底部 1~9 圆形数字键盘 (附带剩余待填数量徽章) */}
          <div className="sudoku-keypad" role="group" aria-label="数字输入键区">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
              const remaining = Math.max(0, 9 - (numberCounts[num] || 0));
              const isCompleted = remaining === 0;

              return (
                <button
                  key={num}
                  type="button"
                  disabled={isCompleted}
                  className={`sudoku-key-btn ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleInputNumber(num)}
                  aria-label={`数字 ${num}，剩余待填 ${remaining} 个`}
                  title={`数字 ${num} (剩余: ${remaining})`}
                >
                  <span className="key-num">{num}</span>
                  <span className="key-badge">
                    {isCompleted ? '✓' : remaining}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 快捷键提示条 */}
          <div className="sudoku-hint-bar">
            <span>键盘支持：1~9 填数 · Shift+1~9 记笔记 · 方向键移动 · Delete 擦除 · Ctrl+Z 撤销</span>
          </div>
        </div>
      </main>

      {/* 结算弹窗 */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        title="数独通关！"
        subtitle={`恭喜成功解开 ${currentDiffConfig.name} 数独谜题！`}
        stats={modalStats}
        onRestart={handleRestart}
        onBackHome={() => navigate('/games')}
      />

      {/* 玩法说明模态弹窗 */}
      <GameHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="数独"
        rules={[
          {
            label: '数独规则',
            desc: '在 9×9 网格中填入数字 1~9，使每一行、每一列以及每个 3×3 粗线宫格内的数字均不重复。',
          },
          {
            label: '初始线索',
            desc: '题设给出的深色粗体数字为固定线索，无法修改或擦除。',
          },
          {
            label: '聚光灯准星',
            desc: '选中任意格子时，同行、同列、所属 3×3 宫格及全盘所有相同数字均会呈现柔和高光底色，辅助排查。',
          },
          {
            label: '实时冲突警示',
            desc: '若填入的数字在同行/列/宫产生重复，冲突单元格会立即呈现暗红色呼吸动效警示。',
          },
          {
            label: '候选笔记',
            desc: '遇到难以直观确定的格子可开启“笔记模式”，在格子内标注备选数；填入正式数字时会自动联动清除周边冲突笔记。',
          },
          {
            label: '自动候选',
            desc: '点击“💡 自动候选”可自动为你推导排除后的合法候选数。',
          },
        ]}
        keys={[
          { key: '1 ~ 9', desc: '在选中格填入数字' },
          { key: 'Shift + 1~9', desc: '在选中格切换候选笔记' },
          { key: '↑ / ↓ / ← / →', desc: '在网格中移动选中格' },
          { key: 'Delete / Backspace', desc: '擦除选中格数字或候选笔记' },
          { key: 'P / N', desc: '开启 / 关闭笔记模式' },
          { key: 'Ctrl + Z / U', desc: '撤销上一步操作' },
          { key: 'R', desc: '重新开始当前谜题' },
          { key: 'Esc', desc: '取消选中单元格' },
        ]}
      />

      {/* 数独专用微动效与响应式样式表 */}
      <style>{`
        .sudoku-card {
          gap: 1.15rem;
          padding: 1.5rem 1.25rem;
        }

        /* 1. 分段难度选择器 */
        .sudoku-diff-selector {
          display: flex;
          align-items: center;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          padding: 4px;
          gap: 4px;
          width: 100%;
          max-width: 440px;
          box-sizing: border-box;
        }

        .sudoku-diff-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: var(--radius-pill);
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
        }

        .sudoku-diff-tab:hover:not(.active) {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .sudoku-diff-tab.active {
          background: var(--bg-surface);
          border-color: var(--border-hover);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .sudoku-diff-tab .diff-name {
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.2;
        }

        .sudoku-diff-tab .diff-desc {
          font-size: 0.675rem;
          color: var(--text-tertiary);
          margin-top: 1px;
        }

        .sudoku-diff-tab.active .diff-name {
          color: var(--accent-color);
        }

        /* 2. 状态指示仪表盘 */
        .sudoku-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 440px;
          gap: 0.5rem;
        }

        .sudoku-status-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.4rem 0.5rem;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          text-align: center;
        }

        .sudoku-status-item .status-label {
          font-size: 0.675rem;
          color: var(--text-tertiary);
          font-weight: 500;
          margin-bottom: 2px;
        }

        .sudoku-status-item .status-value {
          font-size: 0.95rem;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: var(--text-primary);
        }

        .sudoku-status-item .status-value.timer {
          color: var(--accent-color);
        }

        /* 3. 9×9 棋盘与视口 */
        .sudoku-board-viewport {
          position: relative;
          width: 100%;
          max-width: 440px;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sudoku-grid {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          grid-template-rows: repeat(9, 1fr);
          border: 2.5px solid var(--border-hover);
          border-radius: var(--radius-md);
          background: var(--bg-surface);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
          overflow: hidden;
          user-select: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        /* 单个单元格 */
        .sudoku-cell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          background: transparent;
          transition: background-color 0.12s ease;
          overflow: hidden;
        }

        .sudoku-cell:nth-child(9n) {
          border-right: none;
        }

        .sudoku-cell:nth-child(n + 73) {
          border-bottom: none;
        }

        /* 3×3 粗线宫格清晰分界 */
        .sudoku-cell.subgrid-right {
          border-right: 2.5px solid var(--text-secondary) !important;
        }

        .sudoku-cell.subgrid-bottom {
          border-bottom: 2.5px solid var(--text-secondary) !important;
        }

        /* 数字字体排印：初始给定粗黑，玩家填入呈现科技主题色 */
        .sudoku-cell-number {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          font-size: clamp(1.2rem, 3.8vw, 1.8rem);
          line-height: 1;
          user-select: none;
          transition: transform 0.1s ease;
        }

        .sudoku-cell.initial .sudoku-cell-number {
          font-weight: 800;
          color: var(--text-primary);
        }

        .sudoku-cell.player-filled .sudoku-cell-number {
          font-weight: 700;
          color: var(--accent-color);
        }

        /* 聚光灯十字交互 */
        .sudoku-cell.crosshair {
          background-color: rgba(99, 102, 241, 0.08);
        }

        /* 全盘相同数字高亮 */
        .sudoku-cell.same-value {
          background-color: rgba(99, 102, 241, 0.22);
        }

        .sudoku-cell.same-value .sudoku-cell-number {
          transform: scale(1.05);
        }

        /* 选中格高光环与焦点提升 */
        .sudoku-cell.selected {
          background-color: rgba(99, 102, 241, 0.32) !important;
          box-shadow: inset 0 0 0 2px var(--accent-color);
          z-index: 3;
        }

        /* 冲突数字呼吸警示动效 */
        .sudoku-cell.conflict {
          animation: sudokuConflictPulse 1.4s ease-in-out infinite alternate !important;
        }

        .sudoku-cell.conflict .sudoku-cell-number {
          color: #ef4444 !important;
        }

        @keyframes sudokuConflictPulse {
          0% {
            background-color: rgba(239, 68, 68, 0.18);
            box-shadow: inset 0 0 0 1.5px rgba(239, 68, 68, 0.45);
          }
          100% {
            background-color: rgba(239, 68, 68, 0.38);
            box-shadow: inset 0 0 0 2.5px rgba(239, 68, 68, 0.9), 0 0 12px rgba(239, 68, 68, 0.35);
          }
        }

        /* 4. 候选笔记 (Pencil Notes) 3×3 迷你网格 */
        .sudoku-notes-grid {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          padding: 2px;
          box-sizing: border-box;
          pointer-events: none;
        }

        .sudoku-note-item {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: clamp(8px, 1.9vw, 11px);
          font-weight: 600;
          line-height: 1;
          color: transparent;
        }

        .sudoku-note-item.active {
          color: var(--text-tertiary);
        }

        .sudoku-cell.selected .sudoku-note-item.active,
        .sudoku-cell.crosshair .sudoku-note-item.active {
          color: var(--text-secondary);
        }

        /* 5. 暂停保护遮罩 */
        .sudoku-pause-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: var(--radius-md);
          animation: gameFadeIn 0.2s ease-out;
        }

        .sudoku-pause-card {
          text-align: center;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
        }

        .pause-icon {
          font-size: 2rem;
        }

        .pause-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .pause-subtitle {
          font-size: 0.825rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 0.5rem 0;
        }

        /* 6. 快捷药丸工具栏 */
        .sudoku-tools-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 440px;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .sudoku-tool-pill {
          flex: 1;
          min-width: 80px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          color: var(--text-primary);
          font-size: 0.825rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .sudoku-tool-pill:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }

        .sudoku-tool-pill:active:not(:disabled) {
          transform: translateY(1px);
        }

        .sudoku-tool-pill:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .sudoku-tool-pill.active-pencil {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: #ffffff;
          box-shadow: 0 4px 12px var(--accent-light);
        }

        .tool-icon {
          font-size: 0.95rem;
          line-height: 1;
        }

        .tool-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.8;
        }

        .tool-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: var(--radius-pill);
          background: var(--border-hover);
          font-size: 0.675rem;
          font-weight: 600;
          font-family: ui-monospace, SFMono-Regular, monospace;
        }

        /* 7. 虚拟按键区 */
        .sudoku-keypad {
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          gap: 6px;
          width: 100%;
          max-width: 440px;
          box-sizing: border-box;
        }

        .sudoku-key-btn {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          padding: 2px;
        }

        .sudoku-key-btn:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--accent-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--accent-light);
        }

        .sudoku-key-btn:active:not(:disabled) {
          transform: scale(0.94);
        }

        .sudoku-key-btn.completed {
          opacity: 0.35;
          cursor: default;
          border-color: transparent;
        }

        .key-num {
          font-size: clamp(1.1rem, 3.2vw, 1.45rem);
          font-weight: 700;
          line-height: 1.1;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .key-badge {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-tertiary);
          font-family: ui-monospace, SFMono-Regular, monospace;
          line-height: 1;
          margin-top: 2px;
        }

        .sudoku-key-btn.completed .key-badge {
          color: var(--accent-color);
          font-weight: 700;
        }

        /* 8. 快捷键提示条 */
        .sudoku-hint-bar {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.4;
          width: 100%;
          max-width: 440px;
        }

        /* 9. 移动端极小屏幕响应式优化 (340px ~ 480px) */
        @media (max-width: 480px) {
          .sudoku-card {
            padding: 1rem 0.65rem;
            gap: 0.85rem;
          }

          .sudoku-diff-tab {
            padding: 5px 6px;
          }

          .sudoku-diff-tab .diff-name {
            font-size: 0.8rem;
          }

          .sudoku-diff-tab .diff-desc {
            font-size: 0.625rem;
          }

          .sudoku-status-item {
            padding: 0.3rem 0.35rem;
          }

          .sudoku-status-item .status-value {
            font-size: 0.875rem;
          }

          .sudoku-tools-row {
            gap: 0.35rem;
          }

          .sudoku-tool-pill {
            min-width: 70px;
            height: 34px;
            font-size: 0.775rem;
            gap: 0.3rem;
            padding: 0 6px;
          }

          .sudoku-keypad {
            gap: 4px;
          }

          .sudoku-key-btn {
            border-radius: var(--radius-sm);
          }

          .key-num {
            font-size: 1.15rem;
          }

          .key-badge {
            font-size: 0.6rem;
          }

          .sudoku-hint-bar {
            display: none; /* 移动端触屏隐藏纯键盘说明，保留纯粹简洁体验 */
          }
        }
      `}</style>
    </div>
  );
}
