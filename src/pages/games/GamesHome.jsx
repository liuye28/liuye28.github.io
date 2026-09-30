import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import usePageTitle from '../../hooks/usePageTitle';
import { getRecords } from '../../utils/gameStorage';
import './GamesHome.css';

/**
 * 四款经典小游戏静态元数据与专属视觉定义
 */
const GAME_CONFIGS = [
  {
    id: 'snake',
    title: '贪吃蛇',
    subtitle: 'Classic Snake',
    path: '/games/snake',
    icon: '🐍',
    theme: 'emerald',
    tags: ['经典敏捷', '阶梯变速', '原生音效'],
    desc: '经典灵动贪吃蛇，支持平滑操控、动态阶梯变速与 Canvas 高清微动效，挑战最高得分纪录。',
    formatStats: (rec) => [
      {
        label: '最高得分',
        value: rec?.bestScore ?? 0,
        highlight: (rec?.bestScore || 0) > 0,
      },
      {
        label: '游玩次数',
        value: `${rec?.playCount ?? 0} 次`,
      },
    ],
  },
  {
    id: 'game2048',
    title: '2048',
    subtitle: 'Number Puzzle',
    path: '/games/2048',
    icon: '🔢',
    theme: 'amber',
    tags: ['数字益智', '步骤撤销', '手势轻扫'],
    desc: '4×4 经典数字华容道合并，支持一键撤销历史、移动端轻扫手势与极致弹跳微动效。',
    formatStats: (rec) => [
      {
        label: '最高得分',
        value: rec?.bestScore ?? 0,
        highlight: (rec?.bestScore || 0) > 0,
      },
      {
        label: '最大方块',
        value: rec?.maxTile > 0 ? rec.maxTile : '--',
        highlight: (rec?.maxTile || 0) >= 2048,
      },
      {
        label: '游玩次数',
        value: `${rec?.playCount ?? 0} 次`,
      },
    ],
  },
  {
    id: 'minesweeper',
    title: '扫雷',
    subtitle: 'Minesweeper',
    path: '/games/minesweeper',
    icon: '💣',
    theme: 'rose',
    tags: ['逻辑推理', '首击安全', '连片展开'],
    desc: '经典 Windows 推理排雷体验，首击绝对安全保证、空白连片展开与双难度排雷。',
    formatStats: (rec) => [
      {
        label: '初级最快',
        value: rec?.bestTimeBeginner != null ? `${rec.bestTimeBeginner}s` : '--',
        highlight: rec?.bestTimeBeginner != null,
      },
      {
        label: '中级最快',
        value: rec?.bestTimeIntermediate != null ? `${rec.bestTimeIntermediate}s` : '--',
        highlight: rec?.bestTimeIntermediate != null,
      },
      {
        label: '游玩次数',
        value: `${rec?.playCount ?? 0} 次`,
      },
    ],
  },
  {
    id: 'memory',
    title: '记忆翻牌',
    subtitle: 'Memory Match',
    path: '/games/memory',
    icon: '🧩',
    theme: 'violet',
    tags: ['记忆配对', '3D 翻转', '极客主题'],
    desc: '4×4 网格 8 对精选极客科技 Emoji，纯 CSS 3D 立体翻转与通关星芒礼花狂欢。',
    formatStats: (rec) => [
      {
        label: '最少步数',
        value: rec?.bestTurns != null ? `${rec.bestTurns} 步` : '--',
        highlight: rec?.bestTurns != null,
      },
      {
        label: '最佳用时',
        value: rec?.bestTime != null ? `${rec.bestTime}s` : '--',
        highlight: rec?.bestTime != null,
      },
      {
        label: '游玩次数',
        value: `${rec?.playCount ?? 0} 次`,
      },
    ],
  },
  {
    id: 'tetris',
    title: '俄罗斯方块',
    subtitle: 'Classic Tetris',
    path: '/games/tetris',
    icon: '🧱',
    theme: 'cyan',
    tags: ['经典消除', 'SRS旋转', '7-Bag'],
    desc: '纯正经典 60FPS 消除挑战，支持 SRS 旋转踢墙系统、7-Bag 随机器、Hold 暂存与幽灵落点投影。',
    formatStats: (rec) => [
      {
        label: '最高得分',
        value: rec?.bestScore ?? 0,
        highlight: (rec?.bestScore || 0) > 0,
      },
      {
        label: '最多消行',
        value: rec?.maxLines > 0 ? `${rec.maxLines} 行` : '--',
        highlight: (rec?.maxLines || 0) > 0,
      },
      {
        label: '游玩次数',
        value: `${rec?.playCount ?? 0} 次`,
      },
    ],
  },
  {
    id: 'gomoku',
    title: '五子棋人机',
    subtitle: 'Gomoku AI Battle',
    path: '/games/gomoku',
    icon: '♟️',
    theme: 'indigo',
    tags: ['人机博弈', '3级AI', '悔棋支持'],
    desc: '经典 15×15 棋盘人机对弈，内置简单/中等/困难 3 级启发式智能 AI 与无限步悔棋支持。',
    formatStats: (rec) => [
      {
        label: '战胜AI',
        value: `${rec?.wins ?? 0} 胜`,
        highlight: (rec?.wins || 0) > 0,
      },
      {
        label: '总局数',
        value: `${(rec?.wins || 0) + (rec?.losses || 0)} 局`,
      },
      {
        label: '游玩次数',
        value: `${rec?.playCount ?? 0} 次`,
      },
    ],
  },
  {
    id: 'sudoku',
    title: '数独',
    subtitle: 'Classic Sudoku',
    path: '/games/sudoku',
    icon: '🔢',
    theme: 'orange',
    tags: ['逻辑演算', '候选笔记', '实时冲突'],
    desc: '经典 9×9 逻辑数独，唯一解题目回溯生成，支持候选笔记模式、实时冲突高亮与三档难度。',
    formatStats: (rec) => [
      {
        label: '初级最快',
        value: rec?.easyBestTime != null ? `${rec.easyBestTime}s` : '--',
        highlight: rec?.easyBestTime != null,
      },
      {
        label: '中级最快',
        value: rec?.mediumBestTime != null ? `${rec.mediumBestTime}s` : '--',
        highlight: rec?.mediumBestTime != null,
      },
      {
        label: '高级最快',
        value: rec?.hardBestTime != null ? `${rec.hardBestTime}s` : '--',
        highlight: rec?.hardBestTime != null,
      },
      {
        label: '游玩次数',
        value: `${rec?.playCount ?? 0} 次`,
      },
    ],
  },
];

/**
 * 休闲小游戏中心大厅页面组件 (GamesHome)
 *
 * 遵循 Apple HIG Bento Grid 设计哲学，展示 7 款经典益智游戏的专属渐变光泽、
 * 图标、玩法标签与实时战绩，支持悬停微动效与平滑路由跳转。
 */
export default function GamesHome() {
  usePageTitle('休闲小游戏中心');
  const navigate = useNavigate();

  // 读取战绩本地持久化数据
  const [records, setRecords] = useState(() => getRecords());

  // 每次页面激活时刷新最新战绩
  useEffect(() => {
    setRecords(getRecords());
  }, []);

  // 统计所有小游戏的累计游玩总数
  const totalPlays = useMemo(() => {
    return (
      (records.snake?.playCount || 0) +
      (records.game2048?.playCount || 0) +
      (records.minesweeper?.playCount || 0) +
      (records.memory?.playCount || 0) +
      (records.tetris?.playCount || 0) +
      (records.gomoku?.playCount || 0) +
      (records.sudoku?.playCount || 0)
    );
  }, [records]);

  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        {/* 全站公共头部导航 */}
        <Header />

        {/* Hero 标题与特色导览 */}
        <section className="games-hero-section">
          <div className="games-hero-pill">
            <span className="games-hero-pill-dot" aria-hidden="true" />
            <span>Mini Games Hub</span>
          </div>
          <h2 className="games-hero-title">休闲小游戏中心</h2>
          <p className="games-hero-desc">
            7 款经典益智游戏 · 纯前端免安装 · 战绩本地保存
          </p>

          <div className="games-hero-meta-row" aria-label="游戏中心统计">
            <div className="games-hero-meta-item">
              <span className="games-hero-meta-num">7</span>
              <span className="games-hero-meta-label">款独立游戏</span>
            </div>
            <div className="games-hero-meta-divider" aria-hidden="true" />
            <div className="games-hero-meta-item">
              <span className="games-hero-meta-num">{totalPlays}</span>
              <span className="games-hero-meta-label">次总游玩</span>
            </div>
            <div className="games-hero-meta-divider" aria-hidden="true" />
            <div className="games-hero-meta-item">
              <span className="games-hero-meta-num">100%</span>
              <span className="games-hero-meta-label">纯前端驱动</span>
            </div>
          </div>
        </section>

        {/* Bento Grid 游戏展厅 */}
        <section className="games-bento-grid" aria-label="游戏列表">
          {GAME_CONFIGS.map((game) => {
            const gameRecord = records[game.id] || {};
            const stats = game.formatStats(gameRecord);

            return (
              <article
                key={game.id}
                className={`games-bento-card games-theme-${game.theme}`}
                onClick={() => navigate(game.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(game.path);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`进入游戏：${game.title}`}
              >
                {/* 专属氛围柔和呼吸光晕 */}
                <div className="games-card-ambient-glow" aria-hidden="true" />

                {/* 卡片头部：图标、标题、英文副标、玩法标签 */}
                <div className="games-card-header">
                  <div className="games-card-icon-box" aria-hidden="true">
                    <span>{game.icon}</span>
                  </div>
                  <div className="games-card-title-group">
                    <div className="games-card-title-row">
                      <h3 className="games-card-title">{game.title}</h3>
                      <span className="games-card-subtitle">{game.subtitle}</span>
                    </div>
                    <div className="games-card-tags">
                      {game.tags.map((tag) => (
                        <span key={tag} className="games-card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 游戏特色描述 */}
                <p className="games-card-desc">{game.desc}</p>

                {/* 实时本地战绩指标 */}
                <div className="games-card-stats-grid">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="games-card-stat-item">
                      <span className="games-card-stat-label">{stat.label}</span>
                      <span
                        className={`games-card-stat-value ${
                          stat.highlight ? 'highlight' : ''
                        }`}
                      >
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 底部操作区 */}
                <div className="games-card-footer">
                  <Link
                    to={game.path}
                    className="games-card-play-btn"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`开始游戏 ${game.title}`}
                  >
                    <span>开始游戏</span>
                    <svg
                      className="games-play-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {/* 全站统一 Apple 风格页脚 */}
        <footer className="apple-footer">
          <p>Ly</p>
        </footer>
      </div>
    </main>
  );
}
