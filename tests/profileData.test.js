import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  profileHero,
  hardwareDesk,
  softwareStack,
  readingList,
  inspirationNotes,
  labQuotes
} from '../src/data/profileData.js';

describe('profileData 个人与极客空间数据完整性测试', () => {
  test('profileHero 基础元数据必须完整且合规', () => {
    assert.ok(profileHero.name, '必须包含姓名');
    assert.ok(profileHero.handle, '必须包含 handle');
    assert.ok(profileHero.tagline, '必须包含一句话介绍');
    assert.ok(Array.isArray(profileHero.links) && profileHero.links.length >= 2, '至少包含 2 个社交外链');
    profileHero.links.forEach((link) => {
      assert.ok(link.label && link.url.startsWith('http'), '链接必须包含 label 和合法 url');
    });
  });

  test('hardwareDesk 硬件装备必须包含分类与规格描述', () => {
    assert.ok(Array.isArray(hardwareDesk) && hardwareDesk.length >= 4, '硬件列表至少 4 项');
    hardwareDesk.forEach((item) => {
      assert.ok(item.name && item.spec && item.category && item.desc);
    });
  });

  test('softwareStack 软件栈必须包含分类与有效链接', () => {
    assert.ok(Array.isArray(softwareStack) && softwareStack.length >= 4, '软件列表至少 4 项');
    softwareStack.forEach((item) => {
      assert.ok(item.name && item.category && item.url.startsWith('http'));
    });
  });

  test('readingList 书单必须包含阅读状态与 1-5 星评分', () => {
    assert.ok(Array.isArray(readingList) && readingList.length >= 4, '书单至少 4 本');
    const validStatuses = new Set(['在读中', '已读完', '常读常新']);
    readingList.forEach((book) => {
      assert.ok(book.title && book.author);
      assert.ok(validStatuses.has(book.status), `书本状态必须为合法枚举值，当前: ${book.status}`);
      assert.ok(typeof book.rating === 'number' && book.rating >= 1 && book.rating <= 5, '评分必须在 1-5 星');
    });
  });

  test('inspirationNotes 灵感便签必须包含日期、标签与内容', () => {
    assert.ok(Array.isArray(inspirationNotes) && inspirationNotes.length >= 2);
    inspirationNotes.forEach((note) => {
      assert.ok(note.id && note.tag && note.content);
    });
  });

  test('labQuotes 实验室名言必须包含作者与引言', () => {
    assert.ok(Array.isArray(labQuotes) && labQuotes.length >= 5);
    labQuotes.forEach((q) => {
      assert.ok(q.author && q.quote);
    });
  });
});
