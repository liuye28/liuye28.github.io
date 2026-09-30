/**
 * 五子棋核心算法模块 (Gomoku Core Logic)
 * 包含：15x15 棋盘初始化、4 轴向胜负判定、候选落子剪枝、棋型启发式评估、
 * 基于 Minimax + Alpha-Beta 剪枝的 3 级难度 AI 决策引擎与悔棋支持。
 */

export const BOARD_SIZE = 15;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export const PATTERN_SCORES = {
  FIVE: 100000,
  OPEN_FOUR: 10000,
  RUSH_FOUR: 1000,
  OPEN_THREE: 1000,
  SLEEP_THREE: 100,
  OPEN_TWO: 100,
};

export const DIRECTIONS = [
  [0, 1],   // 水平 (Horizontal)
  [1, 0],   // 垂直 (Vertical)
  [1, 1],   // 主对角线 (Main diagonal \)
  [1, -1]   // 副对角线 (Anti-diagonal /)
];

/**
 * 预计算棋盘全部 72 条长度 >= 5 的线段坐标
 */
const ALL_LINES = [];

// 1. 水平线 (15条)
for (let r = 0; r < BOARD_SIZE; r++) {
  const line = [];
  for (let c = 0; c < BOARD_SIZE; c++) {
    line.push([r, c]);
  }
  ALL_LINES.push(line);
}

// 2. 垂直线 (15条)
for (let c = 0; c < BOARD_SIZE; c++) {
  const line = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    line.push([r, c]);
  }
  ALL_LINES.push(line);
}

// 3. 主对角线 (\, dr=1, dc=1, 21条)
for (let c = 0; c <= BOARD_SIZE - 5; c++) {
  const line = [];
  let r = 0, curC = c;
  while (r < BOARD_SIZE && curC < BOARD_SIZE) {
    line.push([r, curC]);
    r++; curC++;
  }
  ALL_LINES.push(line);
}
for (let r = 1; r <= BOARD_SIZE - 5; r++) {
  const line = [];
  let curR = r, c = 0;
  while (curR < BOARD_SIZE && c < BOARD_SIZE) {
    line.push([curR, c]);
    curR++; c++;
  }
  ALL_LINES.push(line);
}

// 4. 副对角线 (/, dr=1, dc=-1, 21条)
for (let c = 4; c < BOARD_SIZE; c++) {
  const line = [];
  let r = 0, curC = c;
  while (r < BOARD_SIZE && curC >= 0) {
    line.push([r, curC]);
    r++; curC--;
  }
  ALL_LINES.push(line);
}
for (let r = 1; r <= BOARD_SIZE - 5; r++) {
  const line = [];
  let curR = r, c = BOARD_SIZE - 1;
  while (curR < BOARD_SIZE && c >= 0) {
    line.push([curR, c]);
    curR++; c--;
  }
  ALL_LINES.push(line);
}

/**
 * 创建 15x15 全 0 空棋盘矩阵
 * @returns {number[][]}
 */
export function createEmptyBoard() {
  const board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    board.push(new Array(BOARD_SIZE).fill(EMPTY));
  }
  return board;
}

/**
 * 校验坐标是否在棋盘合法范围内
 * @param {number} row 
 * @param {number} col 
 * @returns {boolean}
 */
export function isValidCoordinate(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * 检查最新落子后是否达成胜利（5子及以上连珠）
 * @param {number[][]} board 棋盘状态
 * @param {number} lastRow 最新落子行
 * @param {number} lastCol 最新落子列
 * @returns {{ win: boolean, winner: number, winningLine: number[][] }}
 */
export function checkGomokuWin(board, lastRow, lastCol) {
  if (
    !board ||
    lastRow === undefined ||
    lastCol === undefined ||
    !isValidCoordinate(lastRow, lastCol)
  ) {
    return { win: false, winner: EMPTY, winningLine: [] };
  }

  const color = board[lastRow][lastCol];
  if (color === EMPTY) {
    return { win: false, winner: EMPTY, winningLine: [] };
  }

  for (const [dr, dc] of DIRECTIONS) {
    const line = [[lastRow, lastCol]];

    // 反向辐射 (-dr, -dc)
    let step = 1;
    while (true) {
      const nr = lastRow - step * dr;
      const nc = lastCol - step * dc;
      if (!isValidCoordinate(nr, nc) || board[nr][nc] !== color) break;
      line.unshift([nr, nc]);
      step++;
    }

    // 正向辐射 (+dr, +dc)
    step = 1;
    while (true) {
      const nr = lastRow + step * dr;
      const nc = lastCol + step * dc;
      if (!isValidCoordinate(nr, nc) || board[nr][nc] !== color) break;
      line.push([nr, nc]);
      step++;
    }

    if (line.length >= 5) {
      return { win: true, winner: color, winningLine: line };
    }
  }

  return { win: false, winner: EMPTY, winningLine: [] };
}

/**
 * 搜集并剪枝候选落子点
 * 空盘时返回中心 [7, 7]；否则提取场上已有棋子周边 1~2 格范围内的空格并按紧邻度排序
 * @param {number[][]} board 棋盘
 * @returns {number[][]} 候选坐标列表 [[r, c], ...]
 */
export function getCandidateMoves(board) {
  const occupied = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== EMPTY) {
        occupied.push([r, c]);
      }
    }
  }

  if (occupied.length === 0) {
    return [[7, 7]];
  }

  const candidateMap = new Map();

  for (const [pr, pc] of occupied) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = pr + dr;
        const nc = pc + dc;
        if (!isValidCoordinate(nr, nc)) continue;
        if (board[nr][nc] !== EMPTY) continue;

        const key = `${nr},${nc}`;
        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        // 距离 1 赋高权，距离 2 赋低权
        const weight = dist === 1 ? 10 : 3;

        const existing = candidateMap.get(key);
        if (existing) {
          existing.score += weight;
        } else {
          // 天元微调奖励，使同等权重偏向中盘发展
          const centerBonus = (7 - Math.abs(nr - 7)) * 0.1 + (7 - Math.abs(nc - 7)) * 0.1;
          candidateMap.set(key, { r: nr, c: nc, score: weight + centerBonus });
        }
      }
    }
  }

  const sortedCandidates = Array.from(candidateMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  return sortedCandidates.map(item => [item.r, item.c]);
}

/**
 * 评估单条线段上指定颜色的棋型得分
 * @param {number[][]} board 
 * @param {number[][]} line 
 * @param {number} targetColor 
 * @returns {number}
 */
function evaluateLineForColor(board, line, targetColor) {
  let score = 0;
  const n = line.length;
  let i = 0;
  let prevLen = 0;
  let prevEnd = -2;

  while (i < n) {
    const [r, c] = line[i];
    if (board[r][c] === targetColor) {
      const start = i;
      while (i < n && board[line[i][0]][line[i][1]] === targetColor) {
        i++;
      }
      const len = i - start;
      const end = i - 1;

      const leftOpen = start > 0 && board[line[start - 1][0]][line[start - 1][1]] === EMPTY;
      const rightOpen = end < n - 1 && board[line[end + 1][0]][line[end + 1][1]] === EMPTY;

      if (len >= 5) {
        score += PATTERN_SCORES.FIVE;
      } else if (len === 4) {
        if (leftOpen && rightOpen) {
          score += PATTERN_SCORES.OPEN_FOUR;
        } else if (leftOpen || rightOpen) {
          score += PATTERN_SCORES.RUSH_FOUR;
        }
      } else if (len === 3) {
        if (leftOpen && rightOpen) {
          const leftSpace = start > 1 && board[line[start - 2][0]][line[start - 2][1]] === EMPTY;
          const rightSpace = end < n - 2 && board[line[end + 2][0]][line[end + 2][1]] === EMPTY;
          if (leftSpace || rightSpace) {
            score += PATTERN_SCORES.OPEN_THREE;
          } else {
            score += PATTERN_SCORES.SLEEP_THREE;
          }
        } else if (leftOpen || rightOpen) {
          score += PATTERN_SCORES.SLEEP_THREE;
        }
      } else if (len === 2) {
        if (leftOpen && rightOpen) {
          const leftSpace = start > 1 && board[line[start - 2][0]][line[start - 2][1]] === EMPTY;
          const rightSpace = end < n - 2 && board[line[end + 2][0]][line[end + 2][1]] === EMPTY;
          if (leftSpace || rightSpace) {
            score += PATTERN_SCORES.OPEN_TWO;
          }
        }
      }

      // 跳四/跳三检测 (跨单空位)
      if (prevLen > 0 && start - prevEnd === 2) {
        const jumpTotal = prevLen + len;
        if (jumpTotal === 4) {
          score += PATTERN_SCORES.RUSH_FOUR;
        } else if (jumpTotal === 3) {
          const prevStart = prevEnd - prevLen + 1;
          const prevLeftOpen = prevStart > 0 && board[line[prevStart - 1][0]][line[prevStart - 1][1]] === EMPTY;
          if (prevLeftOpen && rightOpen) {
            score += PATTERN_SCORES.OPEN_THREE;
          } else {
            score += PATTERN_SCORES.SLEEP_THREE;
          }
        }
      }

      prevLen = len;
      prevEnd = end;
    } else {
      if (board[line[i][0]][line[i][1]] !== EMPTY) {
        prevLen = 0;
        prevEnd = -2;
      }
      i++;
    }
  }

  return score;
}

/**
 * 全盘启发式棋型评估
 * 扫描全盘所有线段，对连五、活四、冲四、活三、眠三、活二按攻防加权求和
 * @param {number[][]} board 棋盘
 * @param {number} aiColor AI 棋子颜色 (BLACK 或 WHITE)
 * @returns {number} AI 综合优势净得分
 */
export function evaluateBoard(board, aiColor) {
  const oppColor = aiColor === BLACK ? WHITE : BLACK;
  let aiTotal = 0;
  let oppTotal = 0;

  for (let i = 0; i < ALL_LINES.length; i++) {
    const line = ALL_LINES[i];
    let hasAi = false;
    let hasOpp = false;

    for (let j = 0; j < line.length; j++) {
      const cell = board[line[j][0]][line[j][1]];
      if (cell === aiColor) hasAi = true;
      else if (cell === oppColor) hasOpp = true;
    }

    if (hasAi) {
      aiTotal += evaluateLineForColor(board, line, aiColor);
    }
    if (hasOpp) {
      oppTotal += evaluateLineForColor(board, line, oppColor);
    }
  }

  // 1.2 防守权重比例系数，优先化解对手攻势
  return Math.round(aiTotal - oppTotal * 1.2);
}

/**
 * 局部快速落子潜力估算（用于候选点排序启发式）
 * @param {number[][]} board 
 * @param {number} r 
 * @param {number} c 
 * @param {number} color 
 * @returns {number}
 */
function evaluateMovePotential(board, r, c, color) {
  let score = 0;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    // 正向
    let step = 1;
    while (step <= 4) {
      const nr = r + step * dr;
      const nc = c + step * dc;
      if (!isValidCoordinate(nr, nc)) break;
      if (board[nr][nc] === color) {
        count++;
        step++;
      } else {
        if (board[nr][nc] === EMPTY) openEnds++;
        break;
      }
    }

    // 反向
    step = 1;
    while (step <= 4) {
      const nr = r - step * dr;
      const nc = c - step * dc;
      if (!isValidCoordinate(nr, nc)) break;
      if (board[nr][nc] === color) {
        count++;
        step++;
      } else {
        if (board[nr][nc] === EMPTY) openEnds++;
        break;
      }
    }

    if (count >= 5) {
      score += PATTERN_SCORES.FIVE;
    } else if (count === 4) {
      score += openEnds === 2 ? PATTERN_SCORES.OPEN_FOUR : (openEnds === 1 ? PATTERN_SCORES.RUSH_FOUR : 0);
    } else if (count === 3) {
      score += openEnds === 2 ? PATTERN_SCORES.OPEN_THREE : (openEnds === 1 ? PATTERN_SCORES.SLEEP_THREE : 0);
    } else if (count === 2) {
      score += openEnds === 2 ? PATTERN_SCORES.OPEN_TWO : 10;
    }
  }

  return score;
}

/**
 * Minimax 递归搜索与 Alpha-Beta 剪枝
 */
function minimax(board, depth, alpha, beta, isMaximizing, aiColor, oppColor, lastMove) {
  if (lastMove) {
    const [lr, lc] = lastMove;
    const lastColor = isMaximizing ? oppColor : aiColor;
    const winResult = checkGomokuWin(board, lr, lc);
    if (winResult.win) {
      return lastColor === aiColor ? (500000 + depth * 1000) : (-500000 - depth * 1000);
    }
  }

  if (depth === 0) {
    return evaluateBoard(board, aiColor);
  }

  const rawCandidates = getCandidateMoves(board);
  if (rawCandidates.length === 0) {
    return 0;
  }

  const currentColor = isMaximizing ? aiColor : oppColor;
  const otherColor = isMaximizing ? oppColor : aiColor;

  const scoredMoves = rawCandidates.map(([r, c]) => {
    const atk = evaluateMovePotential(board, r, c, currentColor);
    const def = evaluateMovePotential(board, r, c, otherColor);
    return { r, c, score: atk + def * 1.1 };
  });
  scoredMoves.sort((a, b) => b.score - a.score);

  // 严格控制分支数，确保 master 深度性能稳定在 150ms 以内
  const limit = depth === 3 ? 12 : (depth === 2 ? 8 : 6);
  const candidates = scoredMoves.slice(0, limit);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of candidates) {
      board[move.r][move.c] = aiColor;
      const evaluation = minimax(board, depth - 1, alpha, beta, false, aiColor, oppColor, [move.r, move.c]);
      board[move.r][move.c] = EMPTY;

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Beta 剪枝
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of candidates) {
      board[move.r][move.c] = oppColor;
      const evaluation = minimax(board, depth - 1, alpha, beta, true, aiColor, oppColor, [move.r, move.c]);
      board[move.r][move.c] = EMPTY;

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Alpha 剪枝
      }
    }
    return minEval;
  }
}

/**
 * AI 决策引擎：根据当前难度返回最佳落子坐标
 * @param {number[][]} board 棋盘状态
 * @param {number} aiColor AI 执子颜色 (默认 WHITE)
 * @param {'beginner' | 'intermediate' | 'master'} difficulty AI 难度级别
 * @returns {[number, number] | null} 最佳落子坐标 [row, col]
 */
export function getBestMove(board, aiColor = WHITE, difficulty = 'intermediate') {
  const oppColor = aiColor === BLACK ? WHITE : BLACK;

  const rawCandidates = getCandidateMoves(board);
  if (rawCandidates.length === 0) {
    return null;
  }

  // 开局空盘优先下天元
  if (rawCandidates.length === 1 && rawCandidates[0][0] === 7 && rawCandidates[0][1] === 7) {
    return [7, 7];
  }

  // 1. 斩杀判断：检查 AI 本身能否直接连成五子
  for (const [r, c] of rawCandidates) {
    board[r][c] = aiColor;
    const winRes = checkGomokuWin(board, r, c);
    board[r][c] = EMPTY;
    if (winRes.win) {
      return [r, c];
    }
  }

  // 2. 必死防守：检查对手能否在下一步连成五子
  for (const [r, c] of rawCandidates) {
    board[r][c] = oppColor;
    const winRes = checkGomokuWin(board, r, c);
    board[r][c] = EMPTY;
    if (winRes.win) {
      return [r, c];
    }
  }

  // 候选点结合攻守价值预排序
  const scoredMoves = rawCandidates.map(([r, c]) => {
    const atk = evaluateMovePotential(board, r, c, aiColor);
    const def = evaluateMovePotential(board, r, c, oppColor);
    return { r, c, score: atk + def * 1.1 };
  });
  scoredMoves.sort((a, b) => b.score - a.score);

  // beginner: 1 层贪心评估 + 微调选择
  if (difficulty === 'beginner') {
    const topCandidates = scoredMoves.slice(0, 10);
    let bestScore = -Infinity;
    let bestMoves = [];

    for (const move of topCandidates) {
      board[move.r][move.c] = aiColor;
      const score = evaluateBoard(board, aiColor);
      board[move.r][move.c] = EMPTY;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [[move.r, move.c]];
      } else if (score === bestScore) {
        bestMoves.push([move.r, move.c]);
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)] || [topCandidates[0].r, topCandidates[0].c];
  }

  // intermediate: 2 层 Minimax；master: 3 层 Minimax
  const depth = difficulty === 'master' ? 3 : 2;
  const rootLimit = difficulty === 'master' ? 14 : 10;
  const candidatesToSearch = scoredMoves.slice(0, rootLimit);

  let bestMove = [candidatesToSearch[0].r, candidatesToSearch[0].c];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of candidatesToSearch) {
    board[move.r][move.c] = aiColor;
    const evaluation = minimax(board, depth - 1, alpha, beta, false, aiColor, oppColor, [move.r, move.c]);
    board[move.r][move.c] = EMPTY;

    if (evaluation > bestScore) {
      bestScore = evaluation;
      bestMove = [move.r, move.c];
    }
    alpha = Math.max(alpha, evaluation);
  }

  return bestMove;
}

/**
 * 悔棋辅助：弹出最近 2 步（若包含 AI 落子与玩家落子），根据剩余 history 还原棋盘
 * @param {Array<{ row: number, col: number, color: number }>} history 历史对局落子记录
 * @returns {{ newBoard: number[][], newHistory: Array<{ row: number, col: number, color: number }> }}
 */
export function undoLastMove(history) {
  if (!history || history.length === 0) {
    return { newBoard: createEmptyBoard(), newHistory: [] };
  }

  const stepsToPop = history.length >= 2 ? 2 : 1;
  const newHistory = history.slice(0, history.length - stepsToPop);
  const newBoard = createEmptyBoard();

  for (const move of newHistory) {
    newBoard[move.row][move.col] = move.color;
  }

  return { newBoard, newHistory };
}
