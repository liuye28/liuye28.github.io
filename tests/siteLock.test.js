import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PASSWORD_HASH,
  computeSha256,
  isLockEnabled,
  setLockEnabled,
  getCurrentPasswordHash,
  isSiteLocked,
  verifyPassword,
  unlockSite,
  lockSite,
  changePassword,
  resetPasswordToDefault,
  STORAGE_KEYS
} from '../src/utils/siteLock.js';
import { safeRemoveItem } from '../src/utils/storage.js';

describe('siteLock 核心密码与状态机测试', () => {
  beforeEach(() => {
    // 每次测试前清理存储
    safeRemoveItem(STORAGE_KEYS.ENABLED);
    safeRemoveItem(STORAGE_KEYS.CUSTOM_HASH);
    safeRemoveItem(STORAGE_KEYS.UNLOCKED_UNTIL);
    safeRemoveItem(STORAGE_KEYS.SESSION_UNLOCKED);
  });

  test('computeSha256 计算 "520" 的哈希应与预设哈希严格一致', async () => {
    const hash = await computeSha256('520');
    assert.strictEqual(hash, DEFAULT_PASSWORD_HASH);
    assert.strictEqual(hash, '0b35b06a22779418f775a804f36485f7bc978071d1709ad263a68f4f18117b11');
  });

  test('初始状态下锁默认启用，且处于锁定状态', () => {
    assert.strictEqual(isLockEnabled(), true);
    assert.strictEqual(isSiteLocked(), true);
    assert.strictEqual(getCurrentPasswordHash(), DEFAULT_PASSWORD_HASH);
  });

  test('关闭站点锁后，isSiteLocked 应直接返回 false', () => {
    setLockEnabled(false);
    assert.strictEqual(isLockEnabled(), false);
    assert.strictEqual(isSiteLocked(), false);

    // 重新开启锁后恢复锁定状态
    setLockEnabled(true);
    assert.strictEqual(isLockEnabled(), true);
    assert.strictEqual(isSiteLocked(), true);
  });

  test('verifyPassword 对空密码和错误密码应拦截并给出错误提示', async () => {
    const emptyResult = await verifyPassword('');
    assert.strictEqual(emptyResult.success, false);
    assert.ok(emptyResult.error.includes('请输入密码'));

    const wrongResult = await verifyPassword('wrong-pwd');
    assert.strictEqual(wrongResult.success, false);
    assert.ok(wrongResult.error.includes('密码错误'));

    // 此时仍处于锁定状态
    assert.strictEqual(isSiteLocked(), true);
  });

  test('verifyPassword 输入 "520" 应验证通过并成功解锁', async () => {
    const correctResult = await verifyPassword('520');
    assert.strictEqual(correctResult.success, true);
    assert.strictEqual(correctResult.error, undefined);

    // 默认 unlock 之后应解除锁定
    unlockSite({ rememberDays: 7 });
    assert.strictEqual(isSiteLocked(), false);

    // 手动上锁后应恢复锁定
    lockSite();
    assert.strictEqual(isSiteLocked(), true);
  });

  test('unlockSite 传入 rememberDays: 0 应进行会话级解锁', async () => {
    unlockSite({ rememberDays: 0 });
    assert.strictEqual(isSiteLocked(), false);
  });

  test('changePassword 校验原密码并更新为新密码', async () => {
    // 原密码错误应被拒绝
    const failChange = await changePassword('123', 'new-pwd');
    assert.strictEqual(failChange.success, false);
    assert.ok(failChange.error.includes('原密码'));

    // 新密码为空应被拒绝
    const emptyChange = await changePassword('520', '   ');
    assert.strictEqual(emptyChange.success, false);

    // 正确修改密码
    const okChange = await changePassword('520', '666888');
    assert.strictEqual(okChange.success, true);

    // 旧密码不再有效
    const testOld = await verifyPassword('520');
    assert.strictEqual(testOld.success, false);

    // 新密码有效
    const testNew = await verifyPassword('666888');
    assert.strictEqual(testNew.success, true);

    // 重置回默认密码
    resetPasswordToDefault();
    const testReset = await verifyPassword('520');
    assert.strictEqual(testReset.success, true);
  });
});
