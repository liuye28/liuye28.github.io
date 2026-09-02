import React, { useState } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import SiteGrid from '../components/SiteGrid';
import { useCategoryFilter } from '../hooks/useCategoryFilter';
import { categories, sites } from '../data/sites';
import './Home.css';

/**
 * 首页独立视图组件 (Apple HIG 风格)
 */
export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  // 复用搜索与分类过滤 Hook
  const { filteredList: filteredSites, categoryCounts } = useCategoryFilter(sites, {
    keyword,
    activeCategory,
    categories,
  });

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
