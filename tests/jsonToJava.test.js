import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateJavaFromJson } from '../src/utils/jsonToJava.js';

describe('jsonToJava 核心转换引擎测试', () => {
  test('空输入或无效 JSON 语法拦截', () => {
    const emptyResult = generateJavaFromJson('');
    assert.equal(emptyResult.javaCode, '');
    assert.equal(emptyResult.error, null);

    const malformedResult = generateJavaFromJson('{ "name": "test", }');
    assert.ok(malformedResult.error?.includes('JSON 语法错误'));
  });

  test('基础单层 JSON 类型推断与 Lombok 注解生成', () => {
    const json = JSON.stringify({
      id: 1001,
      userId: 9876543210123, // 超过 int32 范围，应自动推断为 Long
      score: 98.5,
      active: true,
      nickname: 'CoderLy',
      tags: ['java', 'vite', 'pwa']
    });

    const result = generateJavaFromJson(json, {
      packageName: 'com.example.user',
      rootClassName: 'UserProfileDto',
      useData: true,
      useBuilder: true,
      useBigDecimal: false
    });

    assert.equal(result.error, null);
    assert.ok(result.javaCode.includes('package com.example.user;'));
    assert.ok(result.javaCode.includes('public class UserProfileDto'));
    assert.ok(result.javaCode.includes('@Data'));
    assert.ok(result.javaCode.includes('@Builder'));

    // 类型推断断言
    assert.ok(result.javaCode.includes('private Integer id;'));
    assert.ok(result.javaCode.includes('private Long userId;'));
    assert.ok(result.javaCode.includes('private Double score;'));
    assert.ok(result.javaCode.includes('private Boolean active;'));
    assert.ok(result.javaCode.includes('private String nickname;'));
    assert.ok(result.javaCode.includes('private List<String> tags;'));
  });

  test('浮点数启用 BigDecimal 与 Serializable 选项', () => {
    const json = JSON.stringify({
      price: 199.99
    });

    const result = generateJavaFromJson(json, {
      useBigDecimal: true,
      useSerializable: true
    });

    assert.equal(result.error, null);
    assert.ok(result.javaCode.includes('import java.math.BigDecimal;'));
    assert.ok(result.javaCode.includes('import java.io.Serializable;'));
    assert.ok(result.javaCode.includes('implements Serializable'));
    assert.ok(result.javaCode.includes('private BigDecimal price;'));
  });

  test('下划线命名字段与 Java 保留字避让', () => {
    const json = JSON.stringify({
      user_id: 1,
      default: true,
      class: 'VIP'
    });

    const result = generateJavaFromJson(json, {
      useJsonProperty: true
    });

    assert.equal(result.error, null);
    // user_id -> @JsonProperty("user_id") private Integer userId;
    assert.ok(result.javaCode.includes('@JsonProperty("user_id")'));
    assert.ok(result.javaCode.includes('private Integer userId;'));

    // default -> @JsonProperty("default") private Boolean defaultVal;
    assert.ok(result.javaCode.includes('@JsonProperty("default")'));
    assert.ok(result.javaCode.includes('defaultVal;'));

    // class -> @JsonProperty("class") private String classVal;
    assert.ok(result.javaCode.includes('@JsonProperty("class")'));
    assert.ok(result.javaCode.includes('classVal;'));
  });

  test('多层嵌套对象与对象数组生成静态内部类', () => {
    const json = JSON.stringify({
      orderId: 'ORD-2026-001',
      recipient: {
        receiverName: 'Alice',
        city: 'Shenzhen'
      },
      items: [
        { skuId: 101, skuName: 'Keyboard', price: 89.9 }
      ]
    });

    const result = generateJavaFromJson(json, {
      rootClassName: 'OrderDetailDto'
    });

    assert.equal(result.error, null);
    assert.ok(result.stats.classes >= 3);

    // 根类引用
    assert.ok(result.javaCode.includes('private Recipient recipient;'));
    assert.ok(result.javaCode.includes('private List<ItemsItem> items;'));

    // 内部类生成
    assert.ok(result.javaCode.includes('public static class Recipient'));
    assert.ok(result.javaCode.includes('public static class ItemsItem'));
  });
});
