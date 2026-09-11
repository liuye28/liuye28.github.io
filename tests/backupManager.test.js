import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_MODULES,
  validateBackup,
  formatBytes,
  analyzeStorage,
  exportBackupData,
  importBackup,
  clearModuleData,
  resetFactoryData
} from '../src/utils/backupManager.js';

// Node 测试环境下的 localStorage 简易 Mock
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }
}

import { resetStorageAvailableCache } from '../src/utils/storage.js';

describe('backupManager 核心功能测试', () => {
  beforeEach(() => {
    globalThis.localStorage = new MockLocalStorage();
    resetStorageAvailableCache();
  });

  test('DATA_MODULES 注册表应包含 3 大核心模块', () => {
    assert.equal(DATA_MODULES.length, 3);
    const ids = DATA_MODULES.map((m) => m.id);
    assert.ok(ids.includes('scratchpad'));
    assert.ok(ids.includes('codepad'));
    assert.ok(ids.includes('preferences'));
  });

  test('formatBytes 应能准确格式化字节单位', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1024), '1.0 KB');
    assert.equal(formatBytes(1048576), '1.0 MB');
  });

  test('validateBackup 对合法快照应校验成功并提取元数据', () => {
    const validPayload = JSON.stringify({
      version: '1.0.0',
      appName: "Ly's Workspace",
      exportedAt: new Date().toISOString(),
      meta: { totalModules: 1, totalKeys: 1, totalBytes: 100 },
      data: {
        local_scratchpad_notes: [
          { id: '1', title: '测试便签', content: '内容', updatedAt: 123456 }
        ]
      }
    });

    const result = validateBackup(validPayload);
    assert.equal(result.valid, true);
    assert.equal(result.meta.totalModules, 1);
    assert.ok(result.snapshot.data.local_scratchpad_notes);
  });

  test('validateBackup 对非法 JSON 或缺失结构应安全拦截', () => {
    assert.equal(validateBackup('invalid json').valid, false);
    assert.equal(validateBackup('{}').valid, false);
    assert.equal(validateBackup(JSON.stringify({ version: '2.0.0' })).valid, false);
    assert.equal(validateBackup(JSON.stringify({ version: '1.0.0', data: null })).valid, false);
  });

  test('analyzeStorage 与 exportBackupData 正常读取与导出', () => {
    localStorage.setItem('local_scratchpad_notes', JSON.stringify([
      { id: 'note-1', title: '测试便签', content: '测试内容', updatedAt: 1000 }
    ]));
    localStorage.setItem('codepad_draft_java', 'public class Main {}');
    localStorage.setItem('theme_pref', JSON.stringify({ theme: 'dark', manual: true }));

    const analysis = analyzeStorage();
    assert.equal(analysis.totalKeys, 3);
    assert.ok(analysis.totalBytes > 0);

    const scratchpadModule = analysis.modules.find((m) => m.id === 'scratchpad');
    assert.ok(scratchpadModule);
    assert.equal(scratchpadModule.itemCount, 1);

    const snapshot = exportBackupData();
    assert.equal(snapshot.version, '1.0.0');
    assert.equal(snapshot.appName, "Ly's Workspace");
    assert.ok(snapshot.data.local_scratchpad_notes);
    assert.equal(snapshot.data.codepad_draft_java, 'public class Main {}');
  });

  test('importBackup 覆盖与合并模式测试', () => {
    localStorage.setItem('local_scratchpad_notes', JSON.stringify([
      { id: 'note-1', title: '原标题', content: '原内容', updatedAt: 1000 }
    ]));

    // 1. 合并模式：更新已有项，并追加新项
    const mergeSnapshot = {
      version: '1.0.0',
      appName: "Ly's Workspace",
      exportedAt: new Date().toISOString(),
      meta: { totalModules: 1, totalKeys: 1, totalBytes: 200 },
      data: {
        local_scratchpad_notes: [
          { id: 'note-1', title: '更新后的标题', content: '更新内容', updatedAt: 2000 },
          { id: 'note-2', title: '新便签', content: '新内容', updatedAt: 1500 }
        ]
      }
    };

    const mergeResult = importBackup(mergeSnapshot, 'merge');
    assert.equal(mergeResult.success, true);
    const mergedNotes = JSON.parse(localStorage.getItem('local_scratchpad_notes'));
    assert.equal(mergedNotes.length, 2);
    const note1 = mergedNotes.find((n) => n.id === 'note-1');
    assert.equal(note1.title, '更新后的标题');

    // 2. 覆盖模式
    const overwriteSnapshot = {
      version: '1.0.0',
      appName: "Ly's Workspace",
      exportedAt: new Date().toISOString(),
      meta: { totalModules: 1, totalKeys: 1, totalBytes: 100 },
      data: {
        local_scratchpad_notes: [
          { id: 'note-99', title: '单独唯一便签', content: '内容', updatedAt: 3000 }
        ]
      }
    };

    const overwriteResult = importBackup(overwriteSnapshot, 'overwrite');
    assert.equal(overwriteResult.success, true);
    const overwrittenNotes = JSON.parse(localStorage.getItem('local_scratchpad_notes'));
    assert.equal(overwrittenNotes.length, 1);
    assert.equal(overwrittenNotes[0].id, 'note-99');
  });

  test('clearModuleData 与 resetFactoryData 正常清除指定数据', () => {
    localStorage.setItem('local_scratchpad_notes', '[]');
    localStorage.setItem('codepad_draft_java', 'code');
    localStorage.setItem('theme_pref', '{}');

    clearModuleData('codepad');
    assert.equal(localStorage.getItem('codepad_draft_java'), null);
    assert.notEqual(localStorage.getItem('local_scratchpad_notes'), null);

    resetFactoryData();
    assert.equal(localStorage.getItem('local_scratchpad_notes'), null);
    assert.equal(localStorage.getItem('theme_pref'), null);
  });
});
