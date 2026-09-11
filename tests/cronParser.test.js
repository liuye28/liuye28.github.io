import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESETS,
  WEEK_MAP,
  WEEK_LIST,
  pad,
  formatDateTime,
  getRelativeTime,
  parseField,
  calculateNextRuns,
  translateCronToChinese
} from '../src/utils/cronParser.js';

describe('cronParser 核心算法与格式化测试', () => {
  test('PRESETS 与 WEEK 元数据完整性', () => {
    assert.ok(Array.isArray(PRESETS) && PRESETS.length >= 8);
    assert.equal(WEEK_MAP['MON'], '周一');
    assert.equal(WEEK_MAP['1'], '周日');
    assert.equal(WEEK_LIST.length, 7);
  });

  test('pad 补零函数测试', () => {
    assert.equal(pad(5), '05');
    assert.equal(pad(12), '12');
    assert.equal(pad(0), '00');
  });

  test('formatDateTime 与 getRelativeTime 时间计算', () => {
    const fixedDate = new Date(2026, 8, 11, 14, 30, 0); // 2026-09-11 14:30:00 (周五)
    const formatted = formatDateTime(fixedDate);
    assert.ok(formatted.includes('2026-09-11 14:30:00'));
    assert.ok(formatted.includes('周五'));

    const now = new Date(2026, 8, 11, 14, 30, 0);
    const past = new Date(2026, 8, 11, 14, 29, 0);
    assert.equal(getRelativeTime(past, now), '已过期');

    const future10s = new Date(2026, 8, 11, 14, 30, 10);
    assert.equal(getRelativeTime(future10s, now), '10 秒后');

    const future5m = new Date(2026, 8, 11, 14, 35, 15);
    assert.equal(getRelativeTime(future5m, now), '5 分钟后 (15秒)');

    const future2h = new Date(2026, 8, 11, 16, 45, 0);
    assert.equal(getRelativeTime(future2h, now), '2 小时 15 分钟后');

    const future2d = new Date(2026, 8, 13, 14, 30, 0);
    assert.equal(getRelativeTime(future2d, now), '2 天后');
  });

  test('parseField 基础通配符与离散值', () => {
    // 通配符 * 或 ?
    const wildSec = parseField('*', 0, 59);
    assert.equal(wildSec.size, 60);
    assert.ok(wildSec.has(0) && wildSec.has(59));

    // 离散逗号
    const commaField = parseField('1,5,10', 0, 59);
    assert.equal(commaField.size, 3);
    assert.deepEqual(Array.from(commaField).sort((a, b) => a - b), [1, 5, 10]);

    // 范围 -
    const rangeField = parseField('1-5', 0, 59);
    assert.equal(rangeField.size, 5);
    assert.deepEqual(Array.from(rangeField).sort((a, b) => a - b), [1, 2, 3, 4, 5]);

    // 步长 */15
    const stepField = parseField('*/15', 0, 59);
    assert.deepEqual(Array.from(stepField).sort((a, b) => a - b), [0, 15, 30, 45]);

    // 步长 5/20
    const offsetStep = parseField('5/20', 0, 59);
    assert.deepEqual(Array.from(offsetStep).sort((a, b) => a - b), [5, 25, 45]);
  });

  test('parseField 星期别名支持', () => {
    const weekField = parseField('MON,FRI', 1, 7, true);
    assert.equal(weekField.size, 2);
    // MON -> 2, FRI -> 6
    assert.ok(weekField.has(2));
    assert.ok(weekField.has(6));
  });

  test('calculateNextRuns 推算 Linux 5 段式 Cron', () => {
    // 每小时 15 分执行：15 * * * *
    const runs = calculateNextRuns('15 * * * *', 5);
    assert.equal(runs.length, 5);
    for (const d of runs) {
      assert.equal(d.getMinutes(), 15);
      assert.equal(d.getSeconds(), 0);
    }
  });

  test('calculateNextRuns 推算 Spring 6 段式 Cron', () => {
    // 每 5 分钟执行：0 0/5 * * * ?
    const runs = calculateNextRuns('0 0/5 * * * ?', 5);
    assert.equal(runs.length, 5);
    for (const d of runs) {
      assert.equal(d.getSeconds(), 0);
      assert.equal(d.getMinutes() % 5, 0);
    }
  });

  test('calculateNextRuns 异常格式输入应抛出清晰错误', () => {
    assert.throws(() => {
      calculateNextRuns('invalid cron', 5);
    }, /Cron 表达式格式不完整/);
  });

  test('translateCronToChinese 翻译常用表达式为自然语言', () => {
    assert.equal(
      translateCronToChinese('0 0/5 * * * ?'),
      '每天 每隔 5 分钟 触发'
    );
    assert.equal(
      translateCronToChinese('*/5 * * * * ?'),
      '每天 每隔 5 秒 触发'
    );
    assert.equal(
      translateCronToChinese('0 0 2 * * ?'),
      '每天 在 02点00分00秒 触发'
    );
    assert.equal(
      translateCronToChinese('0 0 9 ? * MON-FRI'),
      '每周 周一至周五 在 09点00分00秒 触发'
    );
    assert.equal(translateCronToChinese('invalid'), '表达式格式不完整');
  });
});
