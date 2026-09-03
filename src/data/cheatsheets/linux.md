# Linux 生产性能诊断与排障三板斧

涵盖 CPU、内存、磁盘 I/O 及网络四大关键维度的快速定位命令。

---

## 1. 概览：第一时间掌握整机健康度

```bash
# 查看系统负载、运行时间、在线用户
uptime
# 关注 load average 1分、5分、15分平均值，若超过 CPU 核心数则说明存在计算或 I/O 拥塞

# 综合资源全景看板 (按 1 展开所有 CPU 核心，按 P 按 CPU 排序，按 M 按内存排序)
top
```

---

## 2. 深入：四大核心资源定位命令

### 1. CPU 维度排查
```bash
# 每隔 1 秒打印一次 CPU 统计，共 5 次
# 关注 %usr (用户态)、%sys (系统内核态)、%iowait (磁盘等待)
vmstat 1 5

# 精确查看每个进程/线程的 CPU 消耗情况 (需 sysstat 工具包)
pidstat -u 1 3
```

### 2. 内存维度排查
```bash
# 以易读的 MB/GB 单位显示物理内存与 Swap
free -h
# 关注 available (真正可用内存)，而非 free (空闲物理内存，Linux 会将空闲内存用于 buffer/cache)

# 找出占用物理内存 (RSS) 最多的前 10 个进程
ps aux --sort=-%mem | head -n 11
```

### 3. 磁盘空间与 I/O 维度排查
```bash
# 查看各挂载分区磁盘占用率
df -h

# 查看当前目录下各子文件夹体积 (按大小倒序)
du -sh * | sort -hr | head -n 10

# 监控磁盘 I/O 吞吐与利用率 (关注 %util，达到 100% 说明磁盘 I/O 饱和)
iostat -x 1 5
```

### 4. 网络连接与端口排查
```bash
# 查看所有监听端口及对应进程 PID (推荐 ss，比 netstat 快数倍)
ss -tulpn

# 统计当前 TCP 各种连接状态的数量 (如 ESTABLISHED, TIME_WAIT, CLOSE_WAIT)
ss -ant | awk '{print $1}' | sort | uniq -c
```

---

## 3. 文本日志实时过滤利器

```bash
# 实时跟踪日志并高亮关键错误
tail -f app.log | grep --color=auto -E "ERROR|Exception|Timeout"

# 统计日志中访问频次最高的 IP 前 10 名
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -n 10
```
