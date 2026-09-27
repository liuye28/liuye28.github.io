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
    assert.equal(board[0][0].neighborMines, 0);
    assert.equal(board[0][0].row, 0);
    assert.equal(board[0][0].col, 0);
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

  test('首击安全机制在角落和边缘正常工作', () => {
    const initialBoard = createInitialBoard(9, 9);
    const safeR = 0;
    const safeC = 0;
    const minedBoard = placeMines(initialBoard, 9, 9, 10, safeR, safeC);

    // 检查角落安全区 (0,0) 及合法邻域
    for (let r = 0; r <= 1; r++) {
      for (let c = 0; c <= 1; c++) {
        assert.equal(minedBoard[r][c].isMine, false, `Safe corner cell at (${r},${c}) had mine!`);
      }
    }

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

  test('点击有数字的格子只展开自己不扩散', () => {
    const board = createInitialBoard(3, 3);
    board[0][1].isMine = true;
    board[0][0].neighborMines = 1;
    board[1][0].neighborMines = 1;
    board[1][1].neighborMines = 1;

    const { board: revealedBoard, exploded, revealedCount } = revealCell(board, 0, 0);
    assert.equal(exploded, false);
    assert.equal(revealedCount, 1);
    assert.equal(revealedBoard[0][0].isRevealed, true);
    assert.equal(revealedBoard[1][0].isRevealed, false);
  });

  test('点击地雷触发 exploded 且揭开地雷', () => {
    const board = createInitialBoard(3, 3);
    board[1][1].isMine = true;

    const { board: revealedBoard, exploded, revealedCount } = revealCell(board, 1, 1);
    assert.equal(exploded, true);
    assert.equal(revealedCount, 1);
    assert.equal(revealedBoard[1][1].isRevealed, true);
  });

  test('已揭开或已插旗格子点击无反应', () => {
    let board = createInitialBoard(3, 3);
    board = toggleFlag(board, 0, 0);
    const res1 = revealCell(board, 0, 0);
    assert.equal(res1.revealedCount, 0);
    assert.equal(res1.exploded, false);

    board[0][1].isRevealed = true;
    const res2 = revealCell(board, 0, 1);
    assert.equal(res2.revealedCount, 0);
    assert.equal(res2.exploded, false);
  });

  test('插旗与反插旗切换，已揭开格子不可插旗', () => {
    let board = createInitialBoard(2, 2);
    board = toggleFlag(board, 0, 0);
    assert.equal(board[0][0].isFlagged, true);
    board = toggleFlag(board, 0, 0);
    assert.equal(board[0][0].isFlagged, false);

    board[1][1].isRevealed = true;
    board = toggleFlag(board, 1, 1);
    assert.equal(board[1][1].isFlagged, false);
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
