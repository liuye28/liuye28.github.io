# Git 撤销、回滚与分支拯救锦囊

涵盖生产常见误操作紧急回滚、暂存区恢复、优雅变基及 commit 整理。

---

## 1. 紧急撤销与版本回退

### 1. 刚提交了 commit，发现漏了文件或信息写错
```bash
# 修改上次 commit 消息，或将新暂存的文件追加到上次提交 (不新增 commit 节点)
git add missed_file.txt
git commit --amend --no-edit
```

### 2. 撤销最近一次 commit，但保留已写的代码变更
```bash
# 撤销 commit 并将修改放回暂存区 (Staged)
git reset --soft HEAD~1

# 撤销 commit 并将修改放回工作区 (Unstaged) —— 最常用
git reset HEAD~1
```

### 3. 彻底丢弃工作区的所有修改 (谨慎操作)
```bash
# 放弃所有未暂存的工作区改动
git restore .

# 丢弃所有未跟踪的新增文件和文件夹
git clean -fd
```

### 4. 代码已推送到远端，如何安全回滚某次提交？
```bash
# ❌ 不要强推 reset：git push -f 会覆盖团队成员历史！
#  生成一个反向补偿 commit 来对冲掉指定 commit 的所有修改
git revert <COMMIT_HASH>
git push origin <branch>
```

---

## 2. 紧急切分支：代码写到一半怎么办？

```bash
# 暂存当前未完成的工作（带自定义说明）
git stash save "正在开发订单结算逻辑"

# 查看所有暂存记录
git stash list

# 切回分支后恢复暂存内容
git stash pop        # 恢复最新暂存并删除记录
git stash apply stash@{0} # 仅恢复内容，不删除 stash 记录
```

---

## 3. 分支操作与变基拯救

### 从其他分支单摘某一个 Commit (Cherry-pick)
```bash
# 将特定 commit 应用到当前分支
git cherry-pick <COMMIT_HASH>
```

### 误删分支或找不到 Commit 时的时光机 (Reflog)
```bash
# 查看所有 HEAD 移动记录（哪怕被 reset 或删分支也能找到！）
git reflog

# 找到目标操作前的 HEAD@{n} 哈希，直接原地复活
git checkout -b recover-branch <COMMIT_HASH>
```
