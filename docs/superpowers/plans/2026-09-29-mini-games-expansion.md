# 休闲小游戏中心第一期（俄罗斯方块 + 五子棋AI + 数独）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为个人网站小游戏中心扩充 3 款经典旗舰游戏（俄罗斯方块、五子棋人机对弈、数独），并全面升级游戏大厅（7款 Bento Grid）、全站路由、快捷指令、Web 终端与战绩持久化。

**Architecture:** 沿用纯函数算法引擎与 React UI 视图完全解耦架构。所有规则逻辑、AI 决策与数独生成通过 `node --test` 单测驱动开发（TDD）；UI 结合 HTML5 Canvas 60FPS 双缓冲与 SVG 精细矢量渲染，深度适配 Apple HIG 磨砂玻璃风格与移动端触控手势。

**Tech Stack:** React 18/19, Vite, Tailwind CSS, Lucide-react, Web Audio API, HTML5 Canvas, SVG, Node.js Test Runner (`node --test`).

**Spec:** [2026-09-29-mini-games-expansion-design.md](file:///c:/Users/if/Desktop/lyWorkSpace/personWeb/docs/superpowers/specs/2026-09-29-mini-games-expansion-design.md)

## Global Constraints

- 纯前端实现，严禁引入未经批准的重型外部依赖；
- 算法核心全部使用无副作用纯函数，状态不可变；
- 遵循 Node.js 原生 `node --test` 测试规范；
- 移动端 100% 自适应，支持手势（Swipe）与触控操作；
- 视觉风格严格统一于全站 Apple HIG 磨砂玻璃与暗黑极客主题；
- 每次任务代码均保证 `npm test` 与 `npm run build` 零报错通过。

---

### Task 1: 音效合成引擎扩充与战绩持久化升级

**Files:**
- Modify: `src/utils/gameAudio.js`
- Modify: `src/utils/gameStorage.js`

**Interfaces:**
- Consumes: Existing Web Audio API AudioContext in `gameAudio.js`, localStorage wrapper in `gameStorage.js`.
- Produces:
  - `gameAudio.playTetrisDrop()`, `gameAudio.playTetrisClear(lines)`, `gameAudio.playTetrisFanfare()`, `gameAudio.playGomokuStone()`, `gameAudio.playSudokuPencil()`, `gameAudio.playSudokuErase()`, `gameAudio.playSudokuError()`
  - `getGameRecord('tetris')`, `getGameRecord('gomoku')`, `getGameRecord('sudoku')`
  - `updateRecord(gameId, updateData)`

- [ ] **Step 1: 在 `gameAudio.js` 中新增新游戏合成音效函数**

```javascript
// 在 src/utils/gameAudio.js 中添加：
// 1. 五子棋落子声 (清脆双频落子，白噪声脉冲 + 280Hz 阻尼正弦)
playGomokuStone() {
  if (this.muted) return;
  const ctx = this._getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.09);
},

// 2. 俄罗斯方块硬降重低音 (80Hz 骤降)
playTetrisDrop() {
  if (this.muted) return;
  const ctx = this._getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  gain.gain.setValueAtTime(0.4, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.13);
},

// 3. 俄罗斯方块消行音效 (单/双/三消行升调琶音)
playTetrisClear(lines = 1) {
  if (this.muted) return;
  const ctx = this._getContext();
  if (!ctx) return;
  const baseFreqs = lines >= 4 ? [440, 554.37, 659.25, 880] : lines === 3 ? [392, 493.88, 587.33] : lines === 2 ? [440, 554.37] : [523.25];
  baseFreqs.forEach((freq, idx) => {
    const t = ctx.currentTime + idx * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = lines >= 4 ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.19);
  });
},

// 4. 数独铅笔输入与擦除音效
playSudokuPencil() {
  if (this.muted) return;
  const ctx = this._getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(620, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.04);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
},

playSudokuErase() {
  if (this.muted) return;
  const ctx = this._getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(380, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.07);
},

playSudokuError() {
  if (this.muted) return;
  const ctx = this._getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, t);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.16);
}
```

- [ ] **Step 2: 在 `src/utils/gameStorage.js` 中扩充默认数据格式**

更新 `DEFAULT_RECORDS` 包含 `tetris`, `gomoku`, `sudoku`：
```javascript
const DEFAULT_RECORDS = {
  snake: { bestScore: 0, playCount: 0 },
  game2048: { bestScore: 0, maxTile: 2, playCount: 0 },
  minesweeper: { beginnerBestTime: null, intermediateBestTime: null, playCount: 0 },
  memory: { bestTurns: null, bestTime: null, playCount: 0 },
  tetris: { bestScore: 0, maxLines: 0, playCount: 0 },
  gomoku: { wins: 0, losses: 0, playCount: 0 },
  sudoku: { easyBestTime: null, mediumBestTime: null, hardBestTime: null, playCount: 0 }
};
```

- [ ] **Step 3: 运行全站单测和构建验证**

运行：`npm test && npm run build`
预期：PASS，80 tests pass，0 build errors。

- [ ] **Step 4: 提交代码**

```bash
git add src/utils/gameAudio.js src/utils/gameStorage.js
git commit -m "feat(games): expand Web Audio synthesis and storage schema for new games"
```

---

### Task 2: 俄罗斯方块核心算法与单测驱动 (`tetrisLogic.js`)

**Files:**
- Create: `src/utils/games/tetrisLogic.js`
- Create: `tests/tetrisLogic.test.js`

**Interfaces:**
- Produces:
  - `BOARD_WIDTH = 10`, `BOARD_HEIGHT = 20`
  - `TETROMINOES`: `{ I, O, T, S, Z, J, L }`
  - `createEmptyBoard()`
  - `generate7Bag()`
  - `isValidPosition(board, piece, x, y, rotation)`
  - `getGhostDropY(board, piece, x, y, rotation)`
  - `rotatePiece(board, piece, x, y, currentRotation, clockwise)` -> `{ newRotation, newX, newY, success }` (SRS kick table)
  - `placePiece(board, piece, x, y, rotation)`
  - `clearLines(board)` -> `{ newBoard, linesCleared, clearedIndices }`
  - `calculateScore(linesCleared, level)`
  - `getDropInterval(level)`

- [ ] **Step 1: 编写 `tests/tetrisLogic.test.js` 测试套件**

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyBoard,
  generate7Bag,
  isValidPosition,
  getGhostDropY,
  rotatePiece,
  placePiece,
  clearLines,
  calculateScore,
  getDropInterval,
  TETROMINOES,
  BOARD_WIDTH,
  BOARD_HEIGHT
} from '../src/utils/games/tetrisLogic.js';

describe('Tetris Logic Core Suite', () => {
  test('初始空棋盘尺寸与空状态正确', () => {
    const board = createEmptyBoard();
    assert.equal(board.length, BOARD_HEIGHT);
    assert.equal(board[0].length, BOARD_WIDTH);
    assert.ok(board.every(row => row.every(cell => cell === 0)));
  });

  test('7-Bag 随机器连续两轮包含所有 7 种方块', () => {
    const bag1 = generate7Bag();
    assert.equal(bag1.length, 7);
    const set1 = new Set(bag1);
    assert.equal(set1.size, 7);
    assert.ok(['I', 'O', 'T', 'S', 'Z', 'J', 'L'].every(k => set1.has(k)));
  });

  test('碰撞检测 isValidPosition 正确识别出界与阻挡', () => {
    const board = createEmptyBoard();
    // 合法居中
    assert.ok(isValidPosition(board, 'T', 3, 0, 0));
    // 左出界
    assert.equal(isValidPosition(board, 'T', -2, 0, 0), false);
    // 右出界
    assert.equal(isValidPosition(board, 'T', 9, 0, 0), false);
    // 底出界
    assert.equal(isValidPosition(board, 'T', 3, 20, 0), false);

    // 预设地面障碍
    board[19][4] = 1;
    assert.equal(isValidPosition(board, 'O', 3, 18, 0), false);
  });

  test('幽灵投影 getGhostDropY 精确计算落底深度', () => {
    const board = createEmptyBoard();
    const ghostY = getGhostDropY(board, 'O', 4, 0, 0);
    // O 方块 2x2，底边落在第 18, 19 行，对应 y = 18
    assert.equal(ghostY, 18);

    // 在第 15 行制造障碍
    board[15][4] = 1;
    const ghostYBlocked = getGhostDropY(board, 'O', 4, 0, 0);
    assert.equal(ghostYBlocked, 13);
  });

  test('SRS 旋转踢墙系统 rotatePiece 正常执行', () => {
    const board = createEmptyBoard();
    // T 方块靠紧最左侧旋转 (x = 0)
    const result = rotatePiece(board, 'T', 0, 10, 0, true);
    assert.ok(result.success);
    assert.equal(result.newRotation, 1);
  });

  test('固化方块与消行 clearLines 判定正确', () => {
    let board = createEmptyBoard();
    // 填满第 19 行
    for (let c = 0; c < BOARD_WIDTH; c++) board[19][c] = 1;
    // 填满第 18 行除最后一格外
    for (let c = 0; c < BOARD_WIDTH - 1; c++) board[18][c] = 1;

    const { newBoard, linesCleared, clearedIndices } = clearLines(board);
    assert.equal(linesCleared, 1);
    assert.deepEqual(clearedIndices, [19]);
    assert.equal(newBoard.length, BOARD_HEIGHT);
    // 原 18 行下落到 19 行
    assert.equal(newBoard[19][0], 1);
    assert.equal(newBoard[19][BOARD_WIDTH - 1], 0);
    // 顶部新添行为全 0
    assert.ok(newBoard[0].every(c => c === 0));
  });

  test('计分公式与等级下落速度计算正确', () => {
    assert.equal(calculateScore(1, 1), 100);
    assert.equal(calculateScore(2, 1), 300);
    assert.equal(calculateScore(3, 1), 500);
    assert.equal(calculateScore(4, 1), 800);
    assert.equal(calculateScore(4, 2), 1600);

    assert.equal(getDropInterval(1), 800);
    assert.equal(getDropInterval(5), 520);
    assert.equal(getDropInterval(15), 100);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`node --test tests/tetrisLogic.test.js`
预期：FAIL（模块尚未创建）

- [ ] **Step 3: 实现 `src/utils/games/tetrisLogic.js` 纯函数算法**

实现完整的 7 种方块形态（四向旋转坐标矩阵）、7-Bag 洗牌、SRS 标准踢墙表、`isValidPosition`、`getGhostDropY`、`rotatePiece`、`clearLines`、`calculateScore`、`getDropInterval`。

- [ ] **Step 4: 运行单测验证通过**

运行：`node --test tests/tetrisLogic.test.js && npm test`
预期：PASS，所有测试全部通过。

- [ ] **Step 5: 提交代码**

```bash
git add src/utils/games/tetrisLogic.js tests/tetrisLogic.test.js
git commit -m "feat(games): implement tetris pure logic with 7-bag, SRS, and test suite"
```

---

### Task 3: 五子棋核心算法与 Minimax AI 单测驱动 (`gomokuLogic.js`)

**Files:**
- Create: `src/utils/games/gomokuLogic.js`
- Create: `tests/gomokuLogic.test.js`

**Interfaces:**
- Produces:
  - `BOARD_SIZE = 15`
  - `EMPTY = 0`, `BLACK = 1`, `WHITE = 2`
  - `createEmptyBoard()`
  - `checkGomokuWin(board, r, c)` -> `{ win: boolean, winner: number, winningLine: Array<[number, number]> }`
  - `getCandidateMoves(board)` -> `Array<[number, number]>`
  - `evaluateBoard(board, aiColor)` -> `number`
  - `getBestMove(board, aiColor, difficulty)` -> `[number, number]`
  - `undoLastMove(history)` -> `{ newBoard, newHistory }`

- [ ] **Step 1: 编写 `tests/gomokuLogic.test.js` 测试套件**

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyBoard,
  checkGomokuWin,
  getCandidateMoves,
  getBestMove,
  BOARD_SIZE,
  BLACK,
  WHITE
} from '../src/utils/games/gomokuLogic.js';

describe('Gomoku Logic Core & AI Suite', () => {
  test('初始棋盘为 15x15 且全空', () => {
    const board = createEmptyBoard();
    assert.equal(board.length, BOARD_SIZE);
    assert.equal(board[0].length, BOARD_SIZE);
    assert.ok(board.every(row => row.every(c => c === 0)));
  });

  test('横向 5 连子判定胜利', () => {
    const board = createEmptyBoard();
    for (let c = 3; c <= 7; c++) board[7][c] = BLACK;
    const res = checkGomokuWin(board, 7, 7);
    assert.ok(res.win);
    assert.equal(res.winner, BLACK);
    assert.equal(res.winningLine.length, 5);
  });

  test('反斜向 5 连子判定胜利', () => {
    const board = createEmptyBoard();
    for (let i = 0; i < 5; i++) board[2 + i][8 - i] = WHITE;
    const res = checkGomokuWin(board, 6, 4);
    assert.ok(res.win);
    assert.equal(res.winner, WHITE);
  });

  test('未满 5 连子不判定胜利', () => {
    const board = createEmptyBoard();
    for (let c = 3; c <= 6; c++) board[7][c] = BLACK;
    const res = checkGomokuWin(board, 7, 6);
    assert.equal(res.win, false);
  });

  test('候选点剪枝只提取棋子周围领域', () => {
    const board = createEmptyBoard();
    board[7][7] = BLACK;
    const moves = getCandidateMoves(board);
    assert.ok(moves.length >= 8 && moves.length <= 25);
    // 天元中心周围必须包含候选
    assert.ok(moves.some(([r, c]) => r === 6 && c === 7));
  });

  test('AI 决策具备斩杀意识（已有4子必连成5子）', () => {
    const board = createEmptyBoard();
    // 白棋已有4子在 (7, 3), (7, 4), (7, 5), (7, 6)，留 (7, 7)
    for (let c = 3; c <= 6; c++) board[7][c] = WHITE;
    const [r, c] = getBestMove(board, WHITE, 'intermediate');
    // AI 必下 (7, 7) 或 (7, 2)
    assert.equal(r, 7);
    assert.ok(c === 7 || c === 2);
  });

  test('AI 决策具备防守意识（玩家已有活3/冲4必堵截）', () => {
    const board = createEmptyBoard();
    // 玩家黑棋已有4子 (5, 2), (5, 3), (5, 4), (5, 5)，空 (5, 6)
    for (let c = 2; c <= 5; c++) board[5][c] = BLACK;
    const [r, c] = getBestMove(board, WHITE, 'intermediate');
    assert.equal(r, 5);
    assert.ok(c === 6 || c === 1);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`node --test tests/gomokuLogic.test.js`
预期：FAIL（模块未定义）

- [ ] **Step 3: 实现 `src/utils/games/gomokuLogic.js` 纯函数算法**

实现：
1. 棋盘初始化与胜负判定（4 向扫描）；
2. 候选移动点领域提取（曼哈顿距离 1~2 过滤）；
3. 棋型评估（活四、冲四、活三、眠三、活二分值矩阵）；
4. Minimax + Alpha-Beta 剪枝搜索（beginner 1层贪心, intermediate 2层, master 3层）；
5. 历史栈出栈悔棋函数。

- [ ] **Step 4: 运行单测验证通过**

运行：`node --test tests/gomokuLogic.test.js && npm test`
预期：PASS，所有测试全部通过。

- [ ] **Step 5: 提交代码**

```bash
git add src/utils/games/gomokuLogic.js tests/gomokuLogic.test.js
git commit -m "feat(games): implement gomoku core logic and minimax AI with tests"
```

---

### Task 4: 数独出题引擎、求解器与冲突检测 (`sudokuLogic.js`)

**Files:**
- Create: `src/utils/games/sudokuLogic.js`
- Create: `tests/sudokuLogic.test.js`

**Interfaces:**
- Produces:
  - `generateSudokuPuzzle(difficulty)` -> `{ initialBoard, solutionBoard }`
  - `solveSudoku(board)` -> `number[][] | null`
  - `countSolutions(board, limit)` -> `number`
  - `findConflicts(board)` -> `Set<string>` (coordinates `"r,c"`)
  - `getValidCandidates(board, r, c)` -> `number[]`
  - `isBoardComplete(board)` -> `boolean`

- [ ] **Step 1: 编写 `tests/sudokuLogic.test.js` 测试套件**

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSudokuPuzzle,
  solveSudoku,
  countSolutions,
  findConflicts,
  getValidCandidates,
  isBoardComplete
} from '../src/utils/games/sudokuLogic.js';

describe('Sudoku Logic Core Suite', () => {
  test('回溯求解器 solveSudoku 能够正确求解合法数独', () => {
    // 经典数独测试样本
    const raw = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    const solution = solveSudoku(raw);
    assert.ok(solution);
    assert.ok(isBoardComplete(solution));
    assert.equal(findConflicts(solution).size, 0);
  });

  test('出题引擎根据难度生成具有唯一解的题目', () => {
    const { initialBoard, solutionBoard } = generateSudokuPuzzle('easy');
    assert.equal(initialBoard.length, 9);
    assert.equal(solutionBoard.length, 9);
    // 求解数严格为 1
    assert.equal(countSolutions(initialBoard, 2), 1);
    // 预填数字数量在 36~42 范围内
    const clues = initialBoard.flat().filter(n => n > 0).length;
    assert.ok(clues >= 35 && clues <= 45);
  });

  test('冲突检测 findConflicts 准确标识行列宫重复项', () => {
    const board = Array(9).fill(0).map(() => Array(9).fill(0));
    // 同一行放置两个 5
    board[0][0] = 5;
    board[0][8] = 5;
    const conflicts = findConflicts(board);
    assert.ok(conflicts.has('0,0'));
    assert.ok(conflicts.has('0,8'));
  });

  test('候选数计算 getValidCandidates 准确排除已有数字', () => {
    const board = Array(9).fill(0).map(() => Array(9).fill(0));
    // 同行已有 1, 2
    board[0][1] = 1;
    board[0][2] = 2;
    // 同列已有 3, 4
    board[1][0] = 3;
    board[2][0] = 4;
    // 同 3x3 宫已有 5
    board[1][1] = 5;

    const candidates = getValidCandidates(board, 0, 0);
    assert.deepEqual(candidates, [6, 7, 8, 9]);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`node --test tests/sudokuLogic.test.js`
预期：FAIL（模块尚未创建）

- [ ] **Step 3: 实现 `src/utils/games/sudokuLogic.js` 纯函数算法**

实现：
1. 回溯求解与多解统计（`countSolutions` 限制最多搜 2 个解）；
2. 终盘随机置换生成；
3. 对称挖空出题机制并验证唯一解；
4. 冲突坐标集返回（行、列、九宫格重叠项）；
5. 候选数字排除推导函数。

- [ ] **Step 4: 运行单测验证通过**

运行：`node --test tests/sudokuLogic.test.js && npm test`
预期：PASS，所有测试全部通过。

- [ ] **Step 5: 提交代码**

```bash
git add src/utils/games/sudokuLogic.js tests/sudokuLogic.test.js
git commit -m "feat(games): implement sudoku solver, generator and conflict detection with tests"
```

---

### Task 5: 俄罗斯方块页面实现 (`TetrisGame.jsx`)

**Files:**
- Create: `src/pages/games/TetrisGame.jsx`

**Interfaces:**
- Consumes:
  - `src/utils/games/tetrisLogic.js`
  - `src/utils/gameAudio.js`
  - `src/utils/gameStorage.js`
  - `src/components/games/GameHeader.jsx`
  - `src/components/games/GameOverModal.jsx`
  - `src/components/games/GameHelpModal.jsx`
  - `src/components/games/VirtualDpad.jsx`
  - `src/hooks/useTouchSwipe.js`
  - `src/pages/games/GamesCommon.css`

- [ ] **Step 1: 创建 `TetrisGame.jsx` 组件骨架与状态机**

实现状态：
- `board`: 10x20 二维状态；
- `currentPiece`: 当前方块类型、x、y、rotation；
- `nextPieces`: 后序方块队列；
- `holdPiece`: 当前暂存方块；
- `canHold`: 当前回合是否已暂存标记；
- `score`, `lines`, `level`, `isGameOver`, `isPaused`。

- [ ] **Step 2: 实现 HTML5 Canvas 60FPS 双缓冲渲染**

- 使用 `window.devicePixelRatio` 缩放 Canvas 保证清晰度；
- 绘制毛玻璃半透明棋盘网格；
- 绘制已固化方块（圆角、内阴影立体质感、对应 7 种霓虹色彩）；
- 绘制幽灵下落虚影（半透明线框与柔和底色）；
- 绘制当前下落方块。

- [ ] **Step 3: 绑定输入控制与手势**

- 键盘监听：左右平移、下软降、上/X 顺时针旋转、Z 逆时针旋转、Space 硬降、C/Shift 暂存、P 暂停；
- 移动端：手势滑动 + 底部触控药丸按钮 + 可选虚拟十字键；
- 触发对应 Web Audio 合成音效（硬降音、消行琶音）。

- [ ] **Step 4: 接入持久化与结算模态框**

- 结算时调用 `updateRecord('tetris', { score, lines })`；
- 渲染 `GameOverModal` 与 `GameHelpModal`。

- [ ] **Step 5: 运行全站单测和构建验证**

运行：`npm test && npm run build`
预期：PASS，0 报错。

- [ ] **Step 6: 提交代码**

```bash
git add src/pages/games/TetrisGame.jsx
git commit -m "feat(games): implement TetrisGame with 60FPS Canvas, Hold, Ghost piece, and audio"
```

---

### Task 6: 五子棋人机对弈页面实现 (`GomokuGame.jsx`)

**Files:**
- Create: `src/pages/games/GomokuGame.jsx`

**Interfaces:**
- Consumes:
  - `src/utils/games/gomokuLogic.js`
  - `src/utils/gameAudio.js`
  - `src/utils/gameStorage.js`
  - `src/components/games/GameHeader.jsx`
  - `src/components/games/GameOverModal.jsx`
  - `src/components/games/GameHelpModal.jsx`
  - `src/pages/games/GamesCommon.css`

- [ ] **Step 1: 创建 `GomokuGame.jsx` 棋盘布局与人机交互**

实现：
- 15×15 棋盘，标明 5 处星位；
- SVG 径向渐变黑白拟真立体棋子；
- 鼠标悬停十字线与半透明虚影；
- 最后一步落子呼吸红点标记；
- 胜负五连珠高亮连线。

- [ ] **Step 2: 接入 AI 回合与思考动效**

- 玩家落子 -> 播放 `playGomokuStone()` -> 胜负检测；
- 若未分胜负 -> 显示“AI 思考中...”脉冲微标 -> `setTimeout` 调用 `getBestMove(board, aiColor, difficulty)` -> AI 自动落子；
- 胜负判定后弹出胜利/惜败结算面板，调用 `updateRecord('gomoku', { isWin })`。

- [ ] **Step 3: 控制面板实现**

- 难度切换胶囊（入门 / 进阶 / 大师）；
- 执子切换（执黑先手 / 执白后手）；
- 悔棋按钮（回退双方最近一步）。

- [ ] **Step 4: 运行单测与生产构建验证**

运行：`npm test && npm run build`
预期：PASS。

- [ ] **Step 5: 提交代码**

```bash
git add src/pages/games/GomokuGame.jsx
git commit -m "feat(games): implement GomokuGame with Minimax AI, SVG stones, and undo"
```

---

### Task 7: 数独页面实现 (`SudokuGame.jsx`)

**Files:**
- Create: `src/pages/games/SudokuGame.jsx`

**Interfaces:**
- Consumes:
  - `src/utils/games/sudokuLogic.js`
  - `src/utils/gameAudio.js`
  - `src/utils/gameStorage.js`
  - `src/components/games/GameHeader.jsx`
  - `src/components/games/GameOverModal.jsx`
  - `src/components/games/GameHelpModal.jsx`
  - `src/pages/games/GamesCommon.css`

- [ ] **Step 1: 创建 `SudokuGame.jsx` 九宫格与候选笔记显示**

实现：
- 9×9 CSS Grid，粗边框划分 9 个大宫；
- 区分题目预置数字（深色高亮字体）与玩家填入数字（主题色字体）；
- 单元格内嵌 3×3 微型候选笔记小字显示；
- 选中单元格时同横、纵、宫与全局相同数字高亮光带。

- [ ] **Step 2: 键盘与虚拟键盘输入体系**

- 电脑端：键盘 `1~9` 填数，`Backspace` 擦除，方向键移动选中焦点，Shift 切换铅笔；
- 移动端：底部 `1~9` 数字圆形按键（附带剩余需填数量角标）；
- 工具条：`✏️ 铅笔模式` 开关、`⌫ 橡皮擦`、`↩️ 撤销`、`💡 自动填充候选笔记`。

- [ ] **Step 3: 冲突呼吸警示与通关判定**

- 实时通过 `findConflicts(board)` 检测同行同列同宫重复项并施加暗红警示；
- 通关检测：所有格子填满且无冲突，记录耗时并调用 `updateRecord('sudoku', { level, time })`，播放通关和弦。

- [ ] **Step 4: 运行单测与生产构建验证**

运行：`npm test && npm run build`
预期：PASS。

- [ ] **Step 5: 提交代码**

```bash
git add src/pages/games/SudokuGame.jsx
git commit -m "feat(games): implement SudokuGame with pencil notes, keypad, and conflict detection"
```

---

### Task 8: 大厅 Bento Grid 扩充、全站路由、终端与命令检索集成

**Files:**
- Modify: `src/pages/games/GamesHome.jsx`
- Modify: `src/pages/games/GamesHome.css`
- Modify: `src/App.jsx`
- Modify: `src/utils/commandPaletteIndex.js`
- Modify: `src/components/WebTerminal.jsx`
- Modify: `tests/commandPaletteIndex.test.js`

**Interfaces:**
- Consumes: All 7 game routes, gameStorage records.
- Produces: 7-card Bento grid, full site routing, terminal shortcuts, command palette indexing.

- [ ] **Step 1: 更新 `tests/commandPaletteIndex.test.js`**

添加对 `tetris`, `gomoku`, `sudoku` 的检索断言：
```javascript
test('commandPaletteIndex 包含俄罗斯方块、五子棋和数独快捷命令', () => {
  const commands = buildAllCommands(mockNavigate);
  assert.ok(commands.some(c => c.id === 'game-tetris'));
  assert.ok(commands.some(c => c.id === 'game-gomoku'));
  assert.ok(commands.some(c => c.id === 'game-sudoku'));

  const tetrisMatch = filterCommands(commands, 'tetris');
  assert.ok(tetrisMatch.some(c => c.id === 'game-tetris'));
});
```

- [ ] **Step 2: 更新 `src/utils/commandPaletteIndex.js`**

在 `GAME_COMMANDS` 中追加 `game-tetris`、`game-gomoku`、`game-sudoku`。

- [ ] **Step 3: 更新 `src/components/WebTerminal.jsx`**

将 `game` 命令支持的参数扩展为：
`['snake', '2048', 'minesweeper', 'memory', 'tetris', 'gomoku', 'sudoku']`，支持如 `game tetris`、`game gomoku`、`game sudoku`。

- [ ] **Step 4: 更新 `src/App.jsx` 注册路由**

动态懒加载并注册：
- `/games/tetris` -> `<TetrisGame />`
- `/games/gomoku` -> `<GomokuGame />`
- `/games/sudoku` -> `<SudokuGame />`

- [ ] **Step 5: 扩充 `GamesHome.jsx` 与 `GamesHome.css` 为 7 款游戏 Bento Grid**

展示 7 款游戏卡片，各具备专属渐变光泽、图标、标签与实时读取的历史最高分/胜率/最佳耗时：
1. 贪吃蛇 🐍
2. 2048 🔢
3. 扫雷 💣
4. 记忆翻牌 🧩
5. 俄罗斯方块 🧱 (`#06b6d4`)
6. 五子棋人机 ♟️ (`#6366f1`)
7. 数独 🔢 (`#f59e0b`)

- [ ] **Step 6: 运行全部测试套件与 Vite 构建验证**

运行：`npm test && npm run build`
预期：PASS，所有测试套件全部通过（>85 项单测），构建产物大小正常且零报错。

- [ ] **Step 7: 提交代码**

```bash
git add src/App.jsx src/pages/games/GamesHome.jsx src/pages/games/GamesHome.css src/utils/commandPaletteIndex.js src/components/WebTerminal.jsx tests/commandPaletteIndex.test.js
git commit -m "feat(integration): integrate 7 games in hub bento grid, routes, command palette, and terminal"
```
