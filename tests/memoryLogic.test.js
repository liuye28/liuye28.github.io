import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateCards, checkMatch, isAllMatched } from '../src/utils/games/memoryLogic.js';

describe('Memory Logic Suite', () => {
  test('生成对应对数的卡片数组并随机洗牌', () => {
    const cards = generateCards(8);
    assert.equal(cards.length, 16);
    // 验证每种 symbol 刚好成双成对
    const counts = {};
    for (const c of cards) {
      counts[c.symbol] = (counts[c.symbol] || 0) + 1;
    }
    for (const sym of Object.keys(counts)) {
      assert.equal(counts[sym], 2);
    }
  });

  test('卡片配对与终局检测', () => {
    assert.equal(checkMatch({ symbol: '🚀' }, { symbol: '🚀' }), true);
    assert.equal(checkMatch({ symbol: '🚀' }, { symbol: '💻' }), false);

    const cards = [
      { id: 1, isMatched: true },
      { id: 2, isMatched: true },
    ];
    assert.equal(isAllMatched(cards), true);

    cards.push({ id: 3, isMatched: false });
    assert.equal(isAllMatched(cards), false);
  });
});
