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
  TETROMINO_COLORS,
  BOARD_WIDTH,
  BOARD_HEIGHT
} from '../src/utils/games/tetrisLogic.js';

describe('Tetris Logic Core Suite', () => {
  test('初始空棋盘尺寸与空状态正确', () => {
    const board = createEmptyBoard();
    assert.equal(board.length, BOARD_HEIGHT);
    assert.equal(board[0].length, BOARD_WIDTH);
    assert.equal(BOARD_HEIGHT, 20);
    assert.equal(BOARD_WIDTH, 10);
    assert.ok(board.every(row => row.every(cell => cell === 0)));
  });

  test('7-Bag 随机器连续两轮包含所有 7 种方块', () => {
    const bag1 = generate7Bag();
    assert.equal(bag1.length, 7);
    const set1 = new Set(bag1);
    assert.equal(set1.size, 7);
    assert.ok(['I', 'O', 'T', 'S', 'Z', 'J', 'L'].every(k => set1.has(k)));

    const bag2 = generate7Bag();
    assert.equal(bag2.length, 7);
    const set2 = new Set(bag2);
    assert.equal(set2.size, 7);
    assert.ok(['I', 'O', 'T', 'S', 'Z', 'J', 'L'].every(k => set2.has(k)));
  });

  test('7 种 Tetromino 结构元数据与颜色完整性', () => {
    const expectedKeys = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    expectedKeys.forEach((key, index) => {
      const piece = TETROMINOES[key];
      assert.ok(piece, `Tetromino ${key} 应存在`);
      assert.equal(piece.id, index + 1);
      assert.equal(typeof piece.color, 'string');
      assert.equal(piece.shapes.length, 4, `${key} 必须具备 4 态旋转矩阵`);
      assert.equal(TETROMINO_COLORS[piece.id], piece.color);
    });
  });

  test('碰撞检测 isValidPosition 正确识别出界与阻挡', () => {
    const board = createEmptyBoard();
    // 合法居中
    assert.ok(isValidPosition(board, 'T', 3, 0, 0));
    // 支持传对象
    assert.ok(isValidPosition(board, { type: 'T' }, 3, 0, 0));
    // 左出界
    assert.equal(isValidPosition(board, 'T', -2, 0, 0), false);
    // 右出界
    assert.equal(isValidPosition(board, 'T', 9, 0, 0), false);
    // 底出界
    assert.equal(isValidPosition(board, 'T', 3, 20, 0), false);

    // 预设地面障碍
    board[19][4] = 1;
    assert.equal(isValidPosition(board, 'O', 3, 18, 0), false);
    assert.ok(isValidPosition(board, 'O', 1, 18, 0));
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

  test('SRS 旋转踢墙系统能够成功避让右侧边界踢墙', () => {
    const board = createEmptyBoard();
    // I 方块在旋转 1 态（竖条，第 2 列），在 x = 7 时第 2 列恰好位于 boardX = 9（贴右墙）
    // 从 1 态逆时针旋转回 0 态（横条），若不踢墙 [0, 0] 会冲出右边界（需要 x <= 6）
    // SRS 踢墙表在第三次测试 [-1, 0] 命中，向左平移 1 格到 x = 6 成功脱困
    const kickResult = rotatePiece(board, 'I', 7, 10, 1, false);
    assert.ok(kickResult.success);
    assert.equal(kickResult.newRotation, 0);
    assert.equal(kickResult.newX, 6);
    assert.ok(isValidPosition(board, 'I', kickResult.newX, kickResult.newY, kickResult.newRotation));
  });

  test('固化方块 placePiece 与不可变性保持', () => {
    const board = createEmptyBoard();
    const placedBoard = placePiece(board, 'T', 3, 10, 0);

    // 原始棋盘绝不被修改
    assert.equal(board[10][4], 0);
    assert.equal(board[11][3], 0);

    // 新棋盘对应位置写入 T 的 ID (3)
    assert.equal(placedBoard[10][4], 3);
    assert.equal(placedBoard[11][3], 3);
    assert.equal(placedBoard[11][4], 3);
    assert.equal(placedBoard[11][5], 3);
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

  test('Tetris 四消判定与多行消除下落', () => {
    let board = createEmptyBoard();
    // 填满最后 4 行 (16, 17, 18, 19)
    for (let r = 16; r <= 19; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        board[r][c] = 2;
      }
    }
    // 第 15 行留一个测试格子
    board[15][2] = 7;

    const { newBoard, linesCleared, clearedIndices } = clearLines(board);
    assert.equal(linesCleared, 4);
    assert.deepEqual(clearedIndices, [16, 17, 18, 19]);
    // 第 15 行落到第 19 行
    assert.equal(newBoard[19][2], 7);
    // 前 4 行必须全 0
    for (let r = 0; r < 4; r++) {
      assert.ok(newBoard[r].every(c => c === 0));
    }
  });

  test('计分公式与等级下落速度计算正确', () => {
    assert.equal(calculateScore(0, 1), 0);
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
