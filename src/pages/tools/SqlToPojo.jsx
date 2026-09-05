import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { parseSqlToPojo, formatSqlInClause } from '../../utils/sqlToPojo';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';

// 常见 MySQL 样例
const SAMPLES = {
  user: `CREATE TABLE \`sys_user\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键用户ID',
  \`username\` varchar(64) NOT NULL COMMENT '登录用户名',
  \`password_hash\` varchar(128) NOT NULL COMMENT '加密密码',
  \`email\` varchar(128) DEFAULT NULL COMMENT '联系邮箱',
  \`phone\` varchar(20) DEFAULT NULL COMMENT '手机号',
  \`status\` tinyint(1) NOT NULL DEFAULT '1' COMMENT '账号状态: 1正常 0禁用',
  \`balance\` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '账户余额',
  \`remark\` text COMMENT '个性签名与备注',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户基础表';`,

  order: `CREATE TABLE \`t_order\` (
  \`order_id\` bigint(20) NOT NULL COMMENT '分布式订单号',
  \`user_id\` bigint(20) NOT NULL COMMENT '下单用户ID',
  \`order_sn\` varchar(64) NOT NULL COMMENT '外部展示流水号',
  \`total_amount\` decimal(12,2) NOT NULL COMMENT '订单总金额',
  \`pay_status\` tinyint(4) NOT NULL DEFAULT '0' COMMENT '支付状态: 0待支付 1已支付 2已取消',
  \`pay_time\` datetime DEFAULT NULL COMMENT '支付完成时间',
  \`delivery_address\` varchar(255) NOT NULL COMMENT '收件地址',
  \`is_deleted\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除标识',
  PRIMARY KEY (\`order_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电商交易订单主表';`
};

/**
 * SQL DDL 转 MyBatis-Plus 实体类与代码生成器
 */
export default function SqlToPojo() {
  const [sqlInput, setSqlInput] = useState(SAMPLES.user);
  const [packageName, setPackageName] = useState('com.example.entity');
  const [useLombok, setUseLombok] = useState(true);
  const [useTableField, setUseTableField] = useState(true);
  const [genMapper, setGenMapper] = useState(true);
  const [copiedKey, copy] = useCopyToClipboard();

  // SQL IN 格式化小助手状态
  const [inInput, setInInput] = useState('1001\n1002\n1003\n1004');
  const [isStringIn, setIsStringIn] = useState(false);

  // DDL 解析与代码生成计算引擎（抽离至 utils/sqlToPojo.js）
  const { javaEntity, mapperCode, error, rawTableName, compositePkCols } = useMemo(() => {
    return parseSqlToPojo(sqlInput, {
      packageName,
      useLombok,
      useTableField,
      genMapper
    });
  }, [sqlInput, packageName, useLombok, useTableField, genMapper]);

  // SQL IN 格式化计算（抽离至 utils/sqlToPojo.js）
  const formattedInSql = useMemo(() => {
    return formatSqlInClause(inInput, isStringIn);
  }, [inInput, isStringIn]);

  const handleCopy = (text) => {
    if (!text) return;
    copy(text, 'entity');
  };

  const handleCopyIn = () => {
    if (!formattedInSql) return;
    copy(formattedInSql, 'inSql');
  };

  return (
    <ToolLayout
      title="SQL DDL 转 MyBatis-Plus 实体类"
      desc="零后端纯内存解析 MySQL 建表 DDL，快速生成带 Lombok、@TableName、@TableId 的实体类与 Mapper 骨架"
    >
      {/* 顶部配置与预设 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <span>DDL 预设与生成配置</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => setSqlInput(SAMPLES.user)}
            >
              示例：系统用户表
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => setSqlInput(SAMPLES.order)}
            >
              示例：电商订单表
            </button>
          </div>
        </div>

        <div className="tool-grid-2col" style={{ marginBottom: '1rem' }}>
          <div className="tool-form-group">
            <label className="tool-form-label">实体类包名 (Package)</label>
            <input
              type="text"
              className="apple-input"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="例如 com.example.entity"
            />
          </div>
          <div className="tool-form-group">
            <label className="tool-form-label">字段注解与结构修饰</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={useLombok} onChange={(e) => setUseLombok(e.target.checked)} />
                <span>启用 Lombok (@Data, @Builder)</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={useTableField} onChange={(e) => setUseTableField(e.target.checked)} />
                <span>生成 @TableField</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={genMapper} onChange={(e) => setGenMapper(e.target.checked)} />
                <span>生成 BaseMapper 接口</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 双栏工作区 */}
      <div className="tool-grid-2col">
        {/* 左侧：SQL DDL 输入 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>MySQL CREATE TABLE 语句</span>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={() => setSqlInput('')}
            >
              清空
            </button>
          </div>
          <textarea
            className="apple-textarea"
            style={{
              height: '460px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              lineHeight: '1.5'
            }}
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            placeholder="粘贴 CREATE TABLE `table_name` (...) 语句..."
          />
          {error && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.65rem 0.9rem',
              backgroundColor: 'rgba(255, 69, 58, 0.1)',
              border: '1px solid rgba(255, 69, 58, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ff453a',
              fontSize: '0.825rem'
            }}>
              {error}
            </div>
          )}
        </section>

        {/* 右侧：生成结果 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>MyBatis-Plus 实体类代码</span>
            <button
              type="button"
              className={`apple-btn apple-btn-primary apple-btn-sm ${copiedKey === 'entity' ? 'apple-btn-secondary' : ''}`}
              onClick={() => handleCopy(javaEntity + (mapperCode ? '\n\n' + mapperCode : ''))}
              disabled={!javaEntity}
            >
              {copiedKey === 'entity' ? '✓ 已复制全部代码' : '复制 Entity 代码'}
            </button>
          </div>
          {compositePkCols && (
            <div style={{
              marginBottom: '0.75rem',
              padding: '0.65rem 0.9rem',
              backgroundColor: 'rgba(255, 159, 10, 0.1)',
              border: '1px solid rgba(255, 159, 10, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>
                <strong>检测到组合主键：</strong> [{compositePkCols.join(', ')}]。MyBatis-Plus 实体类仅支持单一 <code>@TableId</code>，已保留全部字段，建议根据业务指定单主键或抽象复合主键类。
              </span>
            </div>
          )}
          <textarea
            readOnly
            className="apple-textarea"
            style={{
              height: '460px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
            value={javaEntity || '// 粘贴合法建表 SQL 语句后自动在此生成 Entity 代码'}
          />
        </section>
      </div>

      {/* 附加实用工具：SQL IN 批量转换小插件 */}
      <section className="tool-section" style={{ marginTop: '1.5rem' }}>
        <div className="tool-section-title">
          <span>附带小工具：多行数据转 SQL IN (...) 批量查询子句</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isStringIn} onChange={(e) => setIsStringIn(e.target.checked)} />
              <span>加单引号 (字符串类型)</span>
            </label>
            <button
              type="button"
              className={`apple-btn apple-btn-primary apple-btn-sm ${copiedKey === 'inSql' ? 'apple-btn-secondary' : ''}`}
              onClick={handleCopyIn}
              disabled={!formattedInSql}
            >
              {copiedKey === 'inSql' ? '✓ 已复制 IN 子句' : '复制 IN 子句'}
            </button>
          </div>
        </div>

        <div className="tool-grid-2col">
          <div>
            <textarea
              className="apple-textarea"
              style={{ height: '90px', fontSize: '0.825rem' }}
              value={inInput}
              onChange={(e) => setInInput(e.target.value)}
              placeholder="从 Excel 或日志复制多行 ID 粘贴至此..."
            />
          </div>
          <div>
            <textarea
              readOnly
              className="apple-textarea"
              style={{ height: '90px', fontSize: '0.825rem', backgroundColor: 'var(--bg-surface-secondary)' }}
              value={formattedInSql}
              placeholder="自动转换后在此输出 IN (1, 2, 3)..."
            />
          </div>
        </div>
      </section>
    </ToolLayout>
  );
}
