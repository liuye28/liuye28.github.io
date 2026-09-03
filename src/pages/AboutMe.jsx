import React from 'react';
import Header from '../components/Header';
import './AboutMe.css';

/**
 * 关于我页面 (精炼极简名片版)
 */
export default function AboutMe() {
  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        <Header />

        <div className="about-pure-container">
          {/* 个人身份头像与名称 */}
          <div className="about-profile-hero">
            <div className="about-avatar-circle" aria-label="Ly 头像">
              Ly
            </div>
            <h2 className="about-profile-name">Ly (liuye28)</h2>
          </div>

          {/* 与我连接独立卡片 */}
          <section className="about-connect-card">
            <h3 className="about-connect-title">与我连接 (Connect)</h3>
            <p className="about-connect-desc">
              欢迎探讨 Java 后端架构、性能调优或跨境电商自动化合作
            </p>
            <div className="about-action-group">
              <a
                href="https://github.com/liuye28"
                target="_blank"
                rel="noreferrer"
                className="apple-btn apple-btn-primary about-btn-pill"
              >
                GitHub 个人主页
              </a>
              <a
                href="https://github.com/liuye28/ly.github.io"
                target="_blank"
                rel="noreferrer"
                className="apple-btn apple-btn-secondary about-btn-pill"
              >
                本站开源仓库
              </a>
            </div>
          </section>
        </div>

        <footer className="apple-footer">
          <p>Ly · Designed with Apple HIG Aesthetics</p>
        </footer>
      </div>
    </main>
  );
}
