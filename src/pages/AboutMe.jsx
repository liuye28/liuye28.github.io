import React from 'react';
import Header from '../components/Header';
import './AboutMe.css';

/**
 * 关于我与技术雷达页面
 */
export default function AboutMe() {
  const skillCategories = [
    {
      title: '☕ 后端核心与架构',
      icon: '⚙️',
      skills: ['Java 17 / 21', 'Spring Boot 3', 'Spring Cloud', 'MyBatis-Plus', 'JVM 调优', 'AOP / 事务机制', '并发编程']
    },
    {
      title: '💾 存储与消息中间件',
      icon: '🗄️',
      skills: ['MySQL 性能调优', 'Redis 缓存架构', 'RabbitMQ', 'Kafka', 'ElasticSearch', '分布式锁']
    },
    {
      title: '🚢 云原生与自动化运维',
      icon: '🐳',
      skills: ['Docker', 'Docker Compose', 'Linux 生产排障', 'Nginx 反向代理', 'GitHub Actions CI/CD']
    },
    {
      title: '📦 跨境电商与全栈实践',
      icon: '🌐',
      skills: ['Ozon 官方 API', '跨境自动化刊登', 'React 18', 'Vite', 'Apple HIG 极简设计']
    }
  ];

  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        <Header />

        {/* 个人主导 Hero 卡片 */}
        <section className="about-hero">
          <div className="about-avatar-box">Ly</div>
          <h2 className="about-name">Ly (liuye28)</h2>
          <div className="about-tagline">
            Java 后端架构师 · 跨境电商独立开发者 · 极简主义践行者
          </div>
          <p className="about-bio">
            深耕高并发后端分布式架构、JVM 线上性能排查与数据库调优；同时以业务驱动技术，深入 Ozon 等跨境电商平台自动化链路开发。热爱极简高效的工程美学，追求 100% 纯前端零成本交付的高可用个人数字花园。
          </p>
        </section>

        {/* 技术栈矩阵 */}
        <section style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            🛠️ 技术栈雷达 (Tech Stack)
          </h3>
          <div className="skills-grid">
            {skillCategories.map((cat) => (
              <div key={cat.title} className="skill-category-card">
                <div className="skill-card-title">
                  <span>{cat.title}</span>
                </div>
                <div className="skill-pill-list">
                  {cat.skills.map((s) => (
                    <span key={s} className="skill-pill">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 工程理念与足迹 */}
        <section className="skill-category-card" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            🌱 工程哲学与数字足迹
          </h3>
          <div className="milestone-timeline">
            <div className="milestone-item">
              <span className="milestone-year">2026</span>
              <div className="milestone-body">
                <strong>全能个人工作台升级</strong>：拓展 18 款实用小工具与技术速查备忘录，涵盖 Ozon 跨境专用辅助、MyBatis-Plus 实体生成、Monaco Diff 对比器与白噪音番茄钟，保持 100% 纯前端静态零成本架构。
              </div>
            </div>
            <div className="milestone-item">
              <span className="milestone-year">2025</span>
              <div className="milestone-body">
                <strong>个人导航与跨境工具箱搭建</strong>：采用 Apple HIG 极简规范重构全站视觉，打通 GitHub Actions 自动化持续集成，实现秒级静态发布。
              </div>
            </div>
          </div>
        </section>

        {/* 联系与社交 */}
        <section className="skill-category-card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            与我连接 (Connect)
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            欢迎探讨 Java 后端架构、性能调优或跨境电商自动化合作
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/liuye28"
              target="_blank"
              rel="noreferrer"
              className="apple-btn apple-btn-primary apple-btn-sm"
              style={{ borderRadius: 'var(--radius-pill)', padding: '6px 18px' }}
            >
              GitHub 个人主页
            </a>
            <a
              href="https://github.com/liuye28/ly.github.io"
              target="_blank"
              rel="noreferrer"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              style={{ borderRadius: 'var(--radius-pill)', padding: '6px 18px' }}
            >
              本站开源仓库
            </a>
          </div>
        </section>

        <footer className="apple-footer">
          <p>Ly · Designed with Apple HIG Aesthetics</p>
        </footer>
      </div>
    </main>
  );
}
