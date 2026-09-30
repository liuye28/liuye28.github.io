/**
 * 俄罗斯方块 (Tetris) 核心纯算法模块
 *
 * 遵循现代 Tetris Guideline 标准实现：
 * - 7 种标准方块 (I, O, T, S, Z, J, L) 与四向旋转矩阵
 * - 7-Bag 随机器 (Fisher-Yates 随机洗牌)
 * - 几何碰撞检测与越界拦截 (isValidPosition)
 * - 幽灵投影 (getGhostDropY)
 * - SRS (Super Rotation System) 踢墙系统 (rotatePiece)
 * - 纯函数固化方块 (placePiece)
 * - 消行与重力补空 (clearLines)
 * - 阶段得分与动态下落帧率换算 (calculateScore, getDropInterval)
 */

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TETROMINO_COLORS = {
  1: '#06b6d4', // I - 青色 / 霓虹天蓝
  2: '#eab308', // O - 金黄 / 琥珀
  3: '#a855f7', // T - 紫色 / 霓虹紫
  4: '#22c55e', // S - 绿色 / 翡翠绿
  5: '#ef4444', // Z - 红色 / 玫瑰红
  6: '#3b82f6', // J - 蓝色 / 宝石蓝
  7: '#f97316'  // L - 橙色 / 日落橙
};

/**
 * 7 种标准 Tetromino 形状矩阵定义 (4x4, 3x3, 2x2)
 * 旋转态 0: 0° (Spawn), 1: 90° (Clockwise), 2: 180°, 3: 270° (Counter-clockwise)
 */
export const TETROMINOES = {
  I: {
    id: 1,
    color: TETROMINO_COLORS[1],
    shapes: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
      ]
    ]
  },
  O: {
    id: 2,
    color: TETROMINO_COLORS[2],
    shapes: [
      [
        [1, 1],
        [1, 1]
      ],
      [
        [1, 1],
        [1, 1]
      ],
      [
        [1, 1],
        [1, 1]
      ],
      [
        [1, 1],
        [1, 1]
      ]
    ]
  },
  T: {
    id: 3,
    color: TETROMINO_COLORS[3],
    shapes: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0]
      ]
    ]
  },
  S: {
    id: 4,
    color: TETROMINO_COLORS[4],
    shapes: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1]
      ],
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0]
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0]
      ]
    ]
  },
  Z: {
    id: 5,
    color: TETROMINO_COLORS[5],
    shapes: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1]
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0]
      ]
    ]
  },
  J: {
    id: 6,
    color: TETROMINO_COLORS[6],
    shapes: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0]
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1]
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0]
      ]
    ]
  },
  L: {
    id: 7,
    color: TETROMINO_COLORS[7],
    shapes: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1]
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0]
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0]
      ]
    ]
  }
};

const TETROMINO_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * 标准 SRS (Super Rotation System) Kick 踢墙表 (屏幕坐标: +dx 右, +dy 下)
 * 屏幕 dy = -math_dy
 */
const KICKS_JLSTZ = {
  '0->1': [[0, 0], [-1,  0], [-1, -1], [0,  2], [-1,  2]],
  '1->0': [[0, 0], [ 1,  0], [ 1,  1], [0, -2], [ 1, -2]],
  '1->2': [[0, 0], [ 1,  0], [ 1,  1], [0, -2], [ 1, -2]],
  '2->1': [[0, 0], [-1,  0], [-1, -1], [0,  2], [-1,  2]],
  '2->3': [[0, 0], [ 1,  0], [ 1, -1], [0,  2], [ 1,  2]],
  '3->2': [[0, 0], [-1,  0], [-1,  1], [0, -2], [-1, -2]],
  '3->0': [[0, 0], [-1,  0], [-1,  1], [0, -2], [-1, -2]],
  '0->3': [[0, 0], [ 1,  0], [ 1, -1], [0,  2], [ 1,  2]]
};

const KICKS_I = {
  '0->1': [[0, 0], [-2,  0], [ 1,  0], [-2,  1], [ 1, -2]],
  '1->0': [[0, 0], [ 2,  0], [-1,  0], [ 2, -1], [-1,  2]],
  '1->2': [[0, 0], [-1,  0], [ 2,  0], [-1, -2], [ 2,  1]],
  '2->1': [[0, 0], [ 1,  0], [-2,  0], [ 1,  2], [-2, -1]],
  '2->3': [[0, 0], [ 2,  0], [-1,  0], [ 2, -1], [-1,  2]],
  '3->2': [[0, 0], [-2,  0], [ 1,  0], [-2,  1], [ 1, -2]],
  '3->0': [[0, 0], [ 1,  0], [-2,  0], [ 1,  2], [-2, -1]],
  '0->3': [[0, 0], [-1,  0], [ 2,  0], [-1, -2], [ 2,  1]]
};

/**
 * 创建 20 行 x 10 列的空棋盘（全部为 0）
 */
export function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

/**
 * 7-Bag 随机器：生成包含 7 种方块的随机乱序序列
 */
export function generate7Bag() {
  const bag = [...TETROMINO_KEYS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/**
 * 提取方块类型标识字符串
 */
function resolvePieceType(pieceType) {
  if (typeof pieceType === 'object' && pieceType !== null) {
    return pieceType.type;
  }
  return pieceType;
}

/**
 * 几何碰撞与合法性检测
 * @param {number[][]} board - 棋盘矩阵
 * @param {string|object} pieceType - 方块类型 ('I'|'O'|'T'|'S'|'Z'|'J'|'L')
 * @param {number} x - 目标左上角列坐标
 * @param {number} y - 目标左上角行坐标
 * @param {number} rotation - 旋转状态 (0~3)
 * @returns {boolean} 是否合法
 */
export function isValidPosition(board, pieceType, x, y, rotation = 0) {
  const type = resolvePieceType(pieceType);
  const pieceDef = TETROMINOES[type];
  if (!pieceDef) return false;

  const shape = pieceDef.shapes[((rotation % 4) + 4) % 4];
  const rows = shape.length;
  const cols = shape[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c] !== 0) {
        const boardX = x + c;
        const boardY = y + r;

        // 左右出界检测
        if (boardX < 0 || boardX >= BOARD_WIDTH) {
          return false;
        }

        // 底部出界检测
        if (boardY >= BOARD_HEIGHT) {
          return false;
        }

        // 已固化方块碰撞检测 (boardY < 0 时为顶部缓冲区域，不判定方块阻挡)
        if (boardY >= 0) {
          if (board[boardY][boardX] > 0) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

/**
 * 计算当前方块落底的幽灵投影 Y 坐标
 */
export function getGhostDropY(board, pieceType, x, y, rotation = 0) {
  if (!isValidPosition(board, pieceType, x, y, rotation)) {
    return y;
  }

  let ghostY = y;
  while (isValidPosition(board, pieceType, x, ghostY + 1, rotation)) {
    ghostY++;
  }
  return ghostY;
}

/**
 * 执行带 SRS Wall Kick 踢墙检测的旋转
 * @param {number[][]} board
 * @param {string|object} pieceType
 * @param {number} x
 * @param {number} y
 * @param {number} currentRotation
 * @param {boolean} [clockwise=true]
 * @returns {{ newRotation: number, newX: number, newY: number, success: boolean }}
 */
export function rotatePiece(board, pieceType, x, y, currentRotation, clockwise = true) {
  const type = resolvePieceType(pieceType);
  const pieceDef = TETROMINOES[type];
  if (!pieceDef) {
    return { newRotation: currentRotation, newX: x, newY: y, success: false };
  }

  const normCurrent = ((currentRotation % 4) + 4) % 4;
  const nextRotation = clockwise ? (normCurrent + 1) % 4 : (normCurrent + 3) % 4;

  // O 方块无旋转变形与踢墙
  if (type === 'O') {
    return { newRotation: nextRotation, newX: x, newY: y, success: true };
  }

  const key = `${normCurrent}->${nextRotation}`;
  const kickTable = type === 'I' ? KICKS_I : KICKS_JLSTZ;
  const offsets = kickTable[key] || [[0, 0]];

  for (const [dx, dy] of offsets) {
    const testX = x + dx;
    const testY = y + dy;
    if (isValidPosition(board, type, testX, testY, nextRotation)) {
      return {
        newRotation: nextRotation,
        newX: testX,
        newY: testY,
        success: true
      };
    }
  }

  // 所有踢墙偏移均碰撞，旋转失败保持原位
  return {
    newRotation: currentRotation,
    newX: x,
    newY: y,
    success: false
  };
}

/**
 * 固化方块到新棋盘中 (纯函数不可变)
 */
export function placePiece(board, pieceType, x, y, rotation = 0) {
  const type = resolvePieceType(pieceType);
  const pieceDef = TETROMINOES[type];
  if (!pieceDef) {
    return board.map(row => [...row]);
  }

  const shape = pieceDef.shapes[((rotation % 4) + 4) % 4];
  const newBoard = board.map(row => [...row]);

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardY = y + r;
        const boardX = x + c;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = pieceDef.id;
        }
      }
    }
  }

  return newBoard;
}

/**
 * 消除所有满行并在顶部补空
 * @param {number[][]} board
 * @returns {{ newBoard: number[][], linesCleared: number, clearedIndices: number[] }}
 */
export function clearLines(board) {
  const clearedIndices = [];
  const remainingRows = [];

  for (let r = 0; r < board.length; r++) {
    const isFull = board[r].every(cell => cell > 0);
    if (isFull) {
      clearedIndices.push(r);
    } else {
      remainingRows.push([...board[r]]);
    }
  }

  const linesCleared = clearedIndices.length;
  if (linesCleared === 0) {
    return {
      newBoard: board.map(row => [...row]),
      linesCleared: 0,
      clearedIndices: []
    };
  }

  const emptyRows = Array.from({ length: linesCleared }, () => Array(BOARD_WIDTH).fill(0));
  const newBoard = [...emptyRows, ...remainingRows];

  return {
    newBoard,
    linesCleared,
    clearedIndices
  };
}

/**
 * 现代俄罗斯方块得分公式：1 行 100×Lvl，2 行 300×Lvl，3 行 500×Lvl，4 行 800×Lvl
 */
const LINE_POINTS = [0, 100, 300, 500, 800];

export function calculateScore(linesCleared, level = 1) {
  if (linesCleared <= 0) return 0;
  const basePoints = LINE_POINTS[linesCleared] ?? (800 + (linesCleared - 4) * 300);
  return basePoints * Math.max(1, level);
}

/**
 * 随等级提升的自动下落间隔 (毫秒)
 */
export function getDropInterval(level = 1) {
  return Math.max(100, 800 - (Math.max(1, level) - 1) * 70);
}
