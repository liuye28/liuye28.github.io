/**
 * JSON 转 Java POJO / Lombok 实体类核心转换引擎
 */
import { toPascalCase, getSafeJavaFieldName } from './stringUtils.js';

/**
 * 将 JSON 字符串解析并转换为 Java POJO 类代码
 *
 * @param {string} inputJson 输入的 JSON 文本
 * @param {object} [options={}] 代码生成配置项
 * @param {string} [options.packageName='com.example.dto'] 包名
 * @param {string} [options.rootClassName='UserDto'] 根类名
 * @param {boolean} [options.useData=true] 是否启用 @Data
 * @param {boolean} [options.useBuilder=true] 是否启用 @Builder
 * @param {boolean} [options.useNoArgsConstructor=true] 是否启用 @NoArgsConstructor
 * @param {boolean} [options.useAllArgsConstructor=true] 是否启用 @AllArgsConstructor
 * @param {boolean} [options.useJsonProperty=true] 是否生成 @JsonProperty
 * @param {boolean} [options.useBigDecimal=false] 浮点数是否优先使用 BigDecimal
 * @param {boolean} [options.useSerializable=false] 是否实现 Serializable 接口
 * @returns {{ javaCode: string, error: string|null, stats: { classes: number, fields: number, lines: number }|null }}
 */
export function generateJavaFromJson(inputJson, options = {}) {
  const {
    packageName = 'com.example.dto',
    rootClassName = 'UserDto',
    useData = true,
    useBuilder = true,
    useNoArgsConstructor = true,
    useAllArgsConstructor = true,
    useJsonProperty = true,
    useBigDecimal = false,
    useSerializable = false
  } = options;

  if (!inputJson || !inputJson.trim()) {
    return { javaCode: '', error: null, stats: null };
  }

  let parsed;
  try {
    parsed = JSON.parse(inputJson);
  } catch (err) {
    return {
      javaCode: '',
      error: `JSON 语法错误: ${err.message}`,
      stats: null
    };
  }

  // 收集所有需要生成的类：根类 + 嵌套内部类
  const classes = [];
  const imports = new Set();

  if (useSerializable) {
    imports.add('import java.io.Serializable;');
  }
  if (useBigDecimal) {
    imports.add('import java.math.BigDecimal;');
  }
  if (useJsonProperty) {
    imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');
  }
  if (useData) imports.add('import lombok.Data;');
  if (useBuilder) imports.add('import lombok.Builder;');
  if (useNoArgsConstructor) imports.add('import lombok.NoArgsConstructor;');
  if (useAllArgsConstructor) imports.add('import lombok.AllArgsConstructor;');

  let classCount = 0;
  let fieldCount = 0;

  /**
   * 推断值对应的 Java 类型并递归收集嵌套类
   */
  function inferType(val, fieldName) {
    if (val === null || val === undefined) {
      return 'Object';
    }

    if (typeof val === 'string') {
      return 'String';
    }

    if (typeof val === 'boolean') {
      return 'Boolean';
    }

    if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        // 超过 32 位整型范围自动选用 Long
        return val > 2147483647 || val < -2147483648 ? 'Long' : 'Integer';
      }
      return useBigDecimal ? 'BigDecimal' : 'Double';
    }

    if (Array.isArray(val)) {
      imports.add('import java.util.List;');
      if (val.length === 0) {
        return 'List<Object>';
      }

      // 判断数组内元素类型
      const firstElem = val[0];
      if (firstElem !== null && typeof firstElem === 'object' && !Array.isArray(firstElem)) {
        // 合并数组内所有对象的键集合，确保类型完备
        const mergedObj = {};
        for (const item of val) {
          if (item && typeof item === 'object') {
            Object.assign(mergedObj, item);
          }
        }
        const nestedClassName = `${toPascalCase(fieldName)}Item`;
        parseClass(nestedClassName, mergedObj);
        return `List<${nestedClassName}>`;
      } else {
        const elemType = inferType(firstElem, fieldName);
        return `List<${elemType}>`;
      }
    }

    if (typeof val === 'object') {
      const nestedClassName = toPascalCase(fieldName);
      parseClass(nestedClassName, val);
      return nestedClassName;
    }

    return 'Object';
  }

  /**
   * 解析单个类的字段并存入 classes 列表
   */
  function parseClass(className, obj) {
    classCount++;
    const currentClass = {
      className,
      fields: [],
      isRoot: classes.length === 0
    };
    classes.push(currentClass);

    for (const [rawKey, rawVal] of Object.entries(obj || {})) {
      fieldCount++;
      const safeFieldName = getSafeJavaFieldName(rawKey);
      const typeStr = inferType(rawVal, rawKey);

      currentClass.fields.push({
        rawKey,
        safeFieldName,
        typeStr,
        needsJsonProperty: useJsonProperty && (rawKey !== safeFieldName || rawKey.includes('_'))
      });
    }
  }

  // 根节点处理
  const safeRootName = toPascalCase(rootClassName.trim(), 'RootDto');
  if (Array.isArray(parsed)) {
    // 根是数组
    imports.add('import java.util.List;');
    const mergedObj = {};
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        Object.assign(mergedObj, item);
      }
    }
    parseClass(safeRootName, mergedObj);
  } else if (typeof parsed === 'object' && parsed !== null) {
    parseClass(safeRootName, parsed);
  } else {
    return {
      javaCode: '',
      error: 'JSON 根节点必须是对象 (Object) 或数组 (Array)',
      stats: null
    };
  }

  // 组装最终 Java 源码
  const lines = [];

  // 1. package 声明
  if (packageName.trim()) {
    lines.push(`package ${packageName.trim()};`);
    lines.push('');
  }

  // 2. import 列表按字母升序排序
  const sortedImports = Array.from(imports).sort();
  if (sortedImports.length > 0) {
    lines.push(...sortedImports);
    lines.push('');
  }

  // 3. 构建类注解列表
  function getLombokAnnotations(indent = '') {
    const annos = [];
    if (useData) annos.push(`${indent}@Data`);
    if (useBuilder) annos.push(`${indent}@Builder`);
    if (useNoArgsConstructor) annos.push(`${indent}@NoArgsConstructor`);
    if (useAllArgsConstructor) annos.push(`${indent}@AllArgsConstructor`);
    return annos;
  }

  // 4. 根类与内部静态类生成
  const rootClass = classes[0];
  const nestedClasses = classes.slice(1);

  lines.push(...getLombokAnnotations(''));
  const implementsClause = useSerializable ? ' implements Serializable' : '';
  lines.push(`public class ${rootClass.className}${implementsClause} {`);

  if (useSerializable) {
    lines.push('    private static final long serialVersionUID = 1L;');
    lines.push('');
  }

  // 根类字段
  rootClass.fields.forEach((field, idx) => {
    if (field.needsJsonProperty) {
      lines.push(`    @JsonProperty("${field.rawKey}")`);
    }
    lines.push(`    private ${field.typeStr} ${field.safeFieldName};`);
    if (idx < rootClass.fields.length - 1) {
      lines.push('');
    }
  });

  // 内部类生成
  if (nestedClasses.length > 0) {
    lines.push('');
    lines.push('    /* ==================== 嵌套内部类 ==================== */');
    nestedClasses.forEach((nClass) => {
      lines.push('');
      lines.push(...getLombokAnnotations('    '));
      lines.push(`    public static class ${nClass.className}${implementsClause} {`);
      if (useSerializable) {
        lines.push('        private static final long serialVersionUID = 1L;');
        lines.push('');
      }
      nClass.fields.forEach((field, fIdx) => {
        if (field.needsJsonProperty) {
          lines.push(`        @JsonProperty("${field.rawKey}")`);
        }
        lines.push(`        private ${field.typeStr} ${field.safeFieldName};`);
        if (fIdx < nClass.fields.length - 1) {
          lines.push('');
        }
      });
      lines.push('    }');
    });
  }

  lines.push('}');
  lines.push('');

  return {
    javaCode: lines.join('\n'),
    error: null,
    stats: {
      classes: classCount,
      fields: fieldCount,
      lines: lines.length
    }
  };
}
