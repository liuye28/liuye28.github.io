import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAllCommands,
  searchCommands,
  getDefaultCommands,
  highlightMatches,
  recordRecentCommand,
  getRecentCommandIds,
  clearRecentCommands
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

    // 搜索 'ip' 应该命中 tool-ip-check
    const ipResults = searchCommands('ip', commands);
    assert.ok(ipResults.length > 0);
    assert.equal(ipResults[0].id, 'tool-ip-check');
  });

  test('searchCommands 搜索 ip 关键词应准确返回 tool-ip-check', () => {
    const commands = buildAllCommands(dummyHelpers);
    const results = searchCommands('ip', commands);
    assert.ok(results.length > 0, '搜索 ip 应有返回结果');
    assert.equal(results[0].id, 'tool-ip-check', '首位匹配项应为 tool-ip-check');
  });

  test('searchCommands 搜索无匹配时应安全返回空数组', () => {
    const commands = buildAllCommands(dummyHelpers);
    const results = searchCommands('xyz_not_exist_query_12345', commands);
    assert.equal(results.length, 0);
  });

  test('highlightMatches 高亮拆分纯函数测试', () => {
    // 1. 空查询词原样返回
    const emptyParts = highlightMatches('Diff Viewer', '');
    assert.deepEqual(emptyParts, [{ text: 'Diff Viewer', isMatch: false }]);

    // 2. 单次命中与大小写保持
    const singleParts = highlightMatches('Diff 对比器', 'diff');
    assert.deepEqual(singleParts, [
      { text: 'Diff', isMatch: true },
      { text: ' 对比器', isMatch: false }
    ]);

    // 3. 多次命中
    const multiParts = highlightMatches('JSON to Java and JSON POJO', 'json');
    assert.deepEqual(multiParts, [
      { text: 'JSON', isMatch: true },
      { text: ' to Java and ', isMatch: false },
      { text: 'JSON', isMatch: true },
      { text: ' POJO', isMatch: false }
    ]);

    // 4. 特殊正则字符安全转义（不会抛错）
    const regexSafe = highlightMatches('Hello (World)', '(');
    assert.deepEqual(regexSafe, [
      { text: 'Hello ', isMatch: false },
      { text: '(', isMatch: true },
      { text: 'World)', isMatch: false }
    ]);
  });

  test('最近使用历史记录 (recordRecentCommand / clearRecentCommands) 测试', () => {
    clearRecentCommands();
    assert.deepEqual(getRecentCommandIds(), []);

    // 记录多条命令
    recordRecentCommand('tool-diff', 3);
    recordRecentCommand('act-theme', 3);
    assert.deepEqual(getRecentCommandIds(), ['act-theme', 'tool-diff']);

    // 重复记录置顶
    recordRecentCommand('tool-diff', 3);
    assert.deepEqual(getRecentCommandIds(), ['tool-diff', 'act-theme']);

    // 超过上限淘汰最老
    recordRecentCommand('tool-cron', 3);
    recordRecentCommand('tool-json', 3);
    assert.deepEqual(getRecentCommandIds(), ['tool-json', 'tool-cron', 'tool-diff']);

    // getDefaultCommands 支持最近使用置顶
    const commands = buildAllCommands(dummyHelpers);
    const defaultsWithRecents = getDefaultCommands(commands, ['tool-json', 'tool-diff']);
    assert.ok(defaultsWithRecents.some((c) => c.category === '最近使用'));
    assert.equal(defaultsWithRecents[0].id, 'recent-tool-json');

    clearRecentCommands();
    assert.deepEqual(getRecentCommandIds(), []);
  });
});

