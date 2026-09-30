/**
 * 数独核心出题、求解、候选数推导与冲突检测逻辑
 */

export const DIFFICULTIES = {
  easy: { minClues: 36, maxClues: 40 },
  medium: { minClues: 30, maxClues: 34 },
  hard: { minClues: 24, maxClues: 28 }
};

/**
 * 创建 9x9 全空棋盘 (0 表示空格)
 */
export function createEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/**
 * 棋盘深度复制
 */
export function copyBoard(board) {
  return board.map(row => [...row]);
}

/**
 * 获取坐标所在的 3x3 宫索引 (0 ~ 8)
 */
function getBoxIndex(r, c) {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

/**
 * 数组原地随机洗牌 (Fisher-Yates)
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * 遍历 9×9 棋盘，检测行、列、3×3 宫内的所有非 0 重复数字
 * @param {number[][]} board 
 * @returns {Set<string>} 冲突格子的坐标集合，如 "r,c"
 */
export function findConflicts(board) {
  const conflicts = new Set();
  if (!board || board.length !== 9) return conflicts;

  // 1. 检查行冲突
  for (let r = 0; r < 9; r++) {
    const seen = new Map();
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val > 0) {
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val).push(c);
      }
    }
    for (const [, cols] of seen) {
      if (cols.length > 1) {
        for (const c of cols) {
          conflicts.add(`${r},${c}`);
        }
      }
    }
  }

  // 2. 检查列冲突
  for (let c = 0; c < 9; c++) {
    const seen = new Map();
    for (let r = 0; r < 9; r++) {
      const val = board[r][c];
      if (val > 0) {
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val).push(r);
      }
    }
    for (const [, rows] of seen) {
      if (rows.length > 1) {
        for (const r of rows) {
          conflicts.add(`${r},${c}`);
        }
      }
    }
  }

  // 3. 检查 3×3 九宫格冲突
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {
      const seen = new Map();
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const r = boxR * 3 + dr;
          const c = boxC * 3 + dc;
          const val = board[r][c];
          if (val > 0) {
            if (!seen.has(val)) seen.set(val, []);
            seen.get(val).push([r, c]);
          }
        }
      }
      for (const [, coords] of seen) {
        if (coords.length > 1) {
          for (const [r, c] of coords) {
            conflicts.add(`${r},${c}`);
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * 候选数推导 (Pencil Notes)
 * 排除同行、同列、同宫已出现的数字，返回该格可填候选数的升序数组
 * @param {number[][]} board 
 * @param {number} r 
 * @param {number} c 
 * @returns {number[]} 升序候选数字数组，若已填数字或无候选则返回 []
 */
export function getValidCandidates(board, r, c) {
  if (!board || r < 0 || r >= 9 || c < 0 || c >= 9 || board[r][c] !== 0) {
    return [];
  }

  const used = new Set();

  // 行占用
  for (let col = 0; col < 9; col++) {
    const val = board[r][col];
    if (val > 0) used.add(val);
  }

  // 列占用
  for (let row = 0; row < 9; row++) {
    const val = board[row][c];
    if (val > 0) used.add(val);
  }

  // 3×3 宫占用
  const startRow = Math.floor(r / 3) * 3;
  const startCol = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const val = board[startRow + dr][startCol + dc];
      if (val > 0) used.add(val);
    }
  }

  const candidates = [];
  for (let num = 1; num <= 9; num++) {
    if (!used.has(num)) {
      candidates.push(num);
    }
  }

  return candidates;
}

/**
 * 检查棋盘是否已完整且无任何冲突
 * @param {number[][]} board 
 * @returns {boolean}
 */
export function isBoardComplete(board) {
  if (!board || board.length !== 9) return false;
  for (let r = 0; r < 9; r++) {
    if (!board[r] || board[r].length !== 9) return false;
    for (let c = 0; c < 9; c++) {
      if (board[r][c] <= 0 || board[r][c] > 9) return false;
    }
  }
  return findConflicts(board).size === 0;
}

/**
 * 数独求解器 (Backtracking with MRV heuristic)
 * @param {number[][]} board 
 * @returns {number[][] | null} 成功返回全新终盘副本，无解返回 null
 */
export function solveSudoku(board) {
  if (!board || board.length !== 9) return null;
  if (findConflicts(board).size > 0) return null;

  const b = copyBoard(board);
  const rowMask = new Int16Array(9);
  const colMask = new Int16Array(9);
  const boxMask = new Int16Array(9);

  let emptyCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = b[r][c];
      if (val > 0) {
        const bit = 1 << val;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[getBoxIndex(r, c)] |= bit;
      } else {
        emptyCount++;
      }
    }
  }

  if (emptyCount === 0) {
    return b;
  }

  function solve() {
    let minCandidates = 10;
    let bestR = -1;
    let bestC = -1;
    let bestMask = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const used = rowMask[r] | colMask[c] | boxMask[getBoxIndex(r, c)];
          const availableMask = (~used) & 0x3FE;

          let count = 0;
          for (let n = 1; n <= 9; n++) {
            if (availableMask & (1 << n)) count++;
          }

          if (count === 0) return false;

          if (count < minCandidates) {
            minCandidates = count;
            bestR = r;
            bestC = c;
            bestMask = availableMask;
            if (count === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (bestR === -1) {
      return true; // 解决完毕
    }

    const boxIdx = getBoxIndex(bestR, bestC);
    for (let num = 1; num <= 9; num++) {
      const bit = 1 << num;
      if (bestMask & bit) {
        b[bestR][bestC] = num;
        rowMask[bestR] |= bit;
        colMask[bestC] |= bit;
        boxMask[boxIdx] |= bit;

        if (solve()) return true;

        b[bestR][bestC] = 0;
        rowMask[bestR] &= ~bit;
        colMask[bestC] &= ~bit;
        boxMask[boxIdx] &= ~bit;
      }
    }

    return false;
  }

  if (solve()) {
    return b;
  }
  return null;
}

/**
 * 统计解的总数（达到 limit 时立即截断短路返回）
 * @param {number[][]} board 
 * @param {number} limit 默认为 2
 * @returns {number} 0 ~ limit
 */
export function countSolutions(board, limit = 2) {
  if (!board || board.length !== 9) return 0;
  if (findConflicts(board).size > 0) return 0;

  const b = copyBoard(board);
  const rowMask = new Int16Array(9);
  const colMask = new Int16Array(9);
  const boxMask = new Int16Array(9);

  let emptyCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = b[r][c];
      if (val > 0) {
        const bit = 1 << val;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[getBoxIndex(r, c)] |= bit;
      } else {
        emptyCount++;
      }
    }
  }

  if (emptyCount === 0) {
    return 1;
  }

  let count = 0;

  function search() {
    if (count >= limit) return;

    let minCandidates = 10;
    let bestR = -1;
    let bestC = -1;
    let bestMask = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const used = rowMask[r] | colMask[c] | boxMask[getBoxIndex(r, c)];
          const availableMask = (~used) & 0x3FE;

          let candCount = 0;
          for (let n = 1; n <= 9; n++) {
            if (availableMask & (1 << n)) candCount++;
          }

          if (candCount === 0) return;

          if (candCount < minCandidates) {
            minCandidates = candCount;
            bestR = r;
            bestC = c;
            bestMask = availableMask;
            if (candCount === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (bestR === -1) {
      count++;
      return;
    }

    const boxIdx = getBoxIndex(bestR, bestC);
    for (let num = 1; num <= 9; num++) {
      const bit = 1 << num;
      if (bestMask & bit) {
        b[bestR][bestC] = num;
        rowMask[bestR] |= bit;
        colMask[bestC] |= bit;
        boxMask[boxIdx] |= bit;

        search();

        b[bestR][bestC] = 0;
        rowMask[bestR] &= ~bit;
        colMask[bestC] &= ~bit;
        boxMask[boxIdx] &= ~bit;

        if (count >= limit) return;
      }
    }
  }

  search();
  return count;
}

/**
 * 随机生成完全合法的 9×9 终盘
 */
function generateRandomTerminalBoard() {
  const board = createEmptyBoard();

  // 1. 独立随机填充对角线上 3 个 3×3 宫格（相互不冲突）
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let boxIdx = 0; boxIdx < 3; boxIdx++) {
    const startRow = boxIdx * 3;
    const startCol = boxIdx * 3;
    const shuffled = shuffle([...digits]);
    let k = 0;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        board[startRow + dr][startCol + dc] = shuffled[k++];
      }
    }
  }

  // 2. 使用随机分支回溯算法填满剩余空白格
  const rowMask = new Int16Array(9);
  const colMask = new Int16Array(9);
  const boxMask = new Int16Array(9);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val > 0) {
        const bit = 1 << val;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[getBoxIndex(r, c)] |= bit;
      }
    }
  }

  function fillRemaining() {
    let minCandidates = 10;
    let bestR = -1;
    let bestC = -1;
    let bestMask = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const used = rowMask[r] | colMask[c] | boxMask[getBoxIndex(r, c)];
          const availableMask = (~used) & 0x3FE;

          let count = 0;
          for (let n = 1; n <= 9; n++) {
            if (availableMask & (1 << n)) count++;
          }

          if (count === 0) return false;

          if (count < minCandidates) {
            minCandidates = count;
            bestR = r;
            bestC = c;
            bestMask = availableMask;
            if (count === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (bestR === -1) {
      return true; // 填充完成
    }

    const availableNumbers = [];
    for (let num = 1; num <= 9; num++) {
      if (bestMask & (1 << num)) availableNumbers.push(num);
    }
    shuffle(availableNumbers);

    const boxIdx = getBoxIndex(bestR, bestC);
    for (const num of availableNumbers) {
      const bit = 1 << num;
      board[bestR][bestC] = num;
      rowMask[bestR] |= bit;
      colMask[bestC] |= bit;
      boxMask[boxIdx] |= bit;

      if (fillRemaining()) return true;

      board[bestR][bestC] = 0;
      rowMask[bestR] &= ~bit;
      colMask[bestC] &= ~bit;
      boxMask[boxIdx] &= ~bit;
    }

    return false;
  }

  fillRemaining();
  return board;
}

/**
 * 随机数独出题引擎
 * @param {'easy' | 'medium' | 'hard'} difficulty 难度等级
 * @returns {{ initialBoard: number[][], solutionBoard: number[][] }}
 */
export function generateSudokuPuzzle(difficulty = 'easy') {
  const preset = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
  const targetClues = Math.floor(Math.random() * (preset.maxClues - preset.minClues + 1)) + preset.minClues;

  let bestPuzzle = null;
  let bestClues = 81;

  for (let attempt = 0; attempt < 5; attempt++) {
    const solutionBoard = generateRandomTerminalBoard();
    const puzzle = copyBoard(solutionBoard);
    let remainingClues = 81;

    // 1. 生成 180° 中心对称坐标对
    const pairs = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const oppR = 8 - r;
        const oppC = 8 - c;
        if (r < oppR || (r === oppR && c <= oppC)) {
          pairs.push([[r, c], [oppR, oppC]]);
        }
      }
    }
    shuffle(pairs);

    // 2. 对称挖空
    for (const [[r1, c1], [r2, c2]] of pairs) {
      if (remainingClues <= targetClues) break;

      const isSameCell = (r1 === r2 && c1 === c2);
      const cluesToRemove = isSameCell ? 1 : 2;
      if (remainingClues - cluesToRemove < preset.minClues) continue;

      const val1 = puzzle[r1][c1];
      const val2 = puzzle[r2][c2];
      if (val1 === 0) continue;

      puzzle[r1][c1] = 0;
      puzzle[r2][c2] = 0;

      // 验证是否保持唯一解
      if (countSolutions(puzzle, 2) === 1) {
        remainingClues -= cluesToRemove;
      } else {
        puzzle[r1][c1] = val1;
        puzzle[r2][c2] = val2;
      }
    }

    // 3. 若对称挖空后线索数仍高于 targetClues，尝试单格随机挖空
    if (remainingClues > targetClues) {
      const singleCells = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzle[r][c] !== 0) {
            singleCells.push([r, c]);
          }
        }
      }
      shuffle(singleCells);

      for (const [r, c] of singleCells) {
        if (remainingClues <= targetClues) break;
        if (remainingClues - 1 < preset.minClues) break;

        const val = puzzle[r][c];
        puzzle[r][c] = 0;

        if (countSolutions(puzzle, 2) === 1) {
          remainingClues--;
        } else {
          puzzle[r][c] = val;
        }
      }
    }

    if (remainingClues <= preset.maxClues) {
      return { initialBoard: puzzle, solutionBoard };
    }

    if (remainingClues < bestClues) {
      bestClues = remainingClues;
      bestPuzzle = { initialBoard: puzzle, solutionBoard };
    }
  }

  return bestPuzzle;
}
