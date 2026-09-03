/**
 * 小工具分类列表 (精选常用小工具分类体系)
 */
export const toolCategories = [
  "全部",
  "跨境电商",
  "开发/调试",
  "编码/转换",
  "安全/计算",
  "生产力/专注"
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
    id: "ozon-calc",
    name: "Ozon 利润与保本定价计算器",
    path: "/tools/ozon-calc",
    desc: "核算国内采购、跨境物流干线、平台扣点与损耗，科学推算建议卢布售价与保本底线",
    category: "跨境电商",
    iconType: "table"
  },
  {
    id: "sql-to-pojo",
    name: "SQL DDL 转 MyBatis-Plus",
    path: "/tools/sql-to-pojo",
    desc: "解析建表 DDL 语句，自动生成带 Lombok、@TableName、@TableId 的实体类与 Mapper",
    category: "开发/调试",
    iconType: "table"
  },
  {
    id: "diff",
    name: "Monaco 代码/文本 Diff 对比器",
    path: "/tools/diff",
    desc: "基于 VS Code Monaco Editor 内核，专业高亮对比两段文本、JSON 或 YAML 的差异变更",
    category: "开发/调试",
    iconType: "code"
  },
  {
    id: "json-to-java",
    name: "JSON 转 Java POJO / Lombok",
    path: "/tools/json-to-java",
    desc: "零后端纯内存解析 JSON，自动生成带 Lombok、Jackson 注解的 Java 实体类与内部类",
    category: "开发/调试",
    iconType: "code"
  },
  {
    id: "cron",
    name: "Cron 表达式生成与预测器",
    path: "/tools/cron",
    desc: "可视化配置与直接解析 Spring/Linux Cron 表达式，带中文自然语言释义与未来 10 次执行时间推算",
    category: "开发/调试",
    iconType: "clock"
  },
  {
    id: "code-pad",
    name: "代码练习板",
    path: "/tools/code-pad",
    desc: "专为手敲练习设计的轻量代码板，支持智能 Tab 缩进、回车继承对齐、双栏对照与防丢暂存",
    category: "开发/调试",
    iconType: "code"
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
    id: "curl",
    name: "cURL 转多语言代码",
    path: "/tools/curl",
    desc: "解析浏览器抓包 cURL 命令，一键转为 Java HttpClient、Spring RestTemplate、OkHttp 或 JS Fetch",
    category: "开发/调试",
    iconType: "codec"
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
    id: "jwt",
    name: "JWT 离线安全解码器",
    path: "/tools/jwt",
    desc: "纯内存 Base64URL 解码 Claims 数据，换算过期时间与相对有效倒计时，绝不上网泄露 Token",
    category: "编码/转换",
    iconType: "shield"
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
  },
  {
    id: "scratchpad",
    name: "Apple Notes 极简便签",
    path: "/tools/scratchpad",
    desc: "纯本地 localStorage 离线存储，随手记临时配置、日志 ID 或灵感，支持 JSON 导入导出备份",
    category: "生产力/专注",
    iconType: "document"
  },
  {
    id: "zen-focus",
    name: "极简白噪音专注番茄钟",
    path: "/tools/zen-focus",
    desc: "经典 25+5 分钟环形番茄钟，基于 Web Audio 原生算法合成雨声与白噪音，0KB 音频开销",
    category: "生产力/专注",
    iconType: "clock"
  }
];
