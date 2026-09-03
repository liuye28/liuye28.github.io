# Docker & Compose 高频运维与排障速查

涵盖容器生命周期操作、日志查看、性能资源限制及常见排障命令。

---

## 1. 容器与镜像高频操作

### 容器生命周期
```bash
# 启动并在后台运行容器 (映射端口、挂载目录、设置时区与环境变量)
docker run -d \
  --name my-app \
  -p 8080:8080 \
  -v /opt/data:/data \
  -e TZ=Asia/Shanghai \
  -e "SPRING_PROFILES_ACTIVE=prod" \
  --restart=always \
  my-app:1.0.0

# 优雅停止与强制终止
docker stop my-app     # 发送 SIGTERM，默认等待 10s 超时
docker kill my-app     # 直接发送 SIGKILL 强杀

# 重启容器
docker restart my-app
```

### 调试与交互
```bash
# 进入容器终端 (带 Bash 或 Sh)
docker exec -it my-app /bin/bash
# 若容器为极简 Alpine 镜像无 bash：
docker exec -it my-app /bin/sh

# 复制文件到/从容器
docker cp my-app:/data/app.log ./local.log
docker cp ./app.jar my-app:/app/app.jar
```

---

## 2. 日志与排障查看

```bash
# 实时跟踪容器最新日志 (末尾 100 行)
docker logs -f --tail 100 my-app

# 查看包含特定时间戳以后的日志
docker logs --since "2026-09-03T09:00:00" my-app

# 检查容器退出原因与详细元数据 (ExitCode / OOMKilled)
docker inspect my-app --format '{{.State.Status}} | ExitCode: {{.State.ExitCode}} | OOM: {{.State.OOMKilled}}'

# 实时监控所有容器的 CPU、内存占用率
docker stats --no-stream
```

---

## 3. 清理空间与资源垃圾回收

```bash
# 查看 Docker 磁盘占用空间详细报告
docker system df

# 一键清理所有已停止容器、无用网络、悬挂无标签镜像及构建缓存 (谨慎操作)
docker system prune -a --volumes -f
```

---

## 4. Docker Compose 模板速查

```yaml
version: '3.8'
services:
  app:
    image: openjdk:17-jdk-slim
    container_name: demo-service
    ports:
      - "8080:8080"
    environment:
      - TZ=Asia/Shanghai
      - SPRING_PROFILES_ACTIVE=prod
    volumes:
      - ./logs:/logs
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4096M
        reservations:
          memory: 2048M
    restart: always
```
