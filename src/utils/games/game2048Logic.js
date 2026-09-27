/**
 * 2048 核心数学与状态转换逻辑 (纯函数集合，无副作用)
 */

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
