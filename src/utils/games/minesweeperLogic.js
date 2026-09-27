/**
 * 扫雷核心算法模块 (Minesweeper Core Logic)
 * 包含：初始化棋盘、首击安全埋雷、BFS 连片展开、插旗切换、胜利检测
 */

/**
 * 创建指定行数和列数的空棋盘
 * @param {number} rows 行数
 * @param {number} cols 列数
 * @returns {Array<Array<object>>} 初始化的二维格子矩阵
 */
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

/**
 * 随机埋雷并计算邻域雷数（确保首击点及其 8 邻域绝对安全）
 * @param {Array<Array<object>>} board 当前棋盘
 * @param {number} rows 行数
 * @param {number} cols 列数
 * @param {number} mineCount 地雷总数
 * @param {number} safeRow 首击安全行
 * @param {number} safeCol 首击安全列
 * @returns {Array<Array<object>>} 埋雷后的新棋盘
 */
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

  // Fisher-Yates 随机洗牌洗出指定雷数
  for (let i = candidatePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidatePositions[i], candidatePositions[j]] = [candidatePositions[j], candidatePositions[i]];
  }

  const actualMines = Math.min(mineCount, candidatePositions.length);
  for (let i = 0; i < actualMines; i++) {
    const { r, c } = candidatePositions[i];
    newBoard[r][c].isMine = true;
  }

  // 计算每个非雷格子的邻近雷数
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

/**
 * 揭开指定格子，若为空白格 (neighborMines === 0) 则执行 BFS Flood Fill 自动连片展开
 * @param {Array<Array<object>>} board 当前棋盘
 * @param {number} row 目标行
 * @param {number} col 目标列
 * @returns {{ board: Array<Array<object>>, exploded: boolean, revealedCount: number }}
 */
export function revealCell(board, row, col) {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const rows = newBoard.length;
  const cols = newBoard[0].length;

  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return { board: newBoard, exploded: false, revealedCount: 0 };
  }

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

    // 只有当自身周围没有雷时才向 8 邻域扩散展开
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

/**
 * 切换格子的插旗状态（已揭开格子不可插旗）
 * @param {Array<Array<object>>} board 当前棋盘
 * @param {number} row 目标行
 * @param {number} col 目标列
 * @returns {Array<Array<object>>} 更新后的新棋盘
 */
export function toggleFlag(board, row, col) {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  if (row < 0 || row >= newBoard.length || col < 0 || col >= newBoard[0].length) {
    return newBoard;
  }
  const target = newBoard[row][col];
  if (!target.isRevealed) {
    target.isFlagged = !target.isFlagged;
  }
  return newBoard;
}

/**
 * 检查是否已达成胜利条件（所有非雷格均已被揭开）
 * @param {Array<Array<object>>} board 当前棋盘
 * @param {number} mineCount 地雷总数
 * @returns {boolean} 是否胜利
 */
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
