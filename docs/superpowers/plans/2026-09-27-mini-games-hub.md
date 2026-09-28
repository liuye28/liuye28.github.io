# 小游戏中心 (Mini Games Hub) 实施计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Ly's Workspace 构建一个具备 Apple HIG 极简质感、纯前端免后端、支持全键盘与移动端触控的「小游戏中心」，包含游戏大厅以及贪吃蛇（Snake）、2048、扫雷（Minesweeper）、记忆翻牌（Memory Match）四款完整小游戏与原生 Web Audio 音效系统。

**Architecture:** 采用“纯函数算法层 + 状态流转 Hook + 表现层”三层解耦架构，算法 100% 具备自动化单元测试（node --test）；贪吃蛇使用 Canvas 60FPS 渲染，其余三款采用 CSS3/DOM + 3D 转换实现细腻动效；通过 React.lazy 动态拆包，无缝打通全局 Header 导航、Command Palette (`⌘K`) 与 WebTerminal。

**Tech Stack:** React 18, React Router v7, HTML5 Canvas, Web Audio API, CSS Variables / Apple HIG Design System, Node.js native test runner (`node --test`).

**Spec:** `docs/superpowers/specs/2026-09-27-mini-games-design.md`

## Global Constraints
- 零外部大型游戏引擎依赖，必须保持纯前端轻量快速；
- 严禁浮点数精度与逻辑内存泄漏，定时器与事件监听必须在 unmount 时严谨清理；
- 完美契合深色（Dark）/ 浅色（Light）自适应，遵循现有 `var(--bg-primary)`, `var(--text-primary)`, `var(--border-subtle)` 等 CSS 变量；
- 所有纯函数算法必须通过 `npm test` 自动化验证，`npm run build` 零警告通过。

---

### Task 1: 基础设施层 —— 战绩持久化与原生合成音效引擎 (gameStorage & gameAudio)

**Files:**
- Create: `src/utils/gameStorage.js`
- Create: `src/utils/gameAudio.js`
- Test: `tests/gameStorage.test.js`

**Interfaces:**
- Consumes: `src/utils/storage.js` (`safeGetJSON`, `safeSetJSON`, `safeGetItem`, `safeSetItem`)
- Produces:
  - `gameStorage`: `{ getRecords, updateRecord, getGameRecord, resetRecords }`
  - `gameAudio`: `{ isMuted, toggleMute, setMuted, playMove, playEat, playMerge, playFlip, playExplosion, playWin, playLose }`

- [ ] **Step 1: 编写战绩存储的失败单测**

创建 `tests/gameStorage.test.js`：
```javascript
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage in Node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (k) => mockStorage.get(k) ?? null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
};

import { getRecords, getGameRecord, updateRecord, resetRecords } from '../src/utils/gameStorage.js';

describe('gameStorage test suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('默认返回初始战绩对象结构', () => {
    const records = getRecords();
    assert.equal(records.snake.bestScore, 0);
    assert.equal(records.game2048.bestScore, 0);
    assert.equal(records.minesweeper.bestTimeBeginner, null);
    assert.equal(records.memory.bestTurns, null);
  });

  test('更新贪吃蛇最高分与游玩次数', () => {
    updateRecord('snake', { score: 120 });
    const rec1 = getGameRecord('snake');
    assert.equal(rec1.bestScore, 120);
    assert.equal(rec1.playCount, 1);

    // 更低的分数不应冲掉最高分，但应增加游玩次数
    updateRecord('snake', { score: 80 });
    const rec2 = getGameRecord('snake');
    assert.equal(rec2.bestScore, 120);
    assert.equal(rec2.playCount, 2);
  });

  test('更新扫雷通关最快时间', () => {
    updateRecord('minesweeper', { level: 'beginner', time: 45 });
    assert.equal(getGameRecord('minesweeper').bestTimeBeginner, 45);

    // 更快的耗时覆盖
    updateRecord('minesweeper', { level: 'beginner', time: 30 });
    assert.equal(getGameRecord('minesweeper').bestTimeBeginner, 30);

    // 较慢的耗时不覆盖
    updateRecord('minesweeper', { level: 'beginner', time: 60 });
    assert.equal(getGameRecord('minesweeper').bestTimeBeginner, 30);
  });
});
```

- [ ] **Step 2: 运行单测验证失败**

运行：`node --test tests/gameStorage.test.js`
预期：FAIL，提示 `Cannot find module '../src/utils/gameStorage.js'`

- [ ] **Step 3: 实现 `src/utils/gameStorage.js`**

创建 `src/utils/gameStorage.js`：
```javascript
import { safeGetJSON, safeSetJSON } from './storage.js';

const STORAGE_KEY = 'games_records_v1';

const DEFAULT_RECORDS = {
  snake: { bestScore: 0, playCount: 0 },
  game2048: { bestScore: 0, maxTile: 0, playCount: 0 },
  minesweeper: { bestTimeBeginner: null, bestTimeIntermediate: null, playCount: 0 },
  memory: { bestTurns: null, bestTime: null, playCount: 0 },
};

export function getRecords() {
  const data = safeGetJSON(STORAGE_KEY, null);
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_RECORDS };
  }
  return {
    snake: { ...DEFAULT_RECORDS.snake, ...data.snake },
    game2048: { ...DEFAULT_RECORDS.game2048, ...data.game2048 },
    minesweeper: { ...DEFAULT_RECORDS.minesweeper, ...data.minesweeper },
    memory: { ...DEFAULT_RECORDS.memory, ...data.memory },
  };
}

export function getGameRecord(gameKey) {
  const records = getRecords();
  return records[gameKey] || DEFAULT_RECORDS[gameKey] || {};
}

export function updateRecord(gameKey, payload = {}) {
  const records = getRecords();
  const target = records[gameKey] || { playCount: 0 };
  target.playCount = (target.playCount || 0) + 1;

  if (gameKey === 'snake') {
    const { score = 0 } = payload;
    target.bestScore = Math.max(target.bestScore || 0, score);
  } else if (gameKey === 'game2048') {
    const { score = 0, maxTile = 0 } = payload;
    target.bestScore = Math.max(target.bestScore || 0, score);
    target.maxTile = Math.max(target.maxTile || 0, maxTile);
  } else if (gameKey === 'minesweeper') {
    const { level, time } = payload;
    if (typeof time === 'number' && time > 0) {
      if (level === 'beginner') {
        target.bestTimeBeginner = target.bestTimeBeginner === null
          ? time
          : Math.min(target.bestTimeBeginner, time);
      } else if (level === 'intermediate') {
        target.bestTimeIntermediate = target.bestTimeIntermediate === null
          ? time
          : Math.min(target.bestTimeIntermediate, time);
      }
    }
  } else if (gameKey === 'memory') {
    const { turns, time } = payload;
    if (typeof turns === 'number' && turns > 0) {
      target.bestTurns = target.bestTurns === null ? turns : Math.min(target.bestTurns, turns);
    }
    if (typeof time === 'number' && time > 0) {
      target.bestTime = target.bestTime === null ? time : Math.min(target.bestTime, time);
    }
  }

  records[gameKey] = target;
  safeSetJSON(STORAGE_KEY, records);
  return target;
}

export function resetRecords() {
  safeSetJSON(STORAGE_KEY, DEFAULT_RECORDS);
  return { ...DEFAULT_RECORDS };
}
```

- [ ] **Step 4: 实现 `src/utils/gameAudio.js`**

创建 `src/utils/gameAudio.js`：
```javascript
import { safeGetItem, safeSetItem } from './storage.js';

const MUTE_STORAGE_KEY = 'games_sound_muted';

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

class GameAudioEngine {
  constructor() {
    this._muted = safeGetItem(MUTE_STORAGE_KEY) === 'true';
  }

  isMuted() {
    return this._muted;
  }

  setMuted(muted) {
    this._muted = Boolean(muted);
    safeSetItem(MUTE_STORAGE_KEY, String(this._muted));
  }

  toggleMute() {
    this.setMuted(!this._muted);
    return this._muted;
  }

  _playTone(freq, type, duration, gainValue = 0.1, delay = 0) {
    if (this._muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime + delay;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // 容错降级
    }
  }

  playMove() {
    this._playTone(320, 'sine', 0.05, 0.04);
  }

  playEat() {
    this._playTone(523.25, 'triangle', 0.08, 0.1, 0); // C5
    this._playTone(659.25, 'triangle', 0.12, 0.1, 0.06); // E5
  }

  playMerge() {
    this._playTone(440, 'triangle', 0.08, 0.08, 0);
    this._playTone(880, 'sine', 0.15, 0.1, 0.05);
  }

  playFlip() {
    this._playTone(480, 'sine', 0.04, 0.05);
  }

  playExplosion() {
    this._playTone(110, 'sawtooth', 0.35, 0.2);
    this._playTone(70, 'triangle', 0.45, 0.2, 0.05);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this._playTone(freq, 'triangle', 0.25, 0.12, idx * 0.1);
    });
  }

  playLose() {
    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, idx) => {
      this._playTone(freq, 'sawtooth', 0.22, 0.08, idx * 0.12);
    });
  }
}

export const gameAudio = new GameAudioEngine();
```

- [ ] **Step 5: 重新运行单测验证通过**

运行：`node --test tests/gameStorage.test.js`
预期：PASS，所有测试通过。

- [ ] **Step 6: 提交代码**

```bash
git add src/utils/gameStorage.js src/utils/gameAudio.js tests/gameStorage.test.js
git commit -m "feat(games): add gameStorage & gameAudio infrastructure with tests"
```

---

### Task 2: 2048 核心算法与测试驱动 (game2048Logic)

**Files:**
- Create: `src/utils/games/game2048Logic.js`
- Test: `tests/game2048.test.js`

**Interfaces:**
- Produces:
  - `createEmptyBoard()`: returns 4x4 matrix initialized to 0
  - `addRandomTile(board)`: adds 2 (90%) or 4 (10%) to a random empty cell
  - `slideAndMergeLine(line)`: returns `{ line, score }`
  - `moveBoard(board, direction)`: direction: `'left' | 'right' | 'up' | 'down'`, returns `{ board, score, moved }`
  - `hasMovesAvailable(board)`: returns boolean
  - `hasWon(board)`: returns boolean (contains 2048)
  - `getMaxTile(board)`: returns highest number on board

- [ ] **Step 1: 编写 2048 算法单测**

创建 `tests/game2048.test.js`：
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyBoard,
  slideAndMergeLine,
  moveBoard,
  hasMovesAvailable,
  hasWon,
  getMaxTile,
} from '../src/utils/games/game2048Logic.js';

describe('2048 Logic Core Suite', () => {
  test('单行滑动合并行为符合 2048 原版规则', () => {
    // 基础滑动无合并
    const res1 = slideAndMergeLine([0, 2, 0, 0]);
    assert.deepEqual(res1.line, [2, 0, 0, 0]);
    assert.equal(res1.score, 0);

    // 简单两两合并
    const res2 = slideAndMergeLine([2, 2, 0, 0]);
    assert.deepEqual(res2.line, [4, 0, 0, 0]);
    assert.equal(res2.score, 4);

    // 每行单次仅合并一次 (2, 2, 2, 2 -> 4, 4, 0, 0)
    const res3 = slideAndMergeLine([2, 2, 2, 2]);
    assert.deepEqual(res3.line, [4, 4, 0, 0]);
    assert.equal(res3.score, 8);

    // 靠左优先合并 (4, 2, 2, 0 -> 4, 4, 0, 0)
    const res4 = slideAndMergeLine([4, 2, 2, 0]);
    assert.deepEqual(res4.line, [4, 4, 0, 0]);
    assert.equal(res4.score, 4);
  });

  test('矩阵四向移动正确', () => {
    const initialBoard = [
      [2, 0, 0, 2],
      [0, 4, 4, 0],
      [0, 0, 0, 0],
      [2, 2, 2, 2],
    ];

    // 向左滑动
    const leftRes = moveBoard(initialBoard, 'left');
    assert.equal(leftRes.moved, true);
    assert.deepEqual(leftRes.board, [
      [4, 0, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 4, 0, 0],
    ]);
    assert.equal(leftRes.score, 4 + 8 + 8);

    // 向右滑动
    const rightRes = moveBoard(initialBoard, 'right');
    assert.equal(rightRes.moved, true);
    assert.deepEqual(rightRes.board, [
      [0, 0, 0, 4],
      [0, 0, 0, 8],
      [0, 0, 0, 0],
      [0, 0, 4, 4],
    ]);

    // 无任何有效移动时 moved 为 false
    const lockedBoard = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    const noMove = moveBoard(lockedBoard, 'left');
    assert.equal(noMove.moved, false);
    assert.equal(hasMovesAvailable(lockedBoard), false);
  });

  test('胜负与最大方块检测', () => {
    const winningBoard = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2048, 0],
      [0, 0, 0, 0],
    ];
    assert.equal(hasWon(winningBoard), true);
    assert.equal(getMaxTile(winningBoard), 2048);
  });
});
```

- [ ] **Step 2: 运行单测验证失败**

运行：`node --test tests/game2048.test.js`
预期：FAIL，找不到模块 `game2048Logic.js`

- [ ] **Step 3: 实现 `src/utils/games/game2048Logic.js`**

创建 `src/utils/games/game2048Logic.js`：
```javascript
export function createEmptyBoard(size = 4) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function getEmptyCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
}

export function addRandomTile(board) {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return board;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const { r, c } = emptyCells[randomIndex];
  const value = Math.random() < 0.9 ? 2 : 4;

  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = value;
  return newBoard;
}

export function slideAndMergeLine(line) {
  const filtered = line.filter((val) => val !== 0);
  const result = [];
  let score = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const mergedVal = filtered[i] * 2;
      result.push(mergedVal);
      score += mergedVal;
      i++; // 跳过已合并的相邻项
    } else {
      result.push(filtered[i]);
    }
  }

  while (result.length < line.length) {
    result.push(0);
  }

  return { line: result, score };
}

function transpose(board) {
  const size = board.length;
  const transposed = createEmptyBoard(size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      transposed[c][r] = board[r][c];
    }
  }
  return transposed;
}

export function moveBoard(board, direction) {
  let workingBoard = board.map((row) => [...row]);
  let totalScore = 0;
  let isTransposed = false;
  let isReversed = false;

  if (direction === 'up' || direction === 'down') {
    workingBoard = transpose(workingBoard);
    isTransposed = true;
  }

  if (direction === 'right' || direction === 'down') {
    workingBoard = workingBoard.map((row) => [...row].reverse());
    isReversed = true;
  }

  // 统一按向左计算每行
  const newRows = [];
  for (let r = 0; r < workingBoard.length; r++) {
    const { line, score } = slideAndMergeLine(workingBoard[r]);
    newRows.push(line);
    totalScore += score;
  }
  workingBoard = newRows;

  // 还原变换
  if (isReversed) {
    workingBoard = workingBoard.map((row) => [...row].reverse());
  }
  if (isTransposed) {
    workingBoard = transpose(workingBoard);
  }

  // 检查是否发生实际改变
  const moved = JSON.stringify(board) !== JSON.stringify(workingBoard);
  return { board: workingBoard, score: totalScore, moved };
}

export function hasMovesAvailable(board) {
  const size = board.length;
  // 存在空格
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) return true;
    }
  }
  // 横向或纵向可合并
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const current = board[r][c];
      if (c < size - 1 && current === board[r][c + 1]) return true;
      if (r < size - 1 && current === board[r + 1][c]) return true;
    }
  }
  return false;
}

export function hasWon(board, target = 2048) {
  return board.some((row) => row.some((cell) => cell >= target));
}

export function getMaxTile(board) {
  let max = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell > max) max = cell;
    }
  }
  return max;
}
```

- [ ] **Step 4: 运行单测验证通过**

运行：`node --test tests/game2048.test.js`
预期：PASS，所有测试通过。

- [ ] **Step 5: 提交代码**

```bash
git add src/utils/games/game2048Logic.js tests/game2048.test.js
git commit -m "feat(games): implement 2048 core logic with comprehensive unit tests"
```

---

### Task 3: 扫雷核心算法与测试驱动 (minesweeperLogic)

**Files:**
- Create: `src/utils/games/minesweeperLogic.js`
- Test: `tests/minesweeper.test.js`

**Interfaces:**
- Produces:
  - `createInitialBoard(rows, cols)`
  - `placeMines(board, rows, cols, mineCount, safeRow, safeCol)`
  - `revealCell(board, r, c)`: returns `{ board, exploded, revealedCount }`
  - `toggleFlag(board, r, c)`: returns new board with flipped `isFlagged`
  - `checkVictory(board, mineCount)`: returns boolean

- [ ] **Step 1: 编写扫雷单测**

创建 `tests/minesweeper.test.js`：
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialBoard,
  placeMines,
  revealCell,
  toggleFlag,
  checkVictory,
} from '../src/utils/games/minesweeperLogic.js';

describe('Minesweeper Logic Core Suite', () => {
  test('初始空棋盘属性正确', () => {
    const board = createInitialBoard(9, 9);
    assert.equal(board.length, 9);
    assert.equal(board[0].length, 9);
    assert.equal(board[0][0].isRevealed, false);
    assert.equal(board[0][0].isFlagged, false);
    assert.equal(board[0][0].isMine, false);
  });

  test('首击安全机制保证点击格及周围 8 邻域绝无地雷', () => {
    const initialBoard = createInitialBoard(9, 9);
    const safeR = 4;
    const safeC = 4;
    const minedBoard = placeMines(initialBoard, 9, 9, 10, safeR, safeC);

    // 检查安全区 (4,4) 及邻域
    for (let r = safeR - 1; r <= safeR + 1; r++) {
      for (let c = safeC - 1; c <= safeC + 1; c++) {
        assert.equal(minedBoard[r][c].isMine, false, `Safe cell at (${r},${c}) had mine!`);
      }
    }

    // 检查总地雷数
    let totalMines = 0;
    for (const row of minedBoard) {
      for (const cell of row) {
        if (cell.isMine) totalMines++;
      }
    }
    assert.equal(totalMines, 10);
  });

  test('点击空白格自动连片 Flood Fill 展开', () => {
    // 构造一个没有雷的局部空棋盘测试连片展开
    const board = createInitialBoard(3, 3);
    const { board: revealedBoard, exploded, revealedCount } = revealCell(board, 0, 0);

    assert.equal(exploded, false);
    assert.equal(revealedCount, 9);
    assert.equal(revealedBoard[2][2].isRevealed, true);
  });

  test('插旗与胜利判定', () => {
    let board = createInitialBoard(2, 2);
    // 埋 1 颗雷在 (1, 1)
    board[1][1].isMine = true;
    board[0][0].neighborMines = 1;
    board[0][1].neighborMines = 1;
    board[1][0].neighborMines = 1;

    // 插旗
    board = toggleFlag(board, 1, 1);
    assert.equal(board[1][1].isFlagged, true);

    // 揭开三个非雷格
    board = revealCell(board, 0, 0).board;
    board = revealCell(board, 0, 1).board;
    board = revealCell(board, 1, 0).board;

    assert.equal(checkVictory(board, 1), true);
  });
});
```

- [ ] **Step 2: 运行单测验证失败**

运行：`node --test tests/minesweeper.test.js`
预期：FAIL，找不到模块 `minesweeperLogic.js`

- [ ] **Step 3: 实现 `src/utils/games/minesweeperLogic.js`**

创建 `src/utils/games/minesweeperLogic.js`：
```javascript
export function createInitialBoard(rows, cols) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

export function placeMines(board, rows, cols, mineCount, safeRow, safeCol) {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const safePositions = new Set();

  for (let r = Math.max(0, safeRow - 1); r <= Math.min(rows - 1, safeRow + 1); r++) {
    for (let c = Math.max(0, safeCol - 1); c <= Math.min(cols - 1, safeCol + 1); c++) {
      safePositions.add(`${r},${c}`);
    }
  }

  const candidatePositions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safePositions.has(`${r},${c}`)) {
        candidatePositions.push({ r, c });
      }
    }
  }

  // 随机洗牌洗出指定雷数
  for (let i = candidatePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidatePositions[i], candidatePositions[j]] = [candidatePositions[j], candidatePositions[i]];
  }

  const actualMines = Math.min(mineCount, candidatePositions.length);
  for (let i = 0; i < actualMines; i++) {
    const { r, c } = candidatePositions[i];
    newBoard[r][c].isMine = true;
  }

  // 计算每个格子的邻近雷数
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (newBoard[nr][nc].isMine) count++;
          }
        }
      }
      newBoard[r][c].neighborMines = count;
    }
  }

  return newBoard;
}

export function revealCell(board, row, col) {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const rows = newBoard.length;
  const cols = newBoard[0].length;

  const target = newBoard[row][col];
  if (target.isRevealed || target.isFlagged) {
    return { board: newBoard, exploded: false, revealedCount: 0 };
  }

  if (target.isMine) {
    target.isRevealed = true;
    return { board: newBoard, exploded: true, revealedCount: 1 };
  }

  // BFS Flood Fill 展开
  const queue = [{ r: row, c: col }];
  let count = 0;
  target.isRevealed = true;
  count++;

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    const cell = newBoard[r][c];

    // 只有当自己是 0 时才继续向周围扩散
    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = newBoard[nr][nc];
            if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
              neighbor.isRevealed = true;
              count++;
              if (neighbor.neighborMines === 0) {
                queue.push({ r: nr, c: nc });
              }
            }
          }
        }
      }
    }
  }

  return { board: newBoard, exploded: false, revealedCount: count };
}

export function toggleFlag(board, row, col) {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const target = newBoard[row][col];
  if (!target.isRevealed) {
    target.isFlagged = !target.isFlagged;
  }
  return newBoard;
}

export function checkVictory(board, mineCount) {
  let unrevealedSafeCells = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) {
        unrevealedSafeCells++;
      }
    }
  }
  return unrevealedSafeCells === 0;
}
```

- [ ] **Step 4: 运行单测验证通过**

运行：`node --test tests/minesweeper.test.js`
预期：PASS，所有测试通过。

- [ ] **Step 5: 提交代码**

```bash
git add src/utils/games/minesweeperLogic.js tests/minesweeper.test.js
git commit -m "feat(games): implement minesweeper core logic with tests"
```

---

### Task 4: 贪吃蛇与记忆翻牌核心纯函数与单测 (snakeLogic & memoryLogic)

**Files:**
- Create: `src/utils/games/snakeLogic.js`
- Create: `src/utils/games/memoryLogic.js`
- Test: `tests/snakeLogic.test.js`
- Test: `tests/memoryLogic.test.js`

**Interfaces:**
- `snakeLogic`: `{ getNextHead, checkCollision, generateFood, isOppositeDirection }`
- `memoryLogic`: `{ generateCards, checkMatch, isAllMatched }`

- [ ] **Step 1: 编写 Snake 与 Memory 算法单测**

创建 `tests/snakeLogic.test.js`：
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextHead,
  checkCollision,
  generateFood,
  isOppositeDirection,
} from '../src/utils/games/snakeLogic.js';

describe('Snake Logic Suite', () => {
  test('计算下一跳蛇头坐标', () => {
    assert.deepEqual(getNextHead({ x: 5, y: 5 }, { x: 1, y: 0 }), { x: 6, y: 5 });
    assert.deepEqual(getNextHead({ x: 5, y: 5 }, { x: 0, y: -1 }), { x: 5, y: 4 });
  });

  test('碰撞检测 (出界与自咬)', () => {
    // 撞墙出界 (网格尺寸 20)
    assert.equal(checkCollision({ x: 20, y: 5 }, [{ x: 19, y: 5 }], 20), true);
    assert.equal(checkCollision({ x: -1, y: 5 }, [{ x: 0, y: 5 }], 20), true);

    // 自咬检测
    const body = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }];
    assert.equal(checkCollision({ x: 6, y: 6 }, body, 20), true);
    assert.equal(checkCollision({ x: 4, y: 5 }, body, 20), false);
  });

  test('食物生成绝不在蛇身上', () => {
    const body = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }];
    const food = generateFood(body, 3);
    const onBody = body.some((b) => b.x === food.x && b.y === food.y);
    assert.equal(onBody, false);
  });

  test('反向按键判定', () => {
    assert.equal(isOppositeDirection({ x: 1, y: 0 }, { x: -1, y: 0 }), true);
    assert.equal(isOppositeDirection({ x: 0, y: 1 }, { x: 0, y: -1 }), true);
    assert.equal(isOppositeDirection({ x: 1, y: 0 }, { x: 0, y: 1 }), false);
  });
});
```

创建 `tests/memoryLogic.test.js`：
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateCards, checkMatch, isAllMatched } from '../src/utils/games/memoryLogic.js';

describe('Memory Logic Suite', () => {
  test('生成对应对数的卡片数组并随机洗牌', () => {
    const cards = generateCards(8);
    assert.equal(cards.length, 16);
    // 验证每种 symbol 刚好成双成对
    const counts = {};
    for (const c of cards) {
      counts[c.symbol] = (counts[c.symbol] || 0) + 1;
    }
    for (const sym of Object.keys(counts)) {
      assert.equal(counts[sym], 2);
    }
  });

  test('卡片配对与终局检测', () => {
    assert.equal(checkMatch({ symbol: '🚀' }, { symbol: '🚀' }), true);
    assert.equal(checkMatch({ symbol: '🚀' }, { symbol: '💻' }), false);

    const cards = [
      { id: 1, isMatched: true },
      { id: 2, isMatched: true },
    ];
    assert.equal(isAllMatched(cards), true);

    cards.push({ id: 3, isMatched: false });
    assert.equal(isAllMatched(cards), false);
  });
});
```

- [ ] **Step 2: 运行单测验证失败**

运行：`node --test tests/snakeLogic.test.js tests/memoryLogic.test.js`
预期：FAIL，找不到相应 logic 文件。

- [ ] **Step 3: 实现 `src/utils/games/snakeLogic.js`**

创建 `src/utils/games/snakeLogic.js`：
```javascript
export function getNextHead(head, dir) {
  return { x: head.x + dir.x, y: head.y + dir.y };
}

export function checkCollision(nextHead, body, gridSize = 20) {
  // 越界
  if (nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize) {
    return true;
  }
  // 自咬
  return body.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
}

export function generateFood(body, gridSize = 20) {
  const occupied = new Set(body.map((b) => `${b.x},${b.y}`));
  const available = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) return { x: 0, y: 0 };
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

export function isOppositeDirection(dir1, dir2) {
  return dir1.x === -dir2.x && dir1.y === -dir2.y;
}
```

- [ ] **Step 4: 实现 `src/utils/games/memoryLogic.js`**

创建 `src/utils/games/memoryLogic.js`：
```javascript
export const DEFAULT_ICONS = ['🚀', '💻', '⚡', '🦄', '☕', '🎮', '🛡️', '💎', '🎨', '🔥', '🧩', '🌟'];

export function generateCards(pairCount = 8) {
  const selectedSymbols = DEFAULT_ICONS.slice(0, pairCount);
  const cardPool = [];

  selectedSymbols.forEach((symbol, index) => {
    cardPool.push({
      id: `${symbol}-a-${index}`,
      symbol,
      isFlipped: false,
      isMatched: false,
    });
    cardPool.push({
      id: `${symbol}-b-${index}`,
      symbol,
      isFlipped: false,
      isMatched: false,
    });
  });

  // Fisher-Yates 洗牌
  for (let i = cardPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
  }

  return cardPool;
}

export function checkMatch(cardA, cardB) {
  if (!cardA || !cardB) return false;
  return cardA.symbol === cardB.symbol;
}

export function isAllMatched(cards) {
  return cards.length > 0 && cards.every((c) => c.isMatched);
}
```

- [ ] **Step 5: 运行单测验证通过**

运行：`node --test tests/snakeLogic.test.js tests/memoryLogic.test.js`
预期：PASS，全部通过。

- [ ] **Step 6: 提交代码**

```bash
git add src/utils/games/snakeLogic.js src/utils/games/memoryLogic.js tests/snakeLogic.test.js tests/memoryLogic.test.js
git commit -m "feat(games): implement snake & memory match pure logic with tests"
```

---

### Task 5: 通用组件、手势 Hook 与公共样式 (GamesCommon.css, GameHeader, VirtualDpad, useTouchSwipe, Modals)

**Files:**
- Create: `src/pages/games/GamesCommon.css`
- Create: `src/hooks/useTouchSwipe.js`
- Create: `src/components/games/GameHeader.jsx`
- Create: `src/components/games/VirtualDpad.jsx`
- Create: `src/components/games/GameHelpModal.jsx`
- Create: `src/components/games/GameOverModal.jsx`

**Interfaces:**
- `useTouchSwipe(onSwipe, targetRef)`: `onSwipe('up' | 'down' | 'left' | 'right')`
- `GameHeader`: props `{ title, score, bestScore, time, turns, onRestart, isPaused, onTogglePause, onOpenHelp }`
- `VirtualDpad`: props `{ onDirection(dir) }`
- `GameOverModal`: props `{ isOpen, title, subtitle, stats, onRestart, onBackHome }`
- `GameHelpModal`: props `{ isOpen, onClose, title, rules, keys }`

- [ ] **Step 1: 创建 `src/pages/games/GamesCommon.css`**

包含 Apple 磨砂卡片、游戏舞台居中容器、虚拟控制器半透明浮动、3D 翻牌样式以及深浅色自适应。

- [ ] **Step 2: 创建 `src/hooks/useTouchSwipe.js`**

手势滑动识别，防止默认橡皮筋反弹，阈值过滤。

- [ ] **Step 3: 创建 `src/components/games/GameHeader.jsx`**

集成「返回大厅」按钮、当前计分/耗时、最高分徽章、一键静音、重启、暂停与玩法提示弹窗按钮。

- [ ] **Step 4: 创建 `src/components/games/VirtualDpad.jsx`**

移动端半透明方向十字键，带触觉反馈震动。

- [ ] **Step 5: 创建 `src/components/games/GameHelpModal.jsx` & `GameOverModal.jsx`**

优雅的结算与玩法说明模态弹窗。

- [ ] **Step 6: 提交代码**

```bash
git add src/pages/games/GamesCommon.css src/hooks/useTouchSwipe.js src/components/games/
git commit -m "feat(games): add common UI components, touch swipe hook, and styling"
```

---

### Task 6: 贪吃蛇页面实现 (`SnakeGame.jsx`)

**Files:**
- Create: `src/pages/games/SnakeGame.jsx`

**Features:**
- HTML5 Canvas 60FPS 渲染，根据 `devicePixelRatio` 消除锯齿；
- 蛇身圆润线条与蛇头圆眼睛高光、食物发光光晕；
- 键盘方向键/WASD 与移动端手势及 VirtualDpad 双重支持；
- 吃食物声音阶递增加速、撞墙撞自低音爆破；
- 历史最高分本地读取与更新持久化。

- [ ] **Step 1: 实现 `SnakeGame.jsx`**
- [ ] **Step 2: 验证组件挂载无语法错误**
- [ ] **Step 3: 提交代码**

```bash
git add src/pages/games/SnakeGame.jsx
git commit -m "feat(games): implement SnakeGame component with high-performance Canvas"
```

---

### Task 7: 2048 页面实现 (`Game2048.jsx`)

**Files:**
- Create: `src/pages/games/Game2048.jsx`

**Features:**
- 4×4 CSS Grid 布局，方块色彩与深浅色模式完美匹配；
- 键盘方向键 / WASD 与屏幕滑动手势（TouchSwipe）；
- 撤销上一步（Undo）；
- 首次合成 2048 触发 Victory 模态（支持继续），无路可走触发 GameOver；
- 最高分与最大方块持久化。

- [ ] **Step 1: 实现 `Game2048.jsx`**
- [ ] **Step 2: 验证组件挂载**
- [ ] **Step 3: 提交代码**

```bash
git add src/pages/games/Game2048.jsx
git commit -m "feat(games): implement 2048 component with animations and undo"
```

---

### Task 8: 扫雷页面实现 (`MinesweeperGame.jsx`)

**Files:**
- Create: `src/pages/games/MinesweeperGame.jsx`

**Features:**
- 初级（9×9，10雷）与中级（16×16，40雷）切换；
- 首击绝对安全机制，自动 Flood Fill 连片揭开；
- 剩余雷数计数与秒表耗时；
- 移动端单手操作模式切换（⛏️ 挖掘 / 🚩 插旗）以及右键/长按插旗；
- 通关最佳耗时本地持久化。

- [ ] **Step 1: 实现 `MinesweeperGame.jsx`**
- [ ] **Step 2: 验证组件挂载**
- [ ] **Step 3: 提交代码**

```bash
git add src/pages/games/MinesweeperGame.jsx
git commit -m "feat(games): implement MinesweeperGame with dual modes and flood fill"
```

---

### Task 9: 记忆翻牌页面实现 (`MemoryMatchGame.jsx`)

**Files:**
- Create: `src/pages/games/MemoryMatchGame.jsx`

**Features:**
- 4×4 网格，8 对极客科技 Emoji 图案；
- 纯 CSS 3D 翻转卡片动效（preserve-3d）；
- 翻牌步数与计时器；
- 配对成功播放和弦音效，全通关展示结算及纪录持久化。

- [ ] **Step 1: 实现 `MemoryMatchGame.jsx`**
- [ ] **Step 2: 验证组件挂载**
- [ ] **Step 3: 提交代码**

```bash
git add src/pages/games/MemoryMatchGame.jsx
git commit -m "feat(games): implement MemoryMatchGame with 3D card flip effects"
```

---

### Task 10: 游戏大厅实现 (`GamesHome.jsx` & `GamesHome.css`)

**Files:**
- Create: `src/pages/games/GamesHome.jsx`
- Create: `src/pages/games/GamesHome.css`

**Features:**
- Apple HIG Bento Grid 展示 4 款游戏卡片；
- 每款卡片展示：游戏专属渐变光泽、图标、玩法标签、玩家最佳纪录（Best Score / Best Time）、游玩次数；
- 悬停浮动动画，一键“开始游戏”跳转；
- 顶部 Header 与全站公共 Footer 统一呈现。

- [ ] **Step 1: 实现 `GamesHome.css` 与 `GamesHome.jsx`**
- [ ] **Step 2: 验证大厅渲染**
- [ ] **Step 3: 提交代码**

```bash
git add src/pages/games/GamesHome.jsx src/pages/games/GamesHome.css
git commit -m "feat(games): implement GamesHome hub page with Bento grid layout"
```

---

### Task 11: 路由、导航与全局 Command Palette / WebTerminal 集成

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Header.jsx`
- Modify: `src/utils/commandPaletteIndex.js`
- Modify: `src/components/WebTerminal.jsx`
- Test: `tests/commandPaletteIndex.test.js`

**Changes:**
1. `src/App.jsx`：引入 `GamesHome`, `SnakeGame`, `Game2048`, `MinesweeperGame`, `MemoryMatchGame` 的懒加载路由；
2. `src/components/Header.jsx`：分段导航栏新增「小游戏」(`/games`)；
3. `src/utils/commandPaletteIndex.js`：新增「休闲小游戏」分类和 5 个快捷检索项目；
4. `src/components/WebTerminal.jsx`：注册 `games` 与 `game <name>` 命令；
5. 更新 `tests/commandPaletteIndex.test.js` 覆盖新检索项。

- [ ] **Step 1: 更新 `commandPaletteIndex.test.js`**
- [ ] **Step 2: 修改 `src/utils/commandPaletteIndex.js` 并使单测通过**
- [ ] **Step 3: 修改 `src/components/Header.jsx`**
- [ ] **Step 4: 修改 `src/App.jsx` 注册路由**
- [ ] **Step 5: 修改 `src/components/WebTerminal.jsx` 注册命令**
- [ ] **Step 6: 提交代码**

```bash
git add src/App.jsx src/components/Header.jsx src/utils/commandPaletteIndex.js src/components/WebTerminal.jsx tests/commandPaletteIndex.test.js
git commit -m "feat(integration): register mini games hub in routes, header, command palette, and terminal"
```

---

### Task 12: 全量自动化测试与生产构建验证

**Commands:**
- `npm test`
- `npm run build`

- [ ] **Step 1: 执行所有单测**
运行：`npm test`
预期：所有单测（8个原有测试 + 4个新增测试）全部 PASS。

- [ ] **Step 2: 执行 Vite 生产打包验证**
运行：`npm run build`
预期：构建成功，零错误，各个游戏子页面正确生成独立 chunk。

- [ ] **Step 3: 提交并推送到工作分支**

```bash
git status
```
