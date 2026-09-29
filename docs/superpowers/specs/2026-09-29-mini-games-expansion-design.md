# 休闲小游戏中心第一期扩充（俄罗斯方块 + 五子棋AI + 数独）技术设计规范

## 1. 概述与背景

当前个人网站（`personWeb`）的休闲小游戏中心（`/games`）已成功上线 4 款经典益智游戏（贪吃蛇、2048、扫雷、记忆翻牌）。为了进一步丰富小游戏中心的耐玩度与挑战性，本项目规划扩充 6 款经典游戏，并分为两期交付。

本文档为**第一期（经典旗舰益智三件套）**的技术设计规范，涵盖以下 3 款新游戏：
1. **俄罗斯方块 (Tetris)**：现代 Guideline 规范、7-Bag 随机器、SRS 旋转系统、幽灵投影、Hold 暂存槽、连击与消行音效。
2. **五子棋人机对弈 (Gomoku vs AI)**：15×15 拟真棋盘、休闲无禁手规则、自选黑先/白后、Minimax + Alpha-Beta 剪枝智能 AI（3 级难度）、悔棋与落子和弦。
3. **数独 (Sudoku)**：9×9 矩阵、唯一解自动出题引擎（初级/中级/高级）、铅笔候选笔记模式、实时冲突红字预警、同数字高亮与撤销。

同时，大厅 Bento Grid 扩充为 7 款自适应卡片，路由、全局命令面板（Command Palette）、Web 终端与本地持久化战绩全面同步升级。

---

## 2. 系统架构与文件规划

### 2.1 目录组织

遵循前端纯算法核心与 React UI 彻底解耦的架构原则，所有算法设计为无副作用的纯函数：

```
personWeb/
├── src/
│   ├── utils/
│   │   ├── games/
│   │   │   ├── tetrisLogic.js          # 俄罗斯方块核心算法
│   │   │   ├── gomokuLogic.js          # 五子棋规则判定与 Minimax AI
│   │   │   ├── sudokuLogic.js          # 数独回溯生成、唯一解求解与冲突检测
│   │   ├── gameAudio.js                # 扩充落子和弦、俄罗斯方块消行/Tetris和声、数独落笔音效
│   │   └── gameStorage.js              # 扩充 tetris/gomoku/sudoku 战绩与历史高分
│   ├── pages/
│   │   └── games/
│   │       ├── TetrisGame.jsx          # 俄罗斯方块主界面 (60FPS Canvas, 三栏布局, 触控+手势)
│   │       ├── GomokuGame.jsx          # 五子棋人机对弈主界面 (SVG 棋子, 悔棋, 难度切换)
│   │       ├── SudokuGame.jsx          # 数独主界面 (九宫格高亮, 铅笔候选数, 虚拟数字盘)
│   │       ├── GamesHome.jsx           # 游戏大厅 Bento Grid (扩充至 7 款卡片)
│   │       └── GamesHome.css
│   ├── components/games/               # 复用现有 GameHeader, VirtualDpad, Modals 等组件
│   ├── App.jsx                         # 注册 /games/tetris, /games/gomoku, /games/sudoku 路由
│   ├── components/Header.jsx           # 保持顶部导航统一
│   ├── components/WebTerminal.jsx      # 扩充 game tetris / gomoku / sudoku 命令行指令
│   └── utils/commandPaletteIndex.js    # 扩充全局 Command+K 检索条目
└── tests/
    ├── tetrisLogic.test.js             # 俄罗斯方块核心逻辑单测
    ├── gomokuLogic.test.js             # 五子棋判定与 AI 单测
    ├── sudokuLogic.test.js             # 数独生成与冲突单测
    └── commandPaletteIndex.test.js     # 检索索引单测更新
```

---

## 3. 游戏核心纯算法与数据结构

### 3.1 俄罗斯方块 (`tetrisLogic.js`)

1. **棋盘与方块表示**：
   - 棋盘尺寸：`10 列 × 20 行` 二维数组（加顶部 2 行缓冲区 `Array(22).fill(0).map(() => Array(10).fill(0))`），0 为空，1~7 代表对应方块颜色编号；
   - 7 种标准四格方块：`I, O, T, S, Z, J, L`，定义每种方块的初始形态及 4 种旋转方向（0, 90, 180, 270 度）的坐标偏移。
2. **7-Bag 随机器**：
   - 使用 Fisher-Yates 洗牌算法，将 7 种方块随机打乱后放入生成袋。每次抽空后重新生成，杜绝连续数十步不出特定关键方块（如长条 I）。
3. **SRS (Super Rotation System) 旋转与踢墙**：
   - 实现标准 SRS 踢墙偏移查找表（Wall Kick Data），当常规旋转发生碰撞（贴墙、碰底、嵌入缝隙）时，按标准偏移序列自动寻找合法放置点，保证旋转手感丝滑。
4. **几何碰撞与幽灵投影**：
   - `isValidPosition(board, piece, x, y, rotation)`：检测方块各单元是否出界或与已固化方块重叠；
   - `getGhostDropPosition(board, piece, x, y, rotation)`：从当前位置沿 Y 轴递增下探直到碰撞，计算幽灵方块投影 Y 坐标。
5. **消行与计分阶梯**：
   - `clearLines(board)`：遍历 20 行，清除所有满行并在顶部补入全 0 行，返回 `{ newBoard, linesCleared, clearedIndices }`；
   - 得分公式：单消 100 × Level、双消 300 × Level、三消 500 × Level、Tetris（四消）800 × Level；
   - 等级系统：每累计消除 10 行提升 1 级，下落间隔公式为 `Math.max(100, 800 - (level - 1) * 70)` 毫秒。

### 3.2 五子棋人机博弈 (`gomokuLogic.js`)

1. **棋盘状态与胜负裁决**：
   - 棋盘：`15 × 15` 二维数组（0: 空，1: 黑棋，2: 白棋）；
   - `checkGomokuWin(board, r, c)`：自落子点向横向、纵向、正斜向（`\`)、反斜向（`/`）四个方向辐射扫描连续同色棋子，若任一方向连续达到 5 子即判胜，时间复杂度 $O(1)$。
2. **候选点剪枝搜集**：
   - `getCandidateMoves(board)`：仅收集场上已有棋子周边 1~2 格曼哈顿距离内的空格，将搜索分支从 225 个大幅压缩至 15~25 个最相关点。
3. **Minimax + Alpha-Beta 剪枝引擎**：
   - 棋型估值函数（Heuristic Evaluation）：
     - 连五（Five）：+100,000 分；
     - 活四（Open Four）：+10,000 分；
     - 冲四/死四（Rush Four）：+1,000 分；
     - 活三（Open Three）：+1,000 分；
     - 眠三（Sleep Three）：+100 分；
     - 活二（Open Two）：+100 分；
   - 3 级难度：
     - **入门 (Beginner)**：深度 1（单步贪心评分，轻微随机微扰，适合休闲玩家）；
     - **进阶 (Intermediate)**：深度 2 + Alpha-Beta 剪枝（能攻善守，会阻止玩家双三或冲四）；
     - **大师 (Master)**：深度 3~4 + Alpha-Beta 剪枝（纯 JS 搜索用时 < 150ms，具备强大连珠攻防算力）。
4. **悔棋支持**：
   - 维护对局动作栈 `history: [{ row, col, color }]`，悔棋时一次性弹出 2 步（回退玩家和 AI 最近一步）。

### 3.3 数独出题与冲突算法 (`sudokuLogic.js`)

1. **终盘生成与唯一解检验**：
   - 基于回溯法（Backtracking）与随机置换，快速生成合法的 9×9 终盘；
   - 挖空出题（Digging Holes）：
     - **初级 (Easy)**：保留 38~40 个预填数字（挖空 ~42 格）；
     - **中级 (Medium)**：保留 32~34 个预填数字（挖空 ~48 格）；
     - **高级 (Hard)**：保留 26~28 个预填数字（挖空 ~54 格）；
   - 每次挖空前通过回溯求解器进行 `countSolutions(board, limit = 2)` 校验，确保答案唯一。
2. **实时辅助与冲突检测**：
   - `findConflicts(board)`：遍历九宫格，返回行、列、3×3 宫格内所有重复数字的坐标集合；
   - `getValidCandidates(board, r, c)`：根据同行、列、3×3 宫格中已有数字，自动计算该格所有合法的候选数字集合。

---

## 4. UI 界面与交互体验设计

### 4.1 俄罗斯方块 (`TetrisGame.jsx`)

- **渲染技术**：HTML5 Canvas 60FPS 双缓冲绘制，适配 `window.devicePixelRatio` 彻底消除高分屏锯齿；
- **自适应布局**：
  - 左侧：`HOLD` 磨砂玻璃卡片，显示暂存方块；本回合已暂存则置灰锁定；
  - 中央：10×20 核心舞台，半透明 `Ghost Piece` 幽灵虚影随光标即时投射至底部；
  - 右侧：`NEXT` 预览槽（展示接下来的 2~3 个方块）、实时得分、等级、消行数；
- **按键与触控**：
  - 键盘：`←/→` 平移、`↓` 软降、`↑/X` 顺时针旋转、`Z` 逆时针旋转、`Space` 硬降锁定、`C/Shift` 暂存、`P` 暂停；
  - 触控：手势滑动（左右平移、下滑软降、上划瞬降），底部配套药丸触控按钮（🔄 旋转、📦 暂存、⚡ 硬降）以及可选 `VirtualDpad`。

### 4.2 五子棋人机对弈 (`GomokuGame.jsx`)

- **视觉细节**：
  - 15×15 棋盘具备精细刻线与 5 处黑白星位（天元与四隅）；
  - 棋子采用 SVG 径向渐变，呈现立体黑白云子质感，落子时带微弱投影与清脆落子音效；
  - 鼠标移动带有十字准星与半透明虚影引导，最后一步落子标有脉冲微红点，胜负决出时高光连线。
- **控制体系**：
  - 难度分段胶囊（入门 / 进阶 / 大师）；
  - 执子分段选择（执黑先手 / 执白后手）；
  - 一键悔棋（Undo）与认输重开。

### 4.3 数独 (`SudokuGame.jsx`)

- **九宫格与视觉交互**：
  - 9×9 网格采用粗细分明的边框划分 9 个大宫；
  - 选中任意格子时，同行、同列、同宫与场上所有相同数字施加柔和高光底色；
  - 发生冲突时，重复数字显示呼吸红字警示；
  - 格子内支持 3×3 微型候选笔记（Pencil Notes）显示；
- **输入控制**：
  - 键盘 `1~9` 填数，`Backspace` 擦除，方向键切换单元格；
  - 屏幕底部提供 `1~9` 圆形按键（附带剩余需填数量角标，填满自动置灰）；
  - 提供 `✏️ 铅笔模式`、`⌫ 橡皮擦`、`↩️ 撤销`、`💡 自动填充候选笔记` 快捷工具条。

---

## 5. Web Audio 纯前端音效扩充 (`gameAudio.js`)

在保持零音频文件体积（全 Web Audio API 动态合成）的前提下，新增并优化以下音效：
1. **五子棋**：双频清脆落子敲击声（白噪声短暂脉冲 + 280Hz 阻尼正弦波）；
2. **俄罗斯方块**：
   - 平移微滴答声、旋转风声微调；
   - 硬降重低音冲击波（80Hz 骤降锯齿波）；
   - 单/双/三消行升调琶音；
   - Tetris（四消）大和弦欢呼音；
3. **数独**：
   - 铅笔轻戳触感声（软滤高频声）；
   - 擦除柔和噗声；
   - 冲突错误提示音（双音沉闷蜂鸣）。

---

## 6. 战绩持久化设计 (`gameStorage.js`)

本地存储键名沿用 `ly_geek_games_records_v1`，数据格式向后兼容并扩充：

```javascript
{
  // 现有 4 款游戏保持完全不变
  snake: { bestScore: 0, playCount: 0 },
  game2048: { bestScore: 0, maxTile: 2, playCount: 0 },
  minesweeper: { beginnerBestTime: null, intermediateBestTime: null, playCount: 0 },
  memory: { bestTurns: null, bestTime: null, playCount: 0 },
  
  // 第一期新扩充 3 款游戏
  tetris: {
    bestScore: 0,         // 历史最高分
    maxLines: 0,          // 单局最多消行数
    playCount: 0          // 总游玩局数
  },
  gomoku: {
    wins: 0,              // 击败 AI 胜场
    losses: 0,            // 负于 AI 场次
    playCount: 0          // 对局总数
  },
  sudoku: {
    easyBestTime: null,   // 初级最佳用时（秒）
    mediumBestTime: null, // 中级最佳用时（秒）
    hardBestTime: null,   // 高级最佳用时（秒）
    playCount: 0          // 挑战局数
  }
}
```

---

## 7. 大厅 Bento Grid 扩充与全站集成

### 7.1 Bento 网格卡片扩展 (`GamesHome.jsx`)

从 4 款扩充至 7 款，每款卡片包含：
- 专属渐变光晕与图标徽章：
  - 俄罗斯方块：`#06b6d4` 霓虹青蓝，图标 🧱，标签 `经典消除` `SRS旋转` `7-Bag`
  - 五子棋人机：`#6366f1` 典雅紫绀，图标 ♟️，标签 `人机博弈` `3级AI` `悔棋支持`
  - 数独：`#f59e0b` 暖阳琥珀，图标 🔢，标签 `逻辑演算` `候选笔记` `实时冲突`
- 实时读取并展示历史最佳战绩；
- 悬浮微上浮动效与一键“开始游戏”跳转。

### 7.2 全局路由与快捷指令
1. **路由注册 (`App.jsx`)**：
   - `/games/tetris` -> `<TetrisGame />` (lazy)
   - `/games/gomoku` -> `<GomokuGame />` (lazy)
   - `/games/sudoku` -> `<SudokuGame />` (lazy)
2. **全局 Command+K 面板 (`commandPaletteIndex.js`)**：
   - 增加 3 款游戏的独立快捷检索项；
3. **Web 终端 (`WebTerminal.jsx`)**：
   - 增加 `game tetris`、`game gomoku`、`game sudoku` 命令及对应别名。

---

## 8. 自动化测试规范

新增 3 组纯算法单测套件，使用 Node.js 原生 `node --test` 运行：
1. `tests/tetrisLogic.test.js`：
   - 7-Bag 无偏随机器：连续 14 个方块中各种方块出现频率严格均衡；
   - 旋转与 SRS 踢墙：测试各方向旋转及贴墙旋转矫正；
   - 碰撞与幽灵下落：验证 `isValidPosition` 边界及 `getGhostDropPosition` 计算精度；
   - 消行与计分：单消/双消/三消/四消的消行及行号、计分加成正确性。
2. `tests/gomokuLogic.test.js`：
   - 连五胜负裁决：测试横、竖、正斜、反斜 5 连胜负判定；
   - 剪枝与候选点搜集：已有棋子周围邻域提取；
   - AI 决策：在有连四时能立即成五，在对方活三时能准确防守拦截。
3. `tests/sudokuLogic.test.js`：
   - 终盘回溯求解：生成合法的数独解；
   - 挖空题目唯一解检验：验证生成的初中高难度谜题解唯一；
   - 冲突检测：行、列、宫出现重复数字时准确返回冲突坐标；
   - 候选数计算：正确排除同行同列同宫数字。
4. `tests/commandPaletteIndex.test.js`：
   - 断言新游戏全局命令正确索引并支持模糊关键词搜索。
