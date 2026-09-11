import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAllCommands,
  searchCommands,
  getDefaultCommands
} from '../src/utils/commandPaletteIndex.js';

describe('commandPaletteIndex 检索与动作引擎测试', () => {
  const dummyHelpers = {
    navigate: () => {},
    toggleTheme: () => {},
    openTerminal: () => {},
    triggerMatrix: () => {},
    exportBackup: () => {},
    closePalette: () => {}
  };

  test('buildAllCommands 应正确聚合四大域数据', () => {
    const commands = buildAllCommands(dummyHelpers);
    assert.ok(commands.length > 25, '命令总数应至少包含工具、动作与速查');

    const categories = new Set(commands.map((c) => c.category));
    assert.ok(categories.has('系统动作'));
    assert.ok(categories.has('实用工具'));
    assert.ok(categories.has('技术速查'));
    assert.ok(categories.has('常用网站'));
  });

  test('getDefaultCommands 空状态应返回高频系统动作与常用工具', () => {
    const commands = buildAllCommands(dummyHelpers);
    const defaults = getDefaultCommands(commands);
    assert.ok(defaults.length >= 6);
    assert.ok(defaults.some((c) => c.id === 'act-theme'));
    assert.ok(defaults.some((c) => c.id === 'act-settings'));
  });

  test('searchCommands 应支持拼音简称与英文加权匹配', () => {
    const commands = buildAllCommands(dummyHelpers);

    // 搜索 'diff' 应该将 Diff 对比器排在首位
    const diffResults = searchCommands('diff', commands);
    assert.ok(diffResults.length > 0);
    assert.equal(diffResults[0].id, 'tool-diff');

    // 搜索 'theme' 应该命中切换深浅外观模式
    const themeResults = searchCommands('theme', commands);
    assert.ok(themeResults.length > 0);
    assert.equal(themeResults[0].id, 'act-theme');

    // 搜索 'jvm' 应该命中 JVM 调优速查
    const jvmResults = searchCommands('jvm', commands);
    assert.ok(jvmResults.length > 0);
    assert.ok(jvmResults[0].title.includes('JVM'));
  });

  test('searchCommands 搜索无匹配时应安全返回空数组', () => {
    const commands = buildAllCommands(dummyHelpers);
    const results = searchCommands('xyz_not_exist_query_12345', commands);
    assert.equal(results.length, 0);
  });
});
