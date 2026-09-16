import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import usePageTitle from '../hooks/usePageTitle';
import AboutHero from '../components/about/AboutHero';
import ReadingSection from '../components/about/ReadingSection';
import LabSection from '../components/about/LabSection';
import { safeGetItem, safeSetItem } from '../utils/storage';
import './AboutMe.css';

/**
 * 分段控制器选项卡配置
 */
const TABS = [
  { id: 'reading', label: '在读书单', icon: '📚' },
  { id: 'lab', label: '创意实验室', icon: '🧪' }
];

const STORAGE_KEY = 'about_active_tab';
const VALID_TABS = ['reading', 'lab'];

/**
 * 关于我页面 (Apple HIG 极客空间与创意实验室)
 */
export default function AboutMe() {
  usePageTitle('关于我 · 极客空间与实验室');

  // 持久化记忆当前选项卡，默认 'reading'
  const [activeTab, setActiveTab] = useState(() => {
    const saved = safeGetItem(STORAGE_KEY, 'reading');
    return VALID_TABS.includes(saved) ? saved : 'reading';
  });

  // 药丸滑动指示条样式状态
  const [indicatorStyle, setIndicatorStyle] = useState({
    transform: 'translateX(0px)',
    width: 0,
    opacity: 0
  });

  const tabListRef = useRef(null);
  const tabRefs = useRef({});

  // 动态更新药丸滑块位置与宽度
  const updateIndicator = useCallback(() => {
    const currentTabEl = tabRefs.current[activeTab];
    const listEl = tabListRef.current;
    if (currentTabEl && listEl) {
      const listRect = listEl.getBoundingClientRect();
      const tabRect = currentTabEl.getBoundingClientRect();
      const left = tabRect.left - listRect.left - (listEl.clientLeft || 0);
      const width = tabRect.width;

      setIndicatorStyle({
        transform: `translateX(${left}px)`,
        width: `${width}px`,
        opacity: 1
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();

    let ro;
    if (typeof ResizeObserver !== 'undefined' && tabListRef.current) {
      ro = new ResizeObserver(() => {
        updateIndicator();
      });
      ro.observe(tabListRef.current);
    }

    window.addEventListener('resize', updateIndicator);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  // 切换选项卡并持久化
  const handleTabChange = useCallback((tabId) => {
    if (!VALID_TABS.includes(tabId)) return;
    setActiveTab(tabId);
    safeSetItem(STORAGE_KEY, tabId);
  }, []);

  // 键盘无障碍导航 (WAI-ARIA Tablist 规范)
  const handleKeyDown = useCallback((e, currentIndex) => {
    let targetIndex = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = (currentIndex + 1) % TABS.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = TABS.length - 1;
        break;
      default:
        break;
    }

    if (targetIndex !== null) {
      const targetTab = TABS[targetIndex];
      handleTabChange(targetTab.id);
      const targetBtn = tabRefs.current[targetTab.id];
      if (targetBtn) {
        targetBtn.focus();
      }
    }
  }, [handleTabChange]);

  // 渲染选中的内容板块
  const renderTabContent = () => {
    switch (activeTab) {
      case 'reading':
        return <ReadingSection />;
      case 'lab':
        return <LabSection />;
      default:
        return <ReadingSection />;
    }
  };

  return (
    <main className="apple-home-wrapper about-page-wrapper">
      <div className="apple-home-content about-page-content">
        <Header />

        {/* 顶部个人名片与社交连接 */}
        <AboutHero />

        {/* Apple iOS 风格分段控制器 (Segmented Control) */}
        <nav className="about-segment-wrapper" aria-label="关于我内容分段导航">
          <div
            className="about-segmented-control"
            role="tablist"
            aria-orientation="horizontal"
            aria-label="极客空间内容切换"
            ref={tabListRef}
          >
            {/* 动态滑动药丸高光层 */}
            <div
              className="about-segment-pill-indicator"
              style={{
                transform: indicatorStyle.transform,
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity
              }}
              aria-hidden="true"
            />

            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  type="button"
                  role="tab"
                  id={`about-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`about-panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className={`about-segment-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <span className="about-segment-icon" aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span className="about-segment-label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* 选项卡内容区域 (带无缝淡入动效，key 保证状态干净与动画重触发) */}
        <section
          key={activeTab}
          className="about-tab-panel"
          role="tabpanel"
          id={`about-panel-${activeTab}`}
          aria-labelledby={`about-tab-${activeTab}`}
          tabIndex={0}
        >
          {renderTabContent()}
        </section>

        {/* Apple 极简页脚 */}
        <footer className="apple-footer">
          <p>Ly · Designed with Apple HIG Aesthetics</p>
        </footer>
      </div>
    </main>
  );
}
