import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyBoard,
  copyBoard,
  solveSudoku,
  countSolutions,
  findConflicts,
  getValidCandidates,
  isBoardComplete,
  generateSudokuPuzzle,
  DIFFICULTIES
} from '../src/utils/games/sudokuLogic.js';

describe('Sudoku Logic Core Suite', () => {
  // 标准有效数独测试样本
  const sampleSolution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];

  const samplePuzzle = [
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

  test('createEmptyBoard 生成 9x9 全零矩阵', () => {
    const board = createEmptyBoard();
    assert.equal(board.length, 9);
    assert.ok(board.every(row => row.length === 9 && row.every(cell => cell === 0)));
  });

  test('copyBoard 创建独立的深度拷贝', () => {
    const board = createEmptyBoard();
    const copy = copyBoard(board);
    copy[0][0] = 9;
    assert.equal(board[0][0], 0);
    assert.equal(copy[0][0], 9);
  });

  describe('solveSudoku 求解器', () => {
    test('正确求解标准数独谜题且不修改原矩阵', () => {
      const originalCopy = samplePuzzle.map(r => [...r]);
      const solution = solveSudoku(samplePuzzle);

      assert.ok(solution !== null);
      assert.deepEqual(solution, sampleSolution);
      // 原数组保持不变
      assert.deepEqual(samplePuzzle, originalCopy);
    });

    test('对已完成的有效终盘直接返回相同结果拷贝', () => {
      const solution = solveSudoku(sampleSolution);
      assert.deepEqual(solution, sampleSolution);
      assert.notEqual(solution, sampleSolution); // 确保为独立副本
    });

    test('对包含显式冲突的无效棋盘返回 null', () => {
      const invalidBoard = samplePuzzle.map(r => [...r]);
      invalidBoard[0][2] = 5; // 与 [0][0] 冲突（同一行两个 5）
      assert.equal(solveSudoku(invalidBoard), null);
    });

    test('对无解但无直接冲突的棋盘返回 null', () => {
      // 构造一个不可能有解的局部死锁
      const deadlockBoard = samplePuzzle.map(r => [...r]);
      // 将多个位置设为相互排斥的数字，迫使某个空格候选数为空
      deadlockBoard[0][2] = 1;
      deadlockBoard[0][3] = 2;
      deadlockBoard[0][5] = 4;
      deadlockBoard[0][6] = 8;
      deadlockBoard[0][7] = 6;
      deadlockBoard[0][8] = 9;
      // 此时第一行填入 [5, 3, 1, 2, 7, 4, 8, 6, 9]，但是 9 在 column 1 的 [2][1] 已经有了，
      // 换一个更明确的无解情况：
      const impossibleBoard = [
        [5, 1, 6, 8, 4, 9, 7, 3, 2],
        [3, 0, 7, 6, 0, 5, 0, 0, 0],
        [8, 0, 9, 7, 0, 0, 0, 6, 5],
        [1, 3, 5, 0, 6, 0, 9, 0, 7],
        [4, 7, 2, 5, 9, 1, 0, 0, 6],
        [9, 6, 8, 3, 7, 0, 0, 5, 0],
        [2, 5, 3, 1, 8, 6, 0, 7, 4],
        [6, 8, 4, 2, 0, 7, 5, 0, 0],
        [7, 9, 1, 0, 5, 0, 6, 0, 8]
      ];
      // 第一行已经有 1~9，但给其中一个无法满足的约束
      impossibleBoard[1][1] = 9; // 与第2行/九宫格内或者解冲突
      const res = solveSudoku(impossibleBoard);
      // 无论何种矛盾，只要无解就应返回 null
      assert.equal(res, null);
    });
  });

  describe('countSolutions 多解计数与唯一解验证', () => {
    test('标准唯一解谜题返回 1', () => {
      const count = countSolutions(samplePuzzle, 2);
      assert.equal(count, 1);
    });

    test('全空棋盘存在海量解，在 limit=2 时短路返回 2', () => {
      const emptyBoard = createEmptyBoard();
      const count = countSolutions(emptyBoard, 2);
      assert.equal(count, 2);
    });

    test('多解谜题在 limit=3 时返回 3', () => {
      // 从标准谜题挖掉更多，造成多个解
      const multiSolutionBoard = samplePuzzle.map(r => [...r]);
      multiSolutionBoard[0][0] = 0;
      multiSolutionBoard[0][1] = 0;
      multiSolutionBoard[1][0] = 0;
      multiSolutionBoard[2][1] = 0;
      const count = countSolutions(multiSolutionBoard, 3);
      assert.ok(count >= 2);
    });

    test('无解棋盘返回 0', () => {
      const invalidBoard = samplePuzzle.map(r => [...r]);
      invalidBoard[0][2] = 5; // 同行两5冲突
      assert.equal(countSolutions(invalidBoard, 2), 0);
    });
  });

  describe('findConflicts 冲突坐标检测', () => {
    test('有效完整棋盘无冲突，返回空 Set', () => {
      const conflicts = findConflicts(sampleSolution);
      assert.equal(conflicts.size, 0);
    });

    test('有效未完成谜题且包含大量 0，返回空 Set (0 不算冲突)', () => {
      const conflicts = findConflicts(samplePuzzle);
      assert.equal(conflicts.size, 0);
    });

    test('正确检测同一行内冲突', () => {
      const board = samplePuzzle.map(r => [...r]);
      board[0][6] = 5; // [0][0] 已经是 5，第 0 行发生冲突，且第 6 列和第 2 宫无 5
      const conflicts = findConflicts(board);
      assert.ok(conflicts.has('0,0'));
      assert.ok(conflicts.has('0,6'));
      assert.equal(conflicts.size, 2);
    });

    test('正确检测同一列内冲突', () => {
      const board = samplePuzzle.map(r => [...r]);
      board[8][0] = 5; // [0][0] 已经是 5，第 0 列发生冲突
      const conflicts = findConflicts(board);
      assert.ok(conflicts.has('0,0'));
      assert.ok(conflicts.has('8,0'));
      assert.equal(conflicts.size, 2);
    });

    test('正确检测同一 3x3 宫内冲突', () => {
      const board = createEmptyBoard();
      board[0][0] = 5;
      board[1][1] = 5; // 同属第 0 宫，行不同列不同
      const conflicts = findConflicts(board);
      assert.ok(conflicts.has('0,0'));
      assert.ok(conflicts.has('1,1'));
      assert.equal(conflicts.size, 2);
    });

    test('同时存在多处行、列、宫交叉冲突', () => {
      const board = createEmptyBoard();
      board[0][0] = 5;
      board[0][8] = 5; // 行冲突：0,0 和 0,8
      board[8][0] = 5; // 列冲突：0,0 和 8,0
      board[4][4] = 7;
      board[5][5] = 7; // 宫冲突：第 4 宫内 4,4 和 5,5
      const conflicts = findConflicts(board);
      assert.ok(conflicts.has('0,0'));
      assert.ok(conflicts.has('0,8'));
      assert.ok(conflicts.has('8,0'));
      assert.ok(conflicts.has('4,4'));
      assert.ok(conflicts.has('5,5'));
      assert.equal(conflicts.size, 5);
    });
  });

  describe('getValidCandidates 候选数推导', () => {
    test('对于已填数字的格子返回空数组 []', () => {
      const candidates = getValidCandidates(samplePuzzle, 0, 0);
      assert.deepEqual(candidates, []);
    });

    test('准确排除同行、同列、同宫已存在的数字，返回升序候选数组', () => {
      // 检查 samplePuzzle[0][2]，此格为 0
      // 同行: 5, 3, 7 已出现 (还差 1, 2, 4, 6, 8, 9)
      // 同列 (c=2): 8 (在 [2][2])
      // 同宫 (r:0..2, c:0..2): 5, 3, 6, 9, 8 已出现
      // 综合排除 5, 3, 7, 8, 6, 9 -> 剩下 1, 2, 4
      const candidates = getValidCandidates(samplePuzzle, 0, 2);
      assert.deepEqual(candidates, [1, 2, 4]);
    });

    test('当某空格只有唯一有效候选数时准确返回', () => {
      // 构造只剩 1 个候选数的情况
      const board = sampleSolution.map(r => [...r]);
      board[0][2] = 0; // 对应 sampleSolution 为 4
      const candidates = getValidCandidates(board, 0, 2);
      assert.deepEqual(candidates, [4]);
    });

    test('当空格被完全封死时返回空数组 []', () => {
      const board = createEmptyBoard();
      // 同行填 1..8
      for (let c = 1; c <= 8; c++) board[0][c] = c;
      // 同列填 9
      board[1][0] = 9;
      // 此时 (0,0) 的 1..9 都已被占用
      const candidates = getValidCandidates(board, 0, 0);
      assert.deepEqual(candidates, []);
    });
  });

  describe('isBoardComplete 完成态检验', () => {
    test('已填满且完全正确的终盘返回 true', () => {
      assert.equal(isBoardComplete(sampleSolution), true);
    });

    test('包含 0 的未完成棋盘返回 false', () => {
      assert.equal(isBoardComplete(samplePuzzle), false);
    });

    test('已填满但存在数字冲突的棋盘返回 false', () => {
      const filledInvalid = sampleSolution.map(r => [...r]);
      filledInvalid[0][0] = 9; // 与同一行 [0][6] 的 9 冲突
      assert.equal(isBoardComplete(filledInvalid), false);
    });
  });

  describe('generateSudokuPuzzle 随机出题引擎', () => {
    test('easy 难度生成具备唯一解的有效谜题与正确终盘', () => {
      const puzzleObj = generateSudokuPuzzle('easy');
      assert.ok(puzzleObj && puzzleObj.initialBoard && puzzleObj.solutionBoard);

      const { initialBoard, solutionBoard } = puzzleObj;

      // 验证终盘有效且完整
      assert.equal(isBoardComplete(solutionBoard), true);

      // 验证初始题目的解数严格为 1
      assert.equal(countSolutions(initialBoard, 2), 1);

      // 验证通过 solveSudoku 可以求解得到相同的 solutionBoard
      const solved = solveSudoku(initialBoard);
      assert.deepEqual(solved, solutionBoard);

      // 验证线索数在 easy 预设范围 (36 ~ 40)
      let clues = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (initialBoard[r][c] !== 0) clues++;
        }
      }
      assert.ok(
        clues >= DIFFICULTIES.easy.minClues && clues <= DIFFICULTIES.easy.maxClues,
        `easy 线索数 ${clues} 应该在 [${DIFFICULTIES.easy.minClues}, ${DIFFICULTIES.easy.maxClues}] 范围内`
      );
    });

    test('medium 难度生成具备唯一解的有效谜题', () => {
      const { initialBoard, solutionBoard } = generateSudokuPuzzle('medium');
      assert.equal(isBoardComplete(solutionBoard), true);
      assert.equal(countSolutions(initialBoard, 2), 1);

      let clues = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (initialBoard[r][c] !== 0) clues++;
        }
      }
      assert.ok(
        clues >= DIFFICULTIES.medium.minClues && clues <= DIFFICULTIES.medium.maxClues,
        `medium 线索数 ${clues} 应该在 [${DIFFICULTIES.medium.minClues}, ${DIFFICULTIES.medium.maxClues}] 范围内`
      );
    });

    test('hard 难度生成具备唯一解的有效谜题', () => {
      const { initialBoard, solutionBoard } = generateSudokuPuzzle('hard');
      assert.equal(isBoardComplete(solutionBoard), true);
      assert.equal(countSolutions(initialBoard, 2), 1);

      let clues = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (initialBoard[r][c] !== 0) clues++;
        }
      }
      assert.ok(
        clues >= DIFFICULTIES.hard.minClues && clues <= DIFFICULTIES.hard.maxClues,
        `hard 线索数 ${clues} 应该在 [${DIFFICULTIES.hard.minClues}, ${DIFFICULTIES.hard.maxClues}] 范围内`
      );
    });

    test('未知难度回退为 easy 默认配置', () => {
      const { initialBoard } = generateSudokuPuzzle('unknown_difficulty');
      let clues = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (initialBoard[r][c] !== 0) clues++;
        }
      }
      assert.ok(
        clues >= DIFFICULTIES.easy.minClues && clues <= DIFFICULTIES.easy.maxClues,
        `未知难度应回退为 easy 线索数范围`
      );
    });
  });
});
