import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyBoard,
  addRandomTile,
  slideAndMergeLine,
  moveBoard,
  hasMovesAvailable,
  hasWon,
  getMaxTile,
} from '../src/utils/games/game2048Logic.js';

describe('2048 Logic Core Suite', () => {
  test('createEmptyBoard 初始化空棋盘', () => {
    const board = createEmptyBoard();
    assert.equal(board.length, 4);
    assert.equal(board[0].length, 4);
    assert.deepEqual(board, [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const board3 = createEmptyBoard(3);
    assert.equal(board3.length, 3);
    assert.equal(board3[0].length, 3);
  });

  test('addRandomTile 在空位置随机生成 2 或 4', () => {
    const board = createEmptyBoard();
    const newBoard = addRandomTile(board);
    // 不修改原棋盘
    assert.equal(board.flat().filter((v) => v !== 0).length, 0);

    const nonZero = newBoard.flat().filter((v) => v !== 0);
    assert.equal(nonZero.length, 1);
    assert.ok(nonZero[0] === 2 || nonZero[0] === 4);

    // 棋盘已满时直接返回原棋盘
    const fullBoard = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    const fullRes = addRandomTile(fullBoard);
    assert.deepEqual(fullRes, fullBoard);
  });

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

    // 3 个相同数字靠左优先合并 (2, 2, 2, 0 -> 4, 2, 0, 0)
    const res5 = slideAndMergeLine([2, 2, 2, 0]);
    assert.deepEqual(res5.line, [4, 2, 0, 0]);
    assert.equal(res5.score, 4);

    // 全空行
    const res6 = slideAndMergeLine([0, 0, 0, 0]);
    assert.deepEqual(res6.line, [0, 0, 0, 0]);
    assert.equal(res6.score, 0);
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

    // 向上滑动
    const upBoard = [
      [2, 0, 2, 2],
      [2, 4, 2, 0],
      [0, 4, 0, 2],
      [0, 0, 0, 0],
    ];
    const upRes = moveBoard(upBoard, 'up');
    assert.equal(upRes.moved, true);
    assert.deepEqual(upRes.board, [
      [4, 8, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    assert.equal(upRes.score, 4 + 8 + 4 + 4);

    // 向下滑动
    const downRes = moveBoard(upBoard, 'down');
    assert.equal(downRes.moved, true);
    assert.deepEqual(downRes.board, [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 8, 4, 4],
    ]);
    assert.equal(downRes.score, 4 + 8 + 4 + 4);

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

  test('hasMovesAvailable 可移动检测', () => {
    // 存在空格
    const boardWithEmpty = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 0, 4],
      [4, 2, 4, 2],
    ];
    assert.equal(hasMovesAvailable(boardWithEmpty), true);

    // 无空格但横向相邻相同
    const horizMergeBoard = [
      [2, 2, 4, 8],
      [16, 32, 64, 128],
      [256, 512, 1024, 2],
      [4, 8, 16, 32],
    ];
    assert.equal(hasMovesAvailable(horizMergeBoard), true);

    // 无空格但纵向相邻相同
    const vertMergeBoard = [
      [2, 4, 8, 16],
      [2, 8, 16, 32],
      [4, 16, 32, 64],
      [8, 32, 64, 128],
    ];
    assert.equal(hasMovesAvailable(vertMergeBoard), true);
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

    const nonWinningBoard = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 1024, 0],
      [0, 0, 0, 0],
    ];
    assert.equal(hasWon(nonWinningBoard), false);
    assert.equal(getMaxTile(nonWinningBoard), 1024);

    // 自定义获胜条件
    assert.equal(hasWon(nonWinningBoard, 1024), true);
  });
});
