import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_SIZE,
  EMPTY,
  BLACK,
  WHITE,
  createEmptyBoard,
  checkGomokuWin,
  getCandidateMoves,
  evaluateBoard,
  getBestMove,
  undoLastMove,
  PATTERN_SCORES
} from '../src/utils/games/gomokuLogic.js';

describe('Gomoku Logic Core Suite', () => {
  describe('Constants & Board Initialization', () => {
    test('棋盘常量与默认状态正确', () => {
      assert.equal(BOARD_SIZE, 15, '棋盘尺寸应为 15x15');
      assert.equal(EMPTY, 0, '空白格为 0');
      assert.equal(BLACK, 1, '黑棋为 1');
      assert.equal(WHITE, 2, '白棋为 2');

      const board = createEmptyBoard();
      assert.equal(board.length, 15);
      assert.equal(board[0].length, 15);
      assert.ok(board.every(row => row.every(cell => cell === 0)), '所有格子初始应为 0');
    });

    test('棋型分数常量定义完备', () => {
      assert.ok(PATTERN_SCORES, 'PATTERN_SCORES 应当存在');
      assert.equal(PATTERN_SCORES.FIVE, 100000, '连五分数为 100000');
      assert.equal(PATTERN_SCORES.OPEN_FOUR, 10000, '活四分数为 10000');
      assert.equal(PATTERN_SCORES.RUSH_FOUR, 1000, '冲四分数为 1000');
      assert.equal(PATTERN_SCORES.OPEN_THREE, 1000, '活三分数为 1000');
      assert.equal(PATTERN_SCORES.SLEEP_THREE, 100, '眠三分数为 100');
      assert.equal(PATTERN_SCORES.OPEN_TWO, 100, '活二分数为 100');
    });
  });

  describe('Win Condition Detection (checkGomokuWin)', () => {
    test('空棋盘或无效坐标不判定胜利', () => {
      const board = createEmptyBoard();
      const res = checkGomokuWin(board, 7, 7);
      assert.equal(res.win, false);
      assert.equal(res.winner, EMPTY);
      assert.deepEqual(res.winningLine, []);

      const invalidRes = checkGomokuWin(board, -1, 20);
      assert.equal(invalidRes.win, false);
    });

    test('水平方向达成五连珠判定胜利', () => {
      const board = createEmptyBoard();
      // 黑棋在第 7 行 3..7 列连成 5 子
      for (let c = 3; c <= 7; c++) {
        board[7][c] = BLACK;
      }
      const res = checkGomokuWin(board, 7, 7);
      assert.equal(res.win, true);
      assert.equal(res.winner, BLACK);
      assert.equal(res.winningLine.length, 5);
      const expectedLine = [[7, 3], [7, 4], [7, 5], [7, 6], [7, 7]];
      assert.deepEqual(res.winningLine, expectedLine);
    });

    test('垂直方向达成五连珠判定胜利', () => {
      const board = createEmptyBoard();
      // 白棋在第 4 列 2..6 行连成 5 子
      for (let r = 2; r <= 6; r++) {
        board[r][4] = WHITE;
      }
      const res = checkGomokuWin(board, 4, 4); // 从中间落子检验
      assert.equal(res.win, true);
      assert.equal(res.winner, WHITE);
      assert.equal(res.winningLine.length, 5);
      const expectedLine = [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4]];
      assert.deepEqual(res.winningLine, expectedLine);
    });

    test('主对角线方向 (\\) 达成五连珠判定胜利', () => {
      const board = createEmptyBoard();
      for (let i = 0; i < 5; i++) {
        board[3 + i][3 + i] = BLACK;
      }
      const res = checkGomokuWin(board, 7, 7);
      assert.equal(res.win, true);
      assert.equal(res.winner, BLACK);
      assert.equal(res.winningLine.length, 5);
      assert.deepEqual(res.winningLine, [[3, 3], [4, 4], [5, 5], [6, 6], [7, 7]]);
    });

    test('副对角线方向 (/) 达成五连珠判定胜利', () => {
      const board = createEmptyBoard();
      // (7,3), (6,4), (5,5), (4,6), (3,7)
      const coords = [[7, 3], [6, 4], [5, 5], [4, 6], [3, 7]];
      coords.forEach(([r, c]) => { board[r][c] = WHITE; });
      const res = checkGomokuWin(board, 3, 7);
      assert.equal(res.win, true);
      assert.equal(res.winner, WHITE);
      assert.equal(res.winningLine.length, 5);
    });

    test('仅 4 连珠或中间被阻断不判定胜利', () => {
      const board = createEmptyBoard();
      board[7][3] = BLACK;
      board[7][4] = BLACK;
      board[7][5] = WHITE; // 阻断
      board[7][6] = BLACK;
      board[7][7] = BLACK;
      const res = checkGomokuWin(board, 7, 7);
      assert.equal(res.win, false);
      assert.equal(res.winner, EMPTY);

      // 仅 4 子
      const board4 = createEmptyBoard();
      for (let c = 3; c <= 6; c++) {
        board4[7][c] = BLACK;
      }
      const res4 = checkGomokuWin(board4, 7, 6);
      assert.equal(res4.win, false);
    });

    test('长连 6 子判定胜利并返回完整连线', () => {
      const board = createEmptyBoard();
      for (let c = 2; c <= 7; c++) {
        board[5][c] = BLACK;
      }
      const res = checkGomokuWin(board, 5, 4);
      assert.equal(res.win, true);
      assert.equal(res.winner, BLACK);
      assert.ok(res.winningLine.length >= 5);
    });
  });

  describe('Candidate Moves Pruning (getCandidateMoves)', () => {
    test('空棋盘返回正中心 [7, 7]', () => {
      const board = createEmptyBoard();
      const candidates = getCandidateMoves(board);
      assert.deepEqual(candidates, [[7, 7]]);
    });

    test('棋盘有落子时，仅搜集已有棋子周边 1~2 格范围内的空格并限制数量', () => {
      const board = createEmptyBoard();
      board[7][7] = BLACK;
      const candidates = getCandidateMoves(board);

      assert.ok(candidates.length > 0, '候选点不应为空');
      assert.ok(candidates.length <= 25, '候选点应当被剪枝在 25 个以内');
      // 不应包含已落子的位置 (7, 7)
      assert.ok(!candidates.some(([r, c]) => r === 7 && c === 7));
      // 所有候选点与 (7, 7) 的距离应在 2 格以内
      candidates.forEach(([r, c]) => {
        const dist = Math.max(Math.abs(r - 7), Math.abs(c - 7));
        assert.ok(dist <= 2, `候选点 (${r}, ${c}) 距离应 <= 2`);
        assert.equal(board[r][c], EMPTY, '候选点必须是空格');
      });

      // 紧邻 1 格的点优先级应高于 2 格的点
      const firstCandidate = candidates[0];
      const firstDist = Math.max(Math.abs(firstCandidate[0] - 7), Math.abs(firstCandidate[1] - 7));
      assert.equal(firstDist, 1, '最近的 1 格邻居应排在前面');
    });

    test('多个分散棋子时候选点不重复且不超出棋盘范围', () => {
      const board = createEmptyBoard();
      board[0][0] = BLACK;
      board[14][14] = WHITE;
      const candidates = getCandidateMoves(board);

      const keys = new Set(candidates.map(([r, c]) => `${r},${c}`));
      assert.equal(keys.size, candidates.length, '候选点不应有重复');

      candidates.forEach(([r, c]) => {
        assert.ok(r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE, '坐标应在棋盘合法范围内');
        assert.equal(board[r][c], EMPTY, '不能是已占用的格子');
      });
    });
  });

  describe('Board Pattern Evaluation (evaluateBoard)', () => {
    test('对称空棋盘评估为 0', () => {
      const board = createEmptyBoard();
      const score = evaluateBoard(board, BLACK);
      assert.equal(score, 0);
    });

    test('AI 拥有活四时评估分显著为正，远高于活三', () => {
      const board4 = createEmptyBoard();
      // AI(WHITE) 活四: . W W W W .
      board4[7][3] = WHITE;
      board4[7][4] = WHITE;
      board4[7][5] = WHITE;
      board4[7][6] = WHITE;

      const board3 = createEmptyBoard();
      // AI(WHITE) 活三: . W W W .
      board3[7][3] = WHITE;
      board3[7][4] = WHITE;
      board3[7][5] = WHITE;

      const score4 = evaluateBoard(board4, WHITE);
      const score3 = evaluateBoard(board3, WHITE);

      assert.ok(score4 >= PATTERN_SCORES.OPEN_FOUR, '活四得分应 >= 10000');
      assert.ok(score4 > score3 * 5, '活四得分应远高于活三');
    });

    test('对手拥有威胁棋型时产生防御负分', () => {
      const board = createEmptyBoard();
      // 对手(BLACK) 拥有活四
      board[7][3] = BLACK;
      board[7][4] = BLACK;
      board[7][5] = BLACK;
      board[7][6] = BLACK;

      const score = evaluateBoard(board, WHITE);
      assert.ok(score < -5000, '对手活四应导致 AI 评估大幅为负');
    });
  });

  describe('Minimax AI Decision Engine (getBestMove)', () => {
    test('开局空盘直接返回天元 [7, 7]', () => {
      const board = createEmptyBoard();
      const move = getBestMove(board, BLACK, 'beginner');
      assert.deepEqual(move, [7, 7]);
    });

    test('斩杀逻辑：AI 自身能连成五子时必须立即斩杀', () => {
      const board = createEmptyBoard();
      // AI 为 WHITE，在行 5 有 4 颗连子: (5, 3), (5, 4), (5, 5), (5, 6)
      board[5][3] = WHITE;
      board[5][4] = WHITE;
      board[5][5] = WHITE;
      board[5][6] = WHITE;

      // 无论 beginner / intermediate / master，都必须直接落子 (5, 2) 或 (5, 7)
      const move = getBestMove(board, WHITE, 'beginner');
      const isKillMove = (move[0] === 5 && move[1] === 2) || (move[0] === 5 && move[1] === 7);
      assert.ok(isKillMove, `应当选择斩杀点 (5,2) 或 (5,7)，实际选择: ${move}`);
    });

    test('防守逻辑：对手下一步能连成五子时必须立即阻断', () => {
      const board = createEmptyBoard();
      // 玩家为 BLACK，在对角线上有 4 颗子: (2,2), (3,3), (4,4), (5,5)
      board[2][2] = BLACK;
      board[3][3] = BLACK;
      board[4][4] = BLACK;
      board[5][5] = BLACK;

      // AI 为 WHITE，必须阻断 (1,1) 或 (6,6)
      const move = getBestMove(board, WHITE, 'intermediate');
      const isBlockMove = (move[0] === 1 && move[1] === 1) || (move[0] === 6 && move[1] === 6);
      assert.ok(isBlockMove, `AI 应当立即阻断对手绝杀点，实际选择: ${move}`);
    });

    test('防守对手活三：防止对手形成活四', () => {
      const board = createEmptyBoard();
      // 玩家(BLACK) 活三: (7, 5), (7, 6), (7, 7) 两端为空 (7, 4) 与 (7, 8)
      board[7][5] = BLACK;
      board[7][6] = BLACK;
      board[7][7] = BLACK;

      const move = getBestMove(board, WHITE, 'master');
      // 优秀的防守点应在 (7, 4) 或 (7, 8)
      const isBlockThree = (move[0] === 7 && move[1] === 4) || (move[0] === 7 && move[1] === 8);
      assert.ok(isBlockThree, `AI 应当阻断对手活三端点，实际选择: ${move}`);
    });

    test('master 难度深度搜索耗时性能要求 (< 150ms)', () => {
      const board = createEmptyBoard();
      board[7][7] = BLACK;
      board[7][8] = WHITE;
      board[8][7] = BLACK;
      board[6][8] = WHITE;
      board[8][8] = BLACK;

      const start = Date.now();
      const move = getBestMove(board, WHITE, 'master');
      const elapsed = Date.now() - start;

      assert.ok(Array.isArray(move) && move.length === 2, '应返回有效坐标');
      assert.equal(board[move[0]][move[1]], EMPTY, '落子位置必须为空');
      assert.ok(elapsed < 150, `Master 难度运算耗时 ${elapsed}ms 应 < 150ms`);
    });
  });

  describe('Undo Support (undoLastMove)', () => {
    test('空历史悔棋返回空盘与空历史', () => {
      const res = undoLastMove([]);
      assert.deepEqual(res.newHistory, []);
      assert.ok(res.newBoard.every(row => row.every(cell => cell === 0)));
    });

    test('仅 1 步历史时悔棋回滚到初始空盘', () => {
      const history = [{ row: 7, col: 7, color: BLACK }];
      const res = undoLastMove(history);
      assert.deepEqual(res.newHistory, []);
      assert.equal(res.newBoard[7][7], EMPTY);
    });

    test('双步历史（玩家+AI 各一手）悔棋同时回滚 2 步', () => {
      const history = [
        { row: 7, col: 7, color: BLACK },
        { row: 7, col: 8, color: WHITE }
      ];
      const res = undoLastMove(history);
      assert.deepEqual(res.newHistory, []);
      assert.equal(res.newBoard[7][7], EMPTY);
      assert.equal(res.newBoard[7][8], EMPTY);
    });

    test('多步历史（例如 4 步）悔棋回退后剩余 2 步且棋盘正确重建', () => {
      const history = [
        { row: 7, col: 7, color: BLACK },
        { row: 7, col: 8, color: WHITE },
        { row: 8, col: 8, color: BLACK },
        { row: 6, col: 6, color: WHITE }
      ];
      const res = undoLastMove(history);
      assert.equal(res.newHistory.length, 2);
      assert.deepEqual(res.newHistory, [
        { row: 7, col: 7, color: BLACK },
        { row: 7, col: 8, color: WHITE }
      ]);
      assert.equal(res.newBoard[7][7], BLACK);
      assert.equal(res.newBoard[7][8], WHITE);
      assert.equal(res.newBoard[8][8], EMPTY);
      assert.equal(res.newBoard[6][6], EMPTY);
    });
  });
});
