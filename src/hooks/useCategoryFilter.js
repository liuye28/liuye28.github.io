import { useMemo } from 'react';

/**
 * 通用分类与搜索关键词过滤 Hook
 *
 * 封装以下重复逻辑：
 * 1. 统计各分类条目数量 (categoryCounts)
 * 2. 结合当前选中分类 (activeCategory) 与搜索关键字 (keyword) 进行多维度匹配过滤
 * 3. 通过 useMemo 进行依赖缓存，避免不必要的重复遍历与计算
 *
 * @param {Array<Object>} list 待过滤的数据列表 (如 sites / tools)
 * @param {Object} options 过滤配置参数
 * @param {string} [options.keyword=''] 搜索关键词
 * @param {string} [options.activeCategory='全部'] 当前激活的分类名称
 * @param {Array<string>} [options.categories=[]] 分类名称数组列表
 * @returns {{ filteredList: Array<Object>, categoryCounts: Record<string, number> }}
 */
export function useCategoryFilter(list = [], { keyword = '', activeCategory = '全部', categories = [] } = {}) {
  // 1. 统计各分类条目总数（包括全部和子分类）
  const categoryCounts = useMemo(() => {
    const items = list || [];
    const counts = { 全部: items.length };

    if (Array.isArray(categories)) {
      categories.forEach((cat) => {
        if (cat !== '全部') {
          counts[cat] = items.filter((item) => item.category === cat).length;
        }
      });
    }

    return counts;
  }, [list, categories]);

  // 2. 综合分类与关键词过滤列表
  const filteredList = useMemo(() => {
    if (!Array.isArray(list)) return [];
    const cleanKeyword = (keyword || '').trim().toLowerCase();

    return list.filter((item) => {
      // 分类匹配条件
      const matchesCategory =
        activeCategory === '全部' || item.category === activeCategory;

      // 关键词匹配条件 (不区分大小写，支持匹配 name、desc、url/path 域名及自定义 keywords 字段)
      const cleanUrl = (item.url || item.path || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
      const matchesSearch =
        !cleanKeyword ||
        (item.name && item.name.toLowerCase().includes(cleanKeyword)) ||
        (item.desc && item.desc.toLowerCase().includes(cleanKeyword)) ||
        (cleanUrl && cleanUrl.includes(cleanKeyword)) ||
        (Array.isArray(item.keywords) && item.keywords.some((k) => k.toLowerCase().includes(cleanKeyword)));

      return matchesCategory && matchesSearch;
    });
  }, [list, keyword, activeCategory]);

  return {
    filteredList,
    categoryCounts,
  };
}

export default useCategoryFilter;
