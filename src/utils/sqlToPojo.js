/**
 * SQL DDL 转 MyBatis-Plus 实体类与代码生成引擎
 */
import { toPascalCase, toCamelCase } from './stringUtils.js';

// 默认剥离的表名前缀正则
const TABLE_PREFIX_REGEX = /^t_|^tbl_|^sys_/;

/**
 * 字段类型映射字典
 * @param {string} rawType SQL 原始类型定义
 * @returns {{ javaType: string, importPkg: string|null }}
 */
export function mapDataType(rawType) {
  const t = (rawType || '').toLowerCase();
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
 * 解析 SQL DDL 并生成对应的 MyBatis-Plus Entity 与 Mapper
 *
 * @param {string} sqlInput SQL DDL 语句
 * @param {object} [options={}] 生成配置项
 * @param {string} [options.packageName='com.example.entity'] 实体类包名
 * @param {boolean} [options.useLombok=true] 是否启用 Lombok 注解
 * @param {boolean} [options.useTableField=true] 是否生成 @TableField 注解
 * @param {boolean} [options.genMapper=true] 是否同时生成 Mapper 接口
 * @returns {{ javaEntity: string, mapperCode: string, error: string|null, rawTableName: string, compositePkCols: string[]|null }}
 */
export function parseSqlToPojo(sqlInput, options = {}) {
  const {
    packageName = 'com.example.entity',
    useLombok = true,
    useTableField = true,
    genMapper = true
  } = options;

  if (!sqlInput || !sqlInput.trim()) {
    return { javaEntity: '', mapperCode: '', error: null, rawTableName: '', compositePkCols: null };
  }

  try {
    // 1. 匹配表名
    const tableMatch = sqlInput.match(/create\s+table\s+[`"]?([a-zA-Z0-9_]+)[`"]?/i);
    if (!tableMatch) {
      return { javaEntity: '', mapperCode: '', error: '未能匹配到有效的 CREATE TABLE 语句', rawTableName: '', compositePkCols: null };
    }
    const tableName = tableMatch[1];
    const className = toPascalCase(tableName, 'Entity', TABLE_PREFIX_REGEX);

    // 2. 匹配表注释
    const tableCommentMatch = sqlInput.match(/comment\s*=\s*['"]([^'"]*)['"]/i);
    const tableComment = tableCommentMatch ? tableCommentMatch[1] : '';

    // 3. 匹配主键定义 (兼容单主键与多主键/组合主键)
    const pkMatch = sqlInput.match(/primary\s+key\s*\(([^)]+)\)/i);
    let primaryKeyCols = [];
    let isCompositePk = false;
    if (pkMatch) {
      primaryKeyCols = pkMatch[1].split(',').map((c) => c.replace(/[`"'\s]/g, '')).filter(Boolean);
      if (primaryKeyCols.length > 1) {
        isCompositePk = true;
      }
    }

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
        const isPk = primaryKeyCols.includes(colName) || (!pkMatch && /primary\s+key/i.test(trimmed));

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
      return { javaEntity: '', mapperCode: '', error: '未识别到任何数据列定义，请检查建表语句', rawTableName: '', compositePkCols: null };
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

    columns.forEach((col) => {
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
      rawTableName: tableName,
      compositePkCols: isCompositePk ? primaryKeyCols : null
    };
  } catch (err) {
    return { javaEntity: '', mapperCode: '', error: err.message, rawTableName: '', compositePkCols: null };
  }
}

/**
 * 格式化 SQL IN 条件子句
 *
 * @param {string} rawText 输入的多行/逗号分隔文本
 * @param {boolean} [isString=false] 是否加单引号
 * @returns {string} 格式化后的 IN (...) 字符串
 */
export function formatSqlInClause(rawText, isString = false) {
  if (!rawText || !rawText.trim()) return '';
  const items = rawText
    .split(/[\n,;，；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) return '';
  if (isString) {
    return `IN (${items.map((it) => `'${it.replace(/'/g, "\\'")}'`).join(', ')})`;
  }
  return `IN (${items.join(', ')})`;
}
