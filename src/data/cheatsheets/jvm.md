# JVM 参数调优与生产排障速查

涵盖线上生产部署推荐 JVM 启动参数、JDK 自带命令行排障工具套件及常见 OOM 定位套路。

---

## 1. 推荐生产 JVM 启动参数模板 (JDK 8 / 11 / 17 / 21)

### JDK 17 / 21 现代生产标配 (G1 GC)
```bash
java -server \
  -Xms4g -Xmx4g \
  -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/data/logs/heapdump.hprof \
  -Xlog:gc*,gc+phases=debug:file=/data/logs/gc.log:time,uptime,pid:filecount=5,filesize=100M \
  -jar app.jar
```

### 关键参数解析
* `-Xms4g -Xmx4g`：初始堆与最大堆设置相同，避免 JVM 运行时频繁向操作系统申请扩缩堆内存导致的性能抖动。
* `-XX:+HeapDumpOnOutOfMemoryError`：发生 OOM 时自动抓取堆快照，生产环境**必开**保命选项。
* `-XX:HeapDumpPath=...`：指定 Dump 文件的保存路径。

---

## 2. JDK 自带命令行排障四剑客

### 1. `jps`：查看 Java 进程
```bash
# 列出进程 ID 及完整的包名/主类名
jps -l

# 列出传递给 JVM 的参数
jps -v
```

### 2. `jstack`：排查 CPU 飙高与死锁
```bash
# 打印 Java 进程的所有线程堆栈
jstack <PID> > jstack.txt

# 生产高频排查 CPU 100% 步骤：
# Step 1: 找出占用 CPU 最高的线程 ID (十进制)
top -Hp <PID>

# Step 2: 将线程 ID 转换为十六进制 (如 1024 转换后为 0x400)
printf "%x\n" <TID>

# Step 3: 在 jstack 结果中检索该 nid
jstack <PID> | grep -A 30 -i "0x400"
```

### 3. `jmap`：排查内存泄漏与堆分析
```bash
# 查看堆内存概况 (各代占比)
jmap -heap <PID>

# 统计存活对象数量与内存占用前 20 名
jmap -histo:live <PID> | head -n 25

# 手动导出堆 Dump 文件 (注意：可能导致 STW 暂停，谨慎在高峰期使用)
jmap -dump:live,format=b,file=dump.hprof <PID>
```

### 4. `jstat`：实时监控 GC 频率与耗时
```bash
# 每 1000 毫秒刷新一次 GC 统计，共输出 10 次
# S0C/S1C: Survivor区容量 | EC/EU: Eden区容量/已用 | OC/OU: 老年代容量/已用 | YGC/YGCT: YoungGC次数/耗时 | FGC/FGCT: FullGC次数/耗时
jstat -gcutil <PID> 1000 10
```

---

## 3. 常见 OOM (OutOfMemoryError) 类型与应对

| 错误信息 | 原因分析 | 快速应对手段 |
| :--- | :--- | :--- |
| `Java heap space` | 堆内存不足，大量大对象未释放或内存泄漏 | 检查大 List 查询（未分页）、ThreadLocal 未 remove、死循环创建对象；分析 heapdump 文件 |
| `GC overhead limit exceeded` | 98% 以上的时间都在做 GC 但仅释放了不到 2% 的内存 | 堆已濒临耗尽，调大堆内存并优化高频大对象分配 |
| `Metaspace` | 元空间（方法区）溢出，加载类过多 | 检查是否频繁使用 CGLIB/反射动态生成 Class、热部署泄漏；调大 `-XX:MaxMetaspaceSize` |
| `Direct buffer memory` | NIO 堆外内存溢出 (Netty/ByteBuffer) | 检查是否频繁分配 `ByteBuffer.allocateDirect` 且未及时释放；通过 `-XX:MaxDirectMemorySize` 调大 |
| `unable to create new native thread` | 操作系统无法为当前进程创建更多物理线程 | 检查线程池是否失控创建、调小单个线程栈深度 `-Xss`、修改操作系统最大进程线程数限制 (`ulimit -u`) |
