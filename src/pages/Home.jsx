import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import SiteGrid from '../components/SiteGrid';
import { categories, sites } from '../data/sites';
import './Home.css';

/**
 * 首页独立视图组件 (Apple HIG 风格)
 */
export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  // 统计分类条目总数
  const categoryCounts = useMemo(() => {
    const counts = { 全部: sites.length };
    categories.forEach((cat) => {
      if (cat !== '全部') {
        counts[cat] = sites.filter((site) => site.category === cat).length;
      }
    });
    return counts;
  }, []);

  // 综合分类与关键词过滤
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesCategory =
        activeCategory === '全部' || site.category === activeCategory;

      const cleanKeyword = keyword.trim().toLowerCase();
      const matchesSearch =
        !cleanKeyword ||
        site.name.toLowerCase().includes(cleanKeyword) ||
        (site.desc && site.desc.toLowerCase().includes(cleanKeyword));

      return matchesCategory && matchesSearch;
    });
  }, [keyword, activeCategory]);

  const handleResetFilter = () => {
    setKeyword('');
    setActiveCategory('全部');
  };

  return (
    <main className="apple-home-wrapper">
      <div className="apple-home-content">
        <Header />

        <SearchBar
          keyword={keyword}
          onChange={setKeyword}
          onClear={() => setKeyword('')}
        />

        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          categoryCounts={categoryCounts}
        />

        <SiteGrid
          sites={filteredSites}
          onResetFilter={handleResetFilter}
        />

        <footer className="apple-footer">
          <p>Ly</p>
        </footer>
      </div>
    </main>
  );
}
