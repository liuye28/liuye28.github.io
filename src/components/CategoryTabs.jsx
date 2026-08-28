import React from 'react';
import './CategoryTabs.css';

/**
 * 苹果 iOS / macOS 分段控制器 (Segmented Control) 风格分类标签
 *
 * @param {Object} props
 * @param {string[]} props.categories 分类列表
 * @param {string} props.activeCategory 当前选中的分类
 * @param {function} props.onSelectCategory 选择分类回调
 * @param {Object.<string, number>} props.categoryCounts 各分类条目统计
 */
export default function CategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts = {}
}) {
  return (
    <div className="segmented-control-wrapper">
      <nav className="segmented-control" role="tablist" aria-label="网站分类">
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const count = categoryCounts[category] ?? 0;

          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`segment-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(category)}
            >
              <span className="segment-title">{category}</span>
              {count > 0 && <span className="segment-badge">{count}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
