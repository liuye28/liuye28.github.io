import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage in Node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (k) => mockStorage.get(k) ?? null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
};

import { getRecords, getGameRecord, updateRecord, resetRecords } from '../src/utils/gameStorage.js';

describe('gameStorage test suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('默认返回初始战绩对象结构', () => {
    const records = getRecords();
    assert.equal(records.snake.bestScore, 0);
    assert.equal(records.game2048.bestScore, 0);
    assert.equal(records.minesweeper.bestTimeBeginner, null);
    assert.equal(records.memory.bestTurns, null);
  });

  test('更新贪吃蛇最高分与游玩次数', () => {
    updateRecord('snake', { score: 120 });
    const rec1 = getGameRecord('snake');
    assert.equal(rec1.bestScore, 120);
    assert.equal(rec1.playCount, 1);

    // 更低的分数不应冲掉最高分，但应增加游玩次数
    updateRecord('snake', { score: 80 });
    const rec2 = getGameRecord('snake');
    assert.equal(rec2.bestScore, 120);
    assert.equal(rec2.playCount, 2);
  });

  test('更新扫雷通关最快时间', () => {
    updateRecord('minesweeper', { level: 'beginner', time: 45 });
    assert.equal(getGameRecord('minesweeper').bestTimeBeginner, 45);

    // 更快的耗时覆盖
    updateRecord('minesweeper', { level: 'beginner', time: 30 });
    assert.equal(getGameRecord('minesweeper').bestTimeBeginner, 30);

    // 较慢的耗时不覆盖
    updateRecord('minesweeper', { level: 'beginner', time: 60 });
    assert.equal(getGameRecord('minesweeper').bestTimeBeginner, 30);

    // 中级难度更新
    updateRecord('minesweeper', { level: 'intermediate', time: 99 });
    assert.equal(getGameRecord('minesweeper').bestTimeIntermediate, 99);
  });

  test('更新2048最高分与最大方块', () => {
    updateRecord('game2048', { score: 1024, maxTile: 256 });
    const rec1 = getGameRecord('game2048');
    assert.equal(rec1.bestScore, 1024);
    assert.equal(rec1.maxTile, 256);
    assert.equal(rec1.playCount, 1);

    updateRecord('game2048', { score: 500, maxTile: 512 });
    const rec2 = getGameRecord('game2048');
    assert.equal(rec2.bestScore, 1024);
    assert.equal(rec2.maxTile, 512);
    assert.equal(rec2.playCount, 2);
  });

  test('更新记忆翻牌最少步数与耗时', () => {
    updateRecord('memory', { turns: 16, time: 35 });
    const rec1 = getGameRecord('memory');
    assert.equal(rec1.bestTurns, 16);
    assert.equal(rec1.bestTime, 35);
    assert.equal(rec1.playCount, 1);

    // 步数更少覆盖，耗时更少覆盖
    updateRecord('memory', { turns: 12, time: 40 });
    const rec2 = getGameRecord('memory');
    assert.equal(rec2.bestTurns, 12);
    assert.equal(rec2.bestTime, 35);
    assert.equal(rec2.playCount, 2);
  });

  test('重置战绩数据', () => {
    updateRecord('snake', { score: 500 });
    updateRecord('game2048', { score: 2048, maxTile: 2048 });
    resetRecords();

    const records = getRecords();
    assert.equal(records.snake.bestScore, 0);
    assert.equal(records.snake.playCount, 0);
    assert.equal(records.game2048.bestScore, 0);
    assert.equal(records.game2048.maxTile, 0);
  });
});
