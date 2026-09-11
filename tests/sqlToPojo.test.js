import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mapDataType, parseSqlToPojo } from '../src/utils/sqlToPojo.js';

describe('sqlToPojo DDL 解析与代码生成测试', () => {
  test('mapDataType 字段类型映射完整性', () => {
    assert.equal(mapDataType('BIGINT(20) UNSIGNED').javaType, 'Long');
    assert.equal(mapDataType('TINYINT(1)').javaType, 'Boolean');
    assert.equal(mapDataType('INT(11)').javaType, 'Integer');
    assert.equal(mapDataType('TINYINT(4)').javaType, 'Integer');
    assert.equal(mapDataType('DECIMAL(10,2)').javaType, 'BigDecimal');
    assert.ok(mapDataType('DECIMAL(10,2)').importPkg?.includes('BigDecimal'));
    assert.equal(mapDataType('DATETIME').javaType, 'LocalDateTime');
    assert.ok(mapDataType('DATETIME').importPkg?.includes('LocalDateTime'));
    assert.equal(mapDataType('DATE').javaType, 'LocalDate');
    assert.equal(mapDataType('VARCHAR(255)').javaType, 'String');
  });

  test('parseSqlToPojo 空输入或无效输入处理', () => {
    const emptyResult = parseSqlToPojo('');
    assert.equal(emptyResult.javaEntity, '');
    assert.equal(emptyResult.error, null);

    const invalidResult = parseSqlToPojo('SELECT * FROM user WHERE id = 1;');
    assert.ok(invalidResult.error?.includes('CREATE TABLE'));
  });

  test('parseSqlToPojo 基础 DDL 解析与 MyBatis-Plus 实体/Mapper 生成', () => {
    const sampleDdl = `
CREATE TABLE \`t_order_info\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '订单主键ID',
  \`order_no\` varchar(64) NOT NULL COMMENT '系统订单号',
  \`amount\` decimal(18,4) NOT NULL DEFAULT '0.0000' COMMENT '实付金额',
  \`status\` tinyint(4) NOT NULL DEFAULT '0' COMMENT '订单状态: 0-待支付 1-已完成',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_order_no\` (\`order_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商城订单主表';
    `;

    const result = parseSqlToPojo(sampleDdl, {
      packageName: 'com.shop.order',
      useLombok: true,
      useTableField: true,
      genMapper: true
    });

    assert.equal(result.error, null);
    assert.equal(result.rawTableName, 't_order_info');
    assert.equal(result.compositePkCols, null);

    // 检查剥离前缀后的类名
    assert.ok(result.javaEntity.includes('public class OrderInfo implements Serializable'));
    assert.ok(result.javaEntity.includes('@TableName("t_order_info")'));
    assert.ok(result.javaEntity.includes('@Data'));
    assert.ok(result.javaEntity.includes('@Builder'));

    // 检查字段及注解
    assert.ok(result.javaEntity.includes('@TableId(value = "id", type = IdType.AUTO)'));
    assert.ok(result.javaEntity.includes('private Long id;'));
    assert.ok(result.javaEntity.includes('@TableField("order_no")'));
    assert.ok(result.javaEntity.includes('private String orderNo;'));
    assert.ok(result.javaEntity.includes('private BigDecimal amount;'));
    assert.ok(result.javaEntity.includes('private LocalDateTime createdAt;'));

    // 检查 Mapper 生成
    assert.ok(result.mapperCode.includes('public interface OrderInfoMapper extends BaseMapper<OrderInfo>'));
  });

  test('parseSqlToPojo 复合主键识别', () => {
    const compositeDdl = `
CREATE TABLE \`sys_user_role\` (
  \`user_id\` bigint(20) NOT NULL,
  \`role_id\` bigint(20) NOT NULL,
  \`assigned_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`user_id\`, \`role_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色中间表';
    `;

    const result = parseSqlToPojo(compositeDdl);
    assert.equal(result.error, null);
    assert.ok(Array.isArray(result.compositePkCols));
    assert.deepEqual(result.compositePkCols, ['user_id', 'role_id']);
    assert.ok(result.javaEntity.includes('@TableId(value = "user_id", type = IdType.ASSIGN_ID)'));
    assert.ok(result.javaEntity.includes('@TableId(value = "role_id", type = IdType.ASSIGN_ID)'));
  });

  test('formatSqlInClause 格式化 SQL IN 条件', () => {
    import('../src/utils/sqlToPojo.js').then(({ formatSqlInClause }) => {
      assert.equal(formatSqlInClause('1\n2\n3'), 'IN (1, 2, 3)');
      assert.equal(formatSqlInClause('apple, banana', true), "IN ('apple', 'banana')");
      assert.equal(formatSqlInClause(''), '');
    });
  });

  test('parseSqlToPojo 配置项关闭测试', () => {
    const ddl = `
CREATE TABLE \`item\` (
  \`id\` int(11) NOT NULL,
  \`title\` varchar(100) NOT NULL,
  PRIMARY KEY (\`id\`)
);
    `;

    const result = parseSqlToPojo(ddl, {
      useLombok: false,
      useTableField: false,
      genMapper: false
    });

    assert.equal(result.error, null);
    assert.ok(!result.javaEntity.includes('@Data'));
    assert.ok(!result.javaEntity.includes('@TableField'));
    assert.equal(result.mapperCode, '');
  });
});
