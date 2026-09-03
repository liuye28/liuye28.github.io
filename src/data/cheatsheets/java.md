# Java 核心特性与高频代码速查

涵盖 Java 8 至 Java 21 高频常用 API、Stream 核心流式操作、Optional 防空指南及并发工具。

---

## 1. Stream 流式操作高频套路

### List 提取属性集合
```java
// 提取用户 ID 列表并去重
List<Long> userIds = userList.stream()
    .map(User::getId)
    .filter(Objects::nonNull)
    .distinct()
    .toList(); // Java 16+ 直接 toList()，之前用 Collectors.toList()
```

### List 转 Map (按唯一键或分类分组)
```java
// 1. List 转 Map<Id, User> (防 Duplicate Key 崩溃)
Map<Long, User> userMap = userList.stream()
    .collect(Collectors.toMap(
        User::getId,
        Function.identity(),
        (oldVal, newVal) -> newVal // 遇到主键重复时保留最新值
    ));

// 2. 按部门分组 Map<DepartmentId, List<User>>
Map<Long, List<User>> deptUsersMap = userList.stream()
    .collect(Collectors.groupingBy(User::getDepartmentId));

// 3. 分组计数 Map<DepartmentId, Long>
Map<Long, Long> deptCountMap = userList.stream()
    .collect(Collectors.groupingBy(User::getDepartmentId, Collectors.counting()));
```

### 聚合统计 (求和、最大/最小、平均值)
```java
// 统计订单总金额
BigDecimal totalAmount = orderList.stream()
    .map(Order::getAmount)
    .filter(Objects::nonNull)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// 数值流统计
IntSummaryStatistics stats = list.stream()
    .mapToInt(User::getAge)
    .summaryStatistics();
System.out.println("平均年龄: " + stats.getAverage() + " 最大: " + stats.getMax());
```

---

## 2. Optional 优雅防御空指针

```java
// ❌ 错误做法：依然当 if-else 用
if (opt.isPresent()) { return opt.get().getName(); }

//  推荐做法：链式展开并提供安全兜底
String cityName = Optional.ofNullable(user)
    .map(User::getAddress)
    .map(Address::getCity)
    .filter(StringUtils::isNotBlank)
    .orElse("未知城市");

// 不存在时抛出定制业务异常
User targetUser = Optional.ofNullable(user)
    .orElseThrow(() -> new BusinessException("用户不存在"));
```

---

## 3. 并发编程与 CompletableFuture 异步编排

```java
// 多任务并行编排并合并结果
CompletableFuture<UserInfo> userFuture = CompletableFuture.supplyAsync(
    () -> userService.getUser(userId), taskExecutor);

CompletableFuture<OrderInfo> orderFuture = CompletableFuture.supplyAsync(
    () -> orderService.getLatestOrder(userId), taskExecutor);

// 等待所有异步任务完成
CompletableFuture.allOf(userFuture, orderFuture).join();

// 获取结果 (带超时防阻塞)
UserInfo user = userFuture.get(2, TimeUnit.SECONDS);
OrderInfo order = orderFuture.get(2, TimeUnit.SECONDS);
```

---

## 4. Java 17 / 21 现代语法糖

### Text Blocks 文本块 (多行字符串)
```java
String queryJson = """
    {
      "name": "developer",
      "status": "active"
    }
    """;
```

### Record 极简不可变数据载体
```java
// 自动生成 final 字段、全参构造器、getter、equals、hashCode 与 toString
public record UserSummaryDto(Long id, String name, String email) {}
```

### Pattern Matching for switch (模式匹配)
```java
static String formatValue(Object obj) {
    return switch (obj) {
        case Integer i -> String.format("整型: %d", i);
        case Long l    -> String.format("长整型: %d", l);
        case String s  -> String.format("字符串: %s (长度 %d)", s, s.length());
        case null      -> "空对象";
        default        -> obj.toString();
    };
}
```
