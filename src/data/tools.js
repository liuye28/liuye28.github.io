/**
 * 小工具分类列表 (精选常用小工具分类体系)
 */
export const toolCategories = [
  "全部",
  "跨境电商",
  "编码/转换",
  "开发/调试",
  "安全/计算"
];

/**
 * 常用小工具列表数据 (包含 Ozon 跨境电商刊登工具与开发者实用工具)
 */
export const tools = [
  {
    id: "ozon-rich",
    name: "Ozon 富内容生成器",
    path: "/tools/ozon-rich",
    desc: "粘贴翻译好的俄文卖点文案，自动生成 Ozon 富内容 JSON，无需手动拼积木",
    category: "跨境电商",
    iconType: "document"
  },
  {
    id: "ozon-size",
    name: "Ozon 尺码表生成器",
    path: "/tools/ozon-size",
    desc: "粘贴翻译好的俄文尺码表，自动生成 Ozon 尺码表 JSON，支持 Excel 粘贴",
    category: "跨境电商",
    iconType: "table"
  },
  {
    id: "json",
    name: "JSON 格式化 / 校验器",
    path: "/tools/json",
    desc: "JSON 语法实时校验、高亮缩进格式化、紧凑压缩与一键复制",
    category: "编码/转换",
    iconType: "code"
  },
  {
    id: "codec",
    name: "URL / Base64 编解码器",
    path: "/tools/codec",
    desc: "URL 编码/解码与 Base64 双向转换，完美支持中文 UTF-8 无乱码",
    category: "编码/转换",
    iconType: "codec"
  },
  {
    id: "timestamp",
    name: "时间戳转换器",
    path: "/tools/timestamp",
    desc: "Unix 时间戳与本地/UTC 日期时间双向转换，支持毫秒与秒自动识别",
    category: "开发/调试",
    iconType: "clock"
  },
  {
    id: "regex",
    name: "正则表达式测试器",
    path: "/tools/regex",
    desc: "实时高亮匹配结果、Flags 修饰符选择与匹配项详细索引列表",
    category: "开发/调试",
    iconType: "regex"
  },
  {
    id: "base-convert",
    name: "进制转换器",
    path: "/tools/base-convert",
    desc: "二进制、八进制、十进制、十六进制实时同步互转与非法字符检测",
    category: "安全/计算",
    iconType: "hash"
  },
  {
    id: "hash",
    name: "哈希与 UUID 生成器",
    path: "/tools/hash",
    desc: "SHA-256、SHA-512、SHA-1 在线哈希计算与标准 UUID v4 批量生成",
    category: "安全/计算",
    iconType: "shield"
  }
];
