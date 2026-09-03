import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
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
 * 驼峰转换工具
 */
function toPascalCase(str) {
  if (!str) return 'Entity';
  return str
    .replace(/^t_|^tbl_|^sys_/, '') // 去除常见表前缀
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .split('_')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Entity';
}

function toCamelCase(str) {
  if (!str) return 'field';
  const pascal = str
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .split('_')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : 'field';
}

/**
 * 字段类型映射字典
 */
function mapDataType(rawType) {
  const t = rawType.toLowerCase();
  if (t.includes('bigint')) return { javaType: 'Long', importPkg: null };
  if (t.includes('tinyint(1)')) return { javaType: 'Boolean', importPkg: null };
  if (t.includes('tinyint') || t.includes('smallint') || t.includes('mediumint') || t.includes('int')) {
    return { javaType: 'Integer', importPkg: null };
  }
  if (t.includes('decimal') || t.includes('numeric')) {
    return { javaType: 'BigDecimal', importPkg: 'import java.math.BigDecimal;' };
  }
  if (t.includes('double')) return { javaType: 'Double', importPkg: null };
  if (t.includes('float')) return { javaType: 'Float', importPkg: null };
  if (t.includes('datetime') || t.includes('timestamp')) {
    return { javaType: 'LocalDateTime', importPkg: 'import java.time.LocalDateTime;' };
  }
  if (t.includes('date')) {
    return { javaType: 'LocalDate', importPkg: 'import java.time.LocalDate;' };
  }
  if (t.includes('time')) {
    return { javaType: 'LocalTime', importPkg: 'import java.time.LocalTime;' };
  }
  return { javaType: 'String', importPkg: null };
}

/**
 * SQL DDL 转 MyBatis-Plus 实体类与代码生成器
 */
export default function SqlToPojo() {
  const [sqlInput, setSqlInput] = useState(SAMPLES.user);
  const [packageName, setPackageName] = useState('com.example.entity');
  const [useLombok, setUseLombok] = useState(true);
  const [useTableField, setUseTableField] = useState(true);
  const [genMapper, setGenMapper] = useState(true);
  const [copied, setCopied] = useState(false);

  // SQL IN 格式化小助手状态
  const [inInput, setInInput] = useState('1001\n1002\n1003\n1004');
  const [isStringIn, setIsStringIn] = useState(false);
  const [inCopied, setInCopied] = useState(false);

  // DDL 解析引擎
  const { javaEntity, mapperCode, error, rawTableName } = useMemo(() => {
    if (!sqlInput.trim()) {
      return { javaEntity: '', mapperCode: '', error: null, rawTableName: '' };
    }

    try {
      // 1. 匹配表名
      const tableMatch = sqlInput.match(/create\s+table\s+[`"]?([a-zA-Z0-9_]+)[`"]?/i);
      if (!tableMatch) {
        return { javaEntity: '', mapperCode: '', error: '未能匹配到有效的 CREATE TABLE 语句', rawTableName: '' };
      }
      const tableName = tableMatch[1];
      const className = toPascalCase(tableName);

      // 2. 匹配表注释
      const tableCommentMatch = sqlInput.match(/comment\s*=\s*['"]([^'"]*)['"]/i);
      const tableComment = tableCommentMatch ? tableCommentMatch[1] : '';

      // 3. 匹配主键定义
      const pkMatch = sqlInput.match(/primary\s+key\s*\([`"]?([a-zA-Z0-9_]+)[`"]?\)/i);
      const primaryKeyCol = pkMatch ? pkMatch[1] : '';

      // 4. 按行匹配列定义
      const lines = sqlInput.split('\n');
      const columns = [];
      const imports = new Set();

      if (useLombok) {
        imports.add('import lombok.Data;');
        imports.add('import lombok.Builder;');
        imports.add('import lombok.NoArgsConstructor;');
        imports.add('import lombok.AllArgsConstructor;');
      }
      imports.add('import com.baomidou.mybatisplus.annotation.TableName;');
      imports.add('import com.baomidou.mybatisplus.annotation.TableId;');
      imports.add('import com.baomidou.mybatisplus.annotation.IdType;');
      if (useTableField) {
        imports.add('import com.baomidou.mybatisplus.annotation.TableField;');
      }
      imports.add('import java.io.Serializable;');

      for (const line of lines) {
        const trimmed = line.trim();
        // 排除非列定义的语句行
        if (
          !trimmed ||
          trimmed.startsWith('CREATE') ||
          trimmed.startsWith(')') ||
          trimmed.startsWith('PRIMARY KEY') ||
          trimmed.startsWith('KEY') ||
          trimmed.startsWith('UNIQUE KEY') ||
          trimmed.startsWith('CONSTRAINT') ||
          trimmed.startsWith('--')
        ) {
          continue;
        }

        // 匹配列名、列类型、注释
        // 例: `username` varchar(64) NOT NULL COMMENT '登录用户名',
        const colMatch = trimmed.match(/^[`"]?([a-zA-Z0-9_]+)[`"]?\s+([a-zA-Z0-9_()]+)/i);
        if (colMatch) {
          const colName = colMatch[1];
          const colType = colMatch[2];
          const isAutoInc = /auto_increment/i.test(trimmed);
          const isPk = colName === primaryKeyCol || /primary\s+key/i.test(trimmed);

          // 匹配列注释
          const commentMatch = trimmed.match(/comment\s+['"]([^'"]*)['"]/i);
          const comment = commentMatch ? commentMatch[1] : '';

          const { javaType, importPkg } = mapDataType(colType);
          if (importPkg) imports.add(importPkg);

          columns.push({
            colName,
            fieldName: toCamelCase(colName),
            javaType,
            comment,
            isPk,
            isAutoInc
          });
        }
      }

      if (columns.length === 0) {
        return { javaEntity: '', mapperCode: '', error: '未识别到任何数据列定义，请检查建表语句', rawTableName: '' };
      }

      // 5. 拼装 Entity 源码
      const codeLines = [];
      if (packageName.trim()) {
        codeLines.push(`package ${packageName.trim()};`);
        codeLines.push('');
      }

      const sortedImports = Array.from(imports).sort();
      codeLines.push(...sortedImports);
      codeLines.push('');

      if (tableComment) {
        codeLines.push('/**');
        codeLines.push(` * ${tableComment}`);
        codeLines.push(' */');
      }
      if (useLombok) {
        codeLines.push('@Data');
        codeLines.push('@Builder');
        codeLines.push('@NoArgsConstructor');
        codeLines.push('@AllArgsConstructor');
      }
      codeLines.push(`@TableName("${tableName}")`);
      codeLines.push(`public class ${className} implements Serializable {`);
      codeLines.push('');
      codeLines.push('    private static final long serialVersionUID = 1L;');

      columns.forEach((col, idx) => {
        codeLines.push('');
        if (col.comment) {
          codeLines.push(`    /**`);
          codeLines.push(`     * ${col.comment}`);
          codeLines.push(`     */`);
        }
        if (col.isPk) {
          const idType = col.isAutoInc ? 'IdType.AUTO' : 'IdType.ASSIGN_ID';
          codeLines.push(`    @TableId(value = "${col.colName}", type = ${idType})`);
        } else if (useTableField) {
          codeLines.push(`    @TableField("${col.colName}")`);
        }
        codeLines.push(`    private ${col.javaType} ${col.fieldName};`);
      });

      codeLines.push('}');
      codeLines.push('');

      // 6. 生成基础 Mapper 接口
      let mapperStr = '';
      if (genMapper) {
        mapperStr = [
          `package ${packageName.replace(/entity$/, 'mapper').trim()};`,
          '',
          `import com.baomidou.mybatisplus.core.mapper.BaseMapper;`,
          `import ${packageName.trim()}.${className};`,
          `import org.apache.ibatis.annotations.Mapper;`,
          '',
          '/**',
          ` * ${tableComment || className} 数据访问层 Mapper`,
          ' */',
          '@Mapper',
          `public interface ${className}Mapper extends BaseMapper<${className}> {`,
          '}'
        ].join('\n');
      }

      return {
        javaEntity: codeLines.join('\n'),
        mapperCode: mapperStr,
        error: null,
        rawTableName: tableName
      };
    } catch (err) {
      return { javaEntity: '', mapperCode: '', error: err.message, rawTableName: '' };
    }
  }, [sqlInput, packageName, useLombok, useTableField, genMapper]);

  // SQL IN 格式化计算
  const formattedInSql = useMemo(() => {
    if (!inInput.trim()) return '';
    const items = inInput
      .split(/[\n,;，；\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (items.length === 0) return '';
    if (isStringIn) {
      return `IN (${items.map(i => `'${i}'`).join(', ')})`;
    } else {
      return `IN (${items.join(', ')})`;
    }
  }, [inInput, isStringIn]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleCopyIn = () => {
    if (!formattedInSql) return;
    navigator.clipboard.writeText(formattedInSql).then(() => {
      setInCopied(true);
      setTimeout(() => setInCopied(false), 1500);
    });
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
              className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
              onClick={() => handleCopy(javaEntity + (mapperCode ? '\n\n' + mapperCode : ''))}
              disabled={!javaEntity}
            >
              {copied ? '✓ 已复制全部代码' : '复制 Entity 代码'}
            </button>
          </div>
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
              className={`apple-btn apple-btn-primary apple-btn-sm ${inCopied ? 'apple-btn-secondary' : ''}`}
              onClick={handleCopyIn}
              disabled={!formattedInSql}
            >
              {inCopied ? '✓ 已复制 IN 子句' : '复制 IN 子句'}
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
