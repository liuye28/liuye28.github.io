# Redis 核心机制与缓存三灾应对

涵盖五大数据结构常用命令速查、分布式锁标准实现及缓存穿透/击穿/雪崩对策。

---

## 1. 五大基础数据结构常用命令

### 1. String (字符串)
```bash
SET key "value" EX 60 NX  # 仅当 key 不存在时设置并设置 60s 过期 (分布式锁基础原语)
GET key                   # 获取值
INCR key                  # 原子自增 1 (计数器/限流)
MGET k1 k2 k3             # 批量获取，减少网络 RTT 往返
```

### 2. Hash (哈希字典)
```bash
HSET user:1001 name "ly" age 28   # 存储对象属性
HGET user:1001 name              # 获取指定属性
HGETALL user:1001                # 获取全部属性与值
HINCRBY user:1001 score 10       # 属性原子累加
```

### 3. List (双向列表)
```bash
LPUSH queue:task "task_1"         # 左侧推入
RPOP queue:task                   # 右侧弹出 (实现轻量 FIFO 队列)
BRPOP queue:task 30               # 阻塞式弹出，30s 超时 (防空转轮询)
LRANGE list 0 -1                  # 查看整个列表
```

### 4. Set (无序去重集合)
```bash
SADD tags:1001 "Java" "Spring"    # 添加元素
SMEMBERS tags:1001                # 获取所有元素
SINTER set1 set2                  # 交集 (共同好友/共同标签)
SISMEMBER tags:1001 "Java"        # 判断是否存在 (O(1))
```

### 5. ZSet (有序集合 - 按 Score 排序)
```bash
ZADD leaderboard 100 "user_a" 250 "user_b"  # 写入分数
ZREVRANGE leaderboard 0 9 WITHSCORES        # 获取排名前 10 (由高到低)
ZINCRBY leaderboard 50 "user_a"             # 增加玩家分数
ZRANK leaderboard "user_a"                  # 查询玩家当前排位
```

---

## 2. 缓存三灾全套解决方案

### 1. 缓存穿透 (查询根本不存在的数据，请求直穿 DB)
* **特征**：黑客制造大量不存在的 ID（如 `-1`）恶意刷库。
* **解决对策**：
  1. **布隆过滤器 (Bloom Filter)**：在缓存前加一层布隆过滤器，快速判定 key 是否一定不存在。
  2. **缓存空对象 (Null Value Caching)**：即使 DB 为空，也写入 `""` 或 `"null"`，并设置较短的过期时间（如 60 秒）。

### 2. 缓存击穿 (某单一热点 key 瞬间失效，海量并发压垮 DB)
* **特征**：微博突发热搜、爆款秒杀商品 key 刚好到期。
* **解决对策**：
  1. **互斥锁 (Mutex Lock)**：只允许一个线程去查 DB 重建缓存，其余线程自旋等待。
  2. **逻辑永不过期**：不给 Redis 设 TTL，在 value 中存入逻辑过期时间，由后台异步线程刷新。

### 3. 缓存雪崩 (大量 key 在同一时间集中失效，或 Redis 宕机)
* **特征**：零点批量刷新任务导致数万 key 同时过期，DB 瞬间被打爆。
* **解决对策**：
  1. **过期时间随机打散**：`TTL = 基础时间 + Random(1~5分钟)`。
  2. **高可用集群架构**：Redis Sentinel 哨兵或 Cluster 模式，避免单点故障。
  3. **服务层熔断降级**：结合 Sentinel / Resilience4j 对非核心查询做快速熔断。

---

## 3. Redis 分布式锁标准要点

```java
// 核心原语：SET key requestId NX PX 30000
// 释放锁必须使用 Lua 脚本比对 requestId，防止误删他人的锁：
String luaScript = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    else
        return 0
    end
    """;
```
* 生产建议直接使用成熟框架 **Redisson**，内置看门狗（Watchdog）自动续期机制与公平锁实现。
