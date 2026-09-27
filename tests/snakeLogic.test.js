import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextHead,
  checkCollision,
  generateFood,
  isOppositeDirection,
} from '../src/utils/games/snakeLogic.js';

describe('Snake Logic Suite', () => {
  test('计算下一跳蛇头坐标', () => {
    assert.deepEqual(getNextHead({ x: 5, y: 5 }, { x: 1, y: 0 }), { x: 6, y: 5 });
    assert.deepEqual(getNextHead({ x: 5, y: 5 }, { x: 0, y: -1 }), { x: 5, y: 4 });
  });

  test('碰撞检测 (出界与自咬)', () => {
    // 撞墙出界 (网格尺寸 20)
    assert.equal(checkCollision({ x: 20, y: 5 }, [{ x: 19, y: 5 }], 20), true);
    assert.equal(checkCollision({ x: -1, y: 5 }, [{ x: 0, y: 5 }], 20), true);

    // 自咬检测
    const body = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }];
    assert.equal(checkCollision({ x: 6, y: 6 }, body, 20), true);
    assert.equal(checkCollision({ x: 4, y: 5 }, body, 20), false);
  });

  test('食物生成绝不在蛇身上', () => {
    const body = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }];
    const food = generateFood(body, 3);
    const onBody = body.some((b) => b.x === food.x && b.y === food.y);
    assert.equal(onBody, false);
  });

  test('反向按键判定', () => {
    assert.equal(isOppositeDirection({ x: 1, y: 0 }, { x: -1, y: 0 }), true);
    assert.equal(isOppositeDirection({ x: 0, y: 1 }, { x: 0, y: -1 }), true);
    assert.equal(isOppositeDirection({ x: 1, y: 0 }, { x: 0, y: 1 }), false);
  });
});
