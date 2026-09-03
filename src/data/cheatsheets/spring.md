# Spring Boot 核心机制与事务陷阱速查

涵盖 Spring 核心常用注解全景、Bean 生命周期关键拓展点及 `@Transactional` 事务失效经典场景。

---

## 1. 核心注解全景速查

### 组件声明与装配
* `@Component`：通用 Spring 管理的组件。
* `@Service` / `@Repository` / `@Controller`：业务层、持久层、控制层语义化注解。
* `@Configuration` + `@Bean`：显式 Java Config 配置类，配合 `@ConditionalOnProperty` / `@ConditionalOnMissingBean` 实现条件注入。
* `@Lazy`：延迟加载 Bean，在首次调用时才初始化，常用于解偶复杂依赖或启动加速。

### 参数绑定与请求映射
* `@PathVariable`：从 URL 路径变量中取值，如 `/users/{id}`。
* `@RequestParam`：从 Query 参数或 `application/x-www-form-urlencoded` 表单中取值。
* `@RequestBody`：从 HTTP 请求体中读取 JSON 反序列化为 Java 对象。
* `@Validated` / `@Valid`：结合 JSR-380 校验注解（`@NotNull`、`@NotBlank`、`@Min`）实现出入参自动拦截校验。

---

## 2. `@Transactional` 事务失效经典八大场景

Spring 声明式事务底层基于 **Spring AOP 动态代理** 实现，只有当外部调用打在代理对象上时，事务切面（`TransactionInterceptor`）才会生效。

### 1. 同类内部自调用 (Self-Invocation)
```java
// ❌ 错误：内部方法未经过 Spring 代理对象，事务注解被静默忽略
public void createOrder() {
    this.updateStock(); // 事务失效！
}

@Transactional
public void updateStock() { ... }

//  解决办法：注入自身代理类，或使用 AopContext.currentProxy()，或拆分至单独 Service
```

### 2. 修饰非 public 方法
```java
// ❌ 错误：Spring 默认只对 public 方法开启事务切面拦截
@Transactional
protected void doSave() { ... } // 事务失效！
```

### 3. 异常被内部 catch 吞噬未重新抛出
```java
// ❌ 错误：异常被捕获后没有抛出，切面认为方法正常执行完毕，导致事务正常 commit 而不回滚
@Transactional
public void saveUser() {
    try {
        userMapper.insert(user);
        int i = 1 / 0;
    } catch (Exception e) {
        log.error("保存失败", e); // 事务不会回滚！
    }
}
```

### 4. 抛出非 RuntimeException (未指定 rollbackFor)
```java
// ❌ 错误：Spring 事务默认只对 RuntimeException 和 Error 触发回滚
// 如果抛出 Checked Exception (如 IOException, SQLException)，默认不回滚！
@Transactional
public void saveFile() throws IOException { ... }

//  解决办法：显式声明 rollbackFor = Exception.class
@Transactional(rollbackFor = Exception.class)
public void saveFile() throws IOException { ... }
```

### 5. 错误的事务传播行为 (Propagation)
* `Propagation.NOT_SUPPORTED`：以非事务方式执行，若存在当前事务则挂起。
* `Propagation.NEVER`：以非事务方式执行，若存在事务则抛出异常。
* `Propagation.REQUIRES_NEW`：新建独立事务，外层事务异常不会导致内层回滚（需符合业务预期）。

### 6. 多线程异步调用
```java
// ❌ 错误：事务上下文与数据库 Connection 是绑定在当前线程 ThreadLocal 中的
// 在子线程中执行的 DB 操作脱离了主线程事务管理！
@Transactional
public void doAsync() {
    new Thread(() -> {
        orderMapper.insert(order); // 处于独立连接中，无法协同回滚
    }).start();
}
```

### 7. 数据源未开启事务支持或底层数据库引擎不支持 (如 MyISAM)
* 确保 MySQL 表引擎为 `InnoDB`。

### 8. Bean 本身未被 Spring 容器托管
* 类上漏写了 `@Service` 或组件扫描路径未包含该类，直接用 `new ServiceImpl()` 创建的对象无 AOP 代理。
