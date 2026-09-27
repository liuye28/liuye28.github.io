# 小游戏中心 (Mini Games Hub) 架构与设计规范

- **状态**：已批准 (Approved)
- **创建日期**：2026-09-27
- **设计分类**：Architectural（新增顶级子系统板块）
- **目标工程**：Ly's Workspace (personWeb)

---

## 1. 背景与目标

### 1.1 背景
**Ly's Workspace** 作为个人综合工作台，目前包含「网站导航」、「小工具」及「技术速查」等生产力板块。为了丰富工作之余的休闲与专注调节体验，需要在网站中引入一个极具质感、纯前端免后端的 **小游戏中心（Mini Games Hub）**，首批上线四款经典益智小游戏：
1. **贪吃蛇（Snake）**：敏捷反应经典，平滑曲线与呼吸粒子动效；
2. **2048**：数学逻辑与合并益智，数字卡片弹跳动效；
3. **扫雷（Minesweeper）**：经典推理，首击必安全机制与连片递归展开；
4. **记忆翻牌（Memory Match）**：极客科技图标主题与 3D 立体翻转质感。

### 1.2 核心目标
1. **纯前端免外部依赖**：
   - 遵循 GitHub Pages 零后端部署原则，所有游戏逻辑、状态机、音效合成均在浏览器端运行；
   - 绝不引入臃肿的第三方庞大游戏引擎（如 Phaser 等），保持轻量快速与纯粹。
2. **Apple HIG 视觉设计与暗夜科技美学**：
   - 完美适配站点现有的深色/浅色主题、磨砂玻璃拟态、圆角边框与平滑过渡；
   - 游戏不仅好玩，而且具备高度审美质感。
3. **最佳跨端交互体验**：
   - **PC 端**：支持键盘方向键、WASD、空格暂停、R 键重开等全键盘快捷操控；
   - **移动端**：支持流畅的手势滑动识别（TouchSwipe）、优雅半透明虚拟十字手柄（VirtualDpad）与触觉反馈（Haptic Vibration）。
4. **零资源外部加载的 Web Audio 原生音效引擎**：
   - 使用 Web Audio API 动态合成移动、吃食物、碰撞、翻牌、通关、失败音效，支持全站一键静音与偏好持久化。
5. **战绩系统与全站深度集成**：
   - 本地持久化记录最高分、通关时间与游玩频次；
   - 深度接入 Header 导航栏、Command Palette (`⌘K`) 与 WebTerminal 极客命令行。

---

## 2. 总体架构与目录结构

### 2.1 分层架构设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          User Interface Layer                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │   小游戏大厅 (Hub)   │  │   各游戏独立视图     │  │ 统一操作栏/控制器 │  │
│  │   GamesHome.jsx      │  │ Snake/2048/Mine/Card │  │ GameHeader/Dpad   │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬─────────┘  │
└─────────────┼─────────────────────────┼────────────────────────┼────────────┘
              │                         │                        │
┌─────────────▼─────────────────────────▼────────────────────────▼────────────┐
│                       Game Logic & State Hook Layer                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ useSnakeGame / useGame2048 / useMinesweeper / useMemoryMatch          │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                    Pure Functions & Core Algorithm Layer                    │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │ 2048 棋盘滑动合并算法│  │ 扫雷连片展开/安全布雷│  │ 贪吃蛇网格碰撞检测│  │
│  │ game2048Logic.js     │  │ minesweeperLogic.js  │  │ snakeLogic.js     │  │
│  └──────────────────────┘  └──────────────────────┘  └───────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                     Shared Infrastructure Layer                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │ Web Audio 合成音效   │  │ 战绩与配置持久化     │  │ 触控手势识别      │  │
│  │ src/utils/gameAudio  │  │ src/utils/gameStorage│  │ hooks/useTouch    │  │
│  └──────────────────────┘  └──────────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构规划

```
src/
├── pages/
│   └── games/
│       ├── GamesHome.jsx               # 小游戏大厅首页 (Bento Grid 展厅)
│       ├── GamesHome.css
│       ├── SnakeGame.jsx               # 贪吃蛇游戏页面
│       ├── Game2048.jsx                # 2048 游戏页面
│       ├── MinesweeperGame.jsx         # 扫雷游戏页面
│       ├── MemoryMatchGame.jsx         # 记忆翻牌游戏页面
│       └── GamesCommon.css             # 游戏共享样式 (Header, 模态, 控制台)
├── components/
│   └── games/
│       ├── GameHeader.jsx              # 统一游戏顶部栏 (返回, 分数, 刷新, 音效)
│       ├── VirtualDpad.jsx             # 移动端虚拟方向摇杆/手柄
│       ├── GameHelpModal.jsx           # 游戏玩法与按键指引模态
│       └── GameOverModal.jsx           # 游戏结束/胜利通关结算弹窗
├── utils/
│   ├── games/
│   │   ├── snakeLogic.js               # 贪吃蛇纯函数逻辑 (网格、移动、防撞、食物生成)
│   │   ├── game2048Logic.js            # 2048 纯函数逻辑 (4向滑动合并、有效移动判定、胜负判定)
│   │   ├── minesweeperLogic.js         # 扫雷纯函数逻辑 (首击安全布雷、Flood Fill展开、插旗)
│   │   └── memoryLogic.js              # 记忆翻牌纯函数逻辑 (洗牌、匹配对校验、步数统计)
│   ├── gameAudio.js                    # Web Audio 原生音效合成引擎 (免静态资源)
│   └── gameStorage.js                  # 游戏战绩持久化封装 (高分榜、游玩次数)
tests/
├── game2048.test.js                    # 2048 核心滑动合并与矩阵边界单测
├── minesweeper.test.js                 # 扫雷首击安全与连片展开算法单测
└── gameStorage.test.js                 # 战绩读写与兼容降级单测
```

---

## 3. 四款游戏核心算法与交互设计

### 3.1 贪吃蛇（Snake）

#### 核心算法与数据结构
- **网格规范**：20×20 标准逻辑网格，单元格坐标为 `{ x: 0..19, y: 0..19 }`。
- **蛇身表示**：数组 `body = [{x, y}, ...]`，索引 `0` 为蛇头，尾部在最后。
- **移动与进食**：
  - 每步心跳计算新蛇头：`nextHead = { x: head.x + dir.x, y: head.y + dir.y }`；
  - 若 `nextHead` 与食物坐标重合：蛇身保留尾巴并加长，触发吃食物音效，分数 `+10`，在蛇身以外的空白格重新生成食物；
  - 若未进食：蛇身向前推入 `nextHead` 并丢弃末尾 `pop()`。
- **碰撞判定**：
  - 撞墙判定：`nextHead.x < 0 || nextHead.x >= 20 || nextHead.y < 0 || nextHead.y >= 20`；
  - 自咬判定：`nextHead` 存在于蛇身中（排除蛇尾移动释放格）。
- **动态变速阶梯**：
  - 初始速度：`160ms/step`；
  - 每吃 5 颗食物，速度递减 `10ms`（最高限速 `70ms/step`），增加刺激度。

#### 渲染与交互
- 采用 HTML5 Canvas 结合 `devicePixelRatio` 保证 Retina 高清屏超清晰显示；
- 蛇头圆润并带有发光高光眼，食物附带柔和光晕呼吸微动效；
- 按键防突变反向：前进方向为右时，若瞬间输入向左无效，防止瞬间自撞。

---

### 3.2 2048

#### 核心算法与数据结构
- **棋盘表示**：4×4 的纯二维数字数组 `board: number[][]`，空位为 `0`。
- **单行滑动合并纯函数（`slideAndMergeLine`）**：
  1. 过滤空位 `0` 得到紧凑数组；
  2. 从左至右扫描，相邻相同则合并相加（如 `[2, 2, 4]` -> 合并后为 `[4, 0, 4]` -> 紧凑为 `[4, 4]`），合并累计增加到当前局得分；
  3. 补齐末尾 `0` 至长度为 4；
- **四向滑动派生**：
  - `slideLeft`：直接对每行应用；
  - `slideRight`：每行反转 -> `slideLeft` -> 再反转；
  - `slideUp`：矩阵转置 -> `slideLeft` -> 转置回还原；
  - `slideDown`：矩阵转置 -> `slideRight` -> 转置回还原；
- **移动有效性与随机生成**：
  - 仅当移动后矩阵与移动前矩阵不同时，判定为有效移动；
  - 有效移动后在所有值为 `0` 的格中随机挑选一个填充新数（90% 为 2，10% 为 4）；
- **胜负状态检测**：
  - **胜利**：首次出现 `2048` 方块触发通关弹窗（支持“继续挑战”探索高分）；
  - **失败**：棋盘无空位且四个方向均无法再进行任何合并。
- **撤销机制（Undo）**：保存最近 1 步历史快照，贴心支持撤销一步。

---

### 3.3 扫雷（Minesweeper）

#### 核心算法与数据结构
- **难度预设**：
  - 初级：9×9 网格，10 颗地雷；
  - 中级：16×16 网格，40 颗地雷。
- **单元格状态模型**：
  ```typescript
  interface Cell {
    row: number;
    col: number;
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
  }
  ```
- **首击绝对安全保证（First Click Safety Guarantee）**：
  - 玩家初次点击前不生成地雷；
  - 发生第一次点击时，以该点击坐标及周围 8 邻域作为“禁埋安全区”，在其余区域随机生成指定数量的地雷，保证第一步绝不踩雷且大概率直接连片开荒。
- **连片扩散算法（Flood Fill）**：
  - 当点开的格子 `neighborMines === 0` 时，使用 BFS 队列快速自动揭开周围所有未标记、未揭开的邻居格子；
  - 遇到边缘数字格则停止扩散并展示数字。
- **胜负判定**：
  - 点击到地雷：游戏结束，翻开全场所有地雷；
  - 所有非雷格子均被成功揭开：判定获胜，放烟花音效并记录通关耗时。

---

### 3.4 记忆翻牌（Memory Match）

#### 核心算法与数据结构
- **模式与卡片**：
  - 经典模式：4×4 网格，8 对匹配图案（共 16 张）；
  - 精选 8 组高辨识度 Emoji 图标（🚀 飞船、💻 笔记本、⚡ 闪电、🦄 独角兽、☕ 咖啡、🎮 手柄、🛡️ 盾牌、💎 钻石）；
- **卡片状态机**：
  ```
  [Card State]
      ├── isFlipped: boolean    # 是否处于翻开状态
      └── isMatched: boolean    # 是否已成功配对消除
  ```
- **核心比对时序**：
  - 翻开第一张 -> 保持；
  - 翻开第二张 -> 步数 `turns + 1`，比对两张牌图标：
    - 一致：标记为 `isMatched = true`，播放配对成功音效，检测是否全部配对完毕；
    - 不一致：锁定交互 750ms，自动翻回背面。

---

## 4. 通用基础设施层设计

### 4.1 零依赖 Web Audio 原生音效引擎（`src/utils/gameAudio.js`）
利用浏览器原生 `window.AudioContext` / `webkitAudioContext`，提供零静态资源加载、零延迟的极客音效：
```javascript
// 核心接口规范
export const gameAudio = {
  isMuted(): boolean,
  toggleMute(): boolean,
  playMove(): void,       // 微小操作咔哒声
  playEat(): void,        // 欢快上扬双音阶
  playMerge(): void,      // 和弦碰撞微鸣
  playFlip(): void,       // 翻牌沙沙声
  playExplosion(): void,  // 触雷低沉爆破震音
  playWin(): void,        // 通关凯旋大三和弦琶音
  playLose(): void,       // 失败惋惜降调
};
```
- 静音偏好保存至 `localStorage`（键名：`games_sound_muted`），全局各游戏状态实时互通。

### 4.2 游戏战绩持久化中心（`src/utils/gameStorage.js`）
基于 `src/utils/storage.js` 的安全读写：
- 存储键名：`games_records_v1`
- 结构定义：
  ```javascript
  {
    snake: { bestScore: 0, playCount: 0 },
    game2048: { bestScore: 0, maxTile: 0, playCount: 0 },
    minesweeper: { bestTimeBeginner: null, bestTimeIntermediate: null, playCount: 0 },
    memory: { bestTurns: null, bestTime: null, playCount: 0 }
  }
  ```

### 4.3 移动端手势与触控组件
- **`useTouchSwipe(onSwipe)`**：
  - 监听 `touchstart` / `touchmove` / `touchend`；
  - 计算滑动向量 `deltaX` 与 `deltaY`，超过最小阈值（30px）时触发对应方向 `UP / DOWN / LEFT / RIGHT`；
  - 游戏画布区域内阻止默认手势回弹，防止页面跟随晃动。
- **`VirtualDpad`**：
  - 专为移动端设计的屏幕半透明方向键，支持轻微触控震动反馈（`navigator.vibrate?.(15)`）。

---

## 5. 路由、导航与全站集成

### 5.1 路由配置与动态拆包（`src/App.jsx`）
```javascript
const GamesHome = lazy(() => import('./pages/games/GamesHome'));
const SnakeGame = lazy(() => import('./pages/games/SnakeGame'));
const Game2048 = lazy(() => import('./pages/games/Game2048'));
const MinesweeperGame = lazy(() => import('./pages/games/MinesweeperGame'));
const MemoryMatchGame = lazy(() => import('./pages/games/MemoryMatchGame'));

// 路由挂载
<Route path="/games" element={<GamesHome />} />
<Route path="/games/snake" element={<SnakeGame />} />
<Route path="/games/2048" element={<Game2048 />} />
<Route path="/games/minesweeper" element={<MinesweeperGame />} />
<Route path="/games/memory" element={<MemoryMatchGame />} />
```

### 5.2 Header 导航栏（`src/components/Header.jsx`）
- 在顶部 Apple HIG 分段导航菜单中加入：
  ```jsx
  <NavLink to="/games" className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}>
    小游戏
  </NavLink>
  ```

### 5.3 Command Palette (`src/utils/commandPaletteIndex.js`)
新增「休闲小游戏」分组，注册快捷指令：
- `游戏大厅` (路由 `/games`)
- `贪吃蛇 (Snake)` (路由 `/games/snake`)
- `2048` (路由 `/games/2048`)
- `扫雷 (Minesweeper)` (路由 `/games/minesweeper`)
- `记忆翻牌 (Memory Match)` (路由 `/games/memory`)

### 5.4 WebTerminal 集成（`src/components/WebTerminal.jsx`）
- 增加终端命令 `games` 与 `game <name>`（支持 `game snake`、`game 2048`、`game minesweeper`、`game memory`）。

---

## 6. 测试策略与验证方案

1. **单元测试（`npm test`）**：
   - 核心纯算法逻辑 100% 覆盖：
     - `game2048Logic.test.js`：测试行滑动合并、有效移动判定、胜负终局判定；
     - `minesweeperLogic.test.js`：测试首次点击绝对安全算法、连片空白递归展开算法；
     - `gameStorage.test.js`：测试战绩读写、初次无数据降级、分数刷新。
2. **端到端体验与构建验证**：
   - 执行 `npm run build`，确保 Vite 打包零警告、按需拆包生效；
   - 验证深浅色主题平滑切换无突兀色块；
   - 验证移动端手势与键盘响应灵敏度。
