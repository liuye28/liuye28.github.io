/**
 * Cron 表达式解析、跳跃推算与自然语言翻译引擎
 */

// 常用高频预设
export const PRESETS = [
  { label: '每 5 秒', cron: '*/5 * * * * ?', desc: '用于高频心跳或轮询' },
  { label: '每 1 分钟', cron: '0 * * * * ?', desc: '每分钟 00 秒触发' },
  { label: '每 5 分钟', cron: '0 0/5 * * * ?', desc: 'Spring Boot 常用定时任务' },
  { label: '每 30 分钟', cron: '0 0/30 * * * ?', desc: '半小时统计一次' },
  { label: '每小时整点', cron: '0 0 * * * ?', desc: '每小时 00 分 00 秒' },
  { label: '每天凌晨 02:00', cron: '0 0 2 * * ?', desc: '日常数据备份与离线汇总' },
  { label: '工作日早 09:00', cron: '0 0 9 ? * MON-FRI', desc: '周一至周五上班提醒/打卡' },
  { label: '每周一早 08:30', cron: '0 30 8 ? * MON', desc: '每周例会任务' },
  { label: '每月 1 号零点', cron: '0 0 0 1 * ?', desc: '月度账单结算与重置' },
];

export const WEEK_MAP = {
  '1': '周日', 'SUN': '周日',
  '2': '周一', 'MON': '周一',
  '3': '周二', 'TUE': '周二',
  '4': '周三', 'WED': '周三',
  '5': '周四', 'THU': '周四',
  '6': '周五', 'FRI': '周五',
  '7': '周六', 'SAT': '周六'
};

export const WEEK_LIST = [
  { val: 'MON', label: '周一 (MON)' },
  { val: 'TUE', label: '周二 (TUE)' },
  { val: 'WED', label: '周三 (WED)' },
  { val: 'THU', label: '周四 (THU)' },
  { val: 'FRI', label: '周五 (FRI)' },
  { val: 'SAT', label: '周六 (SAT)' },
  { val: 'SUN', label: '周日 (SUN)' },
];

/**
 * 格式化补零
 */
export function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(d) {
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const date = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayName = dayNames[d.getDay()];
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds} (${dayName})`;
}

/**
 * 计算相对当前时间的友善描述
 */
export function getRelativeTime(targetDate, now = new Date()) {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs < 0) return '已过期';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec} 秒后`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分钟后 (${diffSec % 60}秒)`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时 ${diffMin % 60} 分钟后`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天后`;
}

/**
 * 解析 Cron 单个字段为匹配数字集合
 */
export function parseField(expr, min, max, isWeek = false) {
  const set = new Set();
  if (!expr || expr === '*' || expr === '?') {
    for (let i = min; i <= max; i++) set.add(i);
    return set;
  }

  // 星期英文字符转换
  let cleanExpr = expr.toUpperCase();
  if (isWeek) {
    const weekAliases = { 'SUN': '1', 'MON': '2', 'TUE': '3', 'WED': '4', 'THU': '5', 'FRI': '6', 'SAT': '7' };
    for (const [k, v] of Object.entries(weekAliases)) {
      cleanExpr = cleanExpr.replace(new RegExp(k, 'g'), v);
    }
  }

  const parts = cleanExpr.split(',');
  for (const part of parts) {
    if (part.includes('/')) {
      // 步长：start/step 或 */step
      const [startStr, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) continue;
      const start = startStr === '*' ? min : parseInt(startStr, 10);
      if (isNaN(start)) continue;
      for (let i = start; i <= max; i += step) {
        if (i >= min && i <= max) set.add(i);
      }
    } else if (part.includes('-')) {
      // 区间：start-end
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) continue;
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) set.add(i);
      }
    } else {
      // 单个数字
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= min && num <= max) {
        set.add(num);
      }
    }
  }

  return set;
}

/**
 * 纯前端推算未来 N 次执行时间
 */
export function calculateNextRuns(cronString, count = 10, fromDate = null) {
  const parts = cronString.trim().split(/\s+/);
  let secExpr, minExpr, hourExpr, dayExpr, monthExpr, weekExpr;

  if (parts.length === 5) {
    // Linux crontab: 分 时 日 月 周
    secExpr = '0';
    [minExpr, hourExpr, dayExpr, monthExpr, weekExpr] = parts;
  } else if (parts.length >= 6) {
    // Spring / Quartz: 秒 分 时 日 月 周 [年]
    [secExpr, minExpr, hourExpr, dayExpr, monthExpr, weekExpr] = parts;
  } else {
    throw new Error('Cron 表达式格式不完整（需 5~6 段）');
  }

  const secSet = parseField(secExpr, 0, 59);
  const minSet = parseField(minExpr, 0, 59);
  const hourSet = parseField(hourExpr, 0, 23);
  const monthSet = parseField(monthExpr, 1, 12);

  // 基础字段为空时快速退出
  if (secSet.size === 0 || minSet.size === 0 || hourSet.size === 0 || monthSet.size === 0) {
    return [];
  }

  // 提前预解析日期与星期集合，避免在每次循环内部重复解析与构造 Set
  const isDayWild = dayExpr === '*' || dayExpr === '?';
  const isWeekWild = weekExpr === '*' || weekExpr === '?';
  const daySet = !isDayWild ? parseField(dayExpr, 1, 31) : null;
  const weekSet = !isWeekWild ? parseField(weekExpr, 1, 7, true) : null;

  if ((daySet && daySet.size === 0) || (weekSet && weekSet.size === 0)) {
    return [];
  }

  // 排序供跳跃快速定位
  const sortedSecs = Array.from(secSet).sort((a, b) => a - b);
  const sortedMins = Array.from(minSet).sort((a, b) => a - b);
  const sortedHours = Array.from(hourSet).sort((a, b) => a - b);

  const results = [];
  const start = fromDate || new Date();
  // 从下一秒开始推算
  const current = new Date(start.getTime() + 1000);
  current.setMilliseconds(0);

  // 保护性最大循环步数，字段跳跃后数万次足以推算出数年跨度
  let iterations = 0;
  const maxIterations = 50000;

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    // 1. 检查月份
    const month = current.getMonth() + 1;
    if (!monthSet.has(month)) {
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
      current.setHours(sortedHours[0], sortedMins[0], sortedSecs[0], 0);
      continue;
    }

    // 2. 检查日期与星期
    const day = current.getDate();
    const week = current.getDay() + 1; // 1=Sun, 2=Mon... 7=Sat

    let dayMatch = false;
    if (isDayWild && isWeekWild) {
      dayMatch = true;
    } else if (!isDayWild && isWeekWild) {
      dayMatch = daySet.has(day);
    } else if (isDayWild && !isWeekWild) {
      dayMatch = weekSet.has(week);
    } else {
      dayMatch = daySet.has(day) || weekSet.has(week);
    }

    if (!dayMatch) {
      current.setDate(current.getDate() + 1);
      current.setHours(sortedHours[0], sortedMins[0], sortedSecs[0], 0);
      continue;
    }

    // 3. 检查小时：按字段跳跃
    const hour = current.getHours();
    if (!hourSet.has(hour)) {
      const nextHour = sortedHours.find((h) => h > hour);
      if (nextHour !== undefined) {
        current.setHours(nextHour, sortedMins[0], sortedSecs[0], 0);
      } else {
        // 当日已无匹配小时，直接跳到明天首个有效时分秒
        current.setDate(current.getDate() + 1);
        current.setHours(sortedHours[0], sortedMins[0], sortedSecs[0], 0);
      }
      continue;
    }

    // 4. 检查分钟：按字段跳跃
    const min = current.getMinutes();
    if (!minSet.has(min)) {
      const nextMin = sortedMins.find((m) => m > min);
      if (nextMin !== undefined) {
        current.setMinutes(nextMin, sortedSecs[0], 0);
      } else {
        // 当前小时已无匹配分钟，直接进位到下一小时
        current.setHours(current.getHours() + 1, sortedMins[0], sortedSecs[0], 0);
      }
      continue;
    }

    // 5. 检查秒：按字段跳跃
    const sec = current.getSeconds();
    if (!secSet.has(sec)) {
      const nextSec = sortedSecs.find((s) => s > sec);
      if (nextSec !== undefined) {
        current.setSeconds(nextSec);
      } else {
        // 当前分钟已无匹配秒，直接进位到下一分钟
        current.setMinutes(current.getMinutes() + 1, sortedSecs[0], 0);
      }
      continue;
    }

    // 命中一个有效执行时间点
    results.push(new Date(current.getTime()));

    // 推进到下一个候选秒数或下一分钟
    const nextSec = sortedSecs.find((s) => s > sec);
    if (nextSec !== undefined) {
      current.setSeconds(nextSec);
    } else {
      current.setMinutes(current.getMinutes() + 1, sortedSecs[0], 0);
    }
  }

  return results;
}

/**
 * 翻译 Cron 表达式为中文自然语言
 */
export function translateCronToChinese(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return '表达式格式不完整';

  let sec, min, hour, day, month, week;
  if (parts.length === 5) {
    sec = '0';
    [min, hour, day, month, week] = parts;
  } else {
    [sec, min, hour, day, month, week] = parts;
  }

  const descParts = [];

  // 1. 月份
  if (month !== '*' && month !== '?') {
    descParts.push(`每年 ${month} 月`);
  }

  // 2. 日期与星期
  if (day !== '*' && day !== '?') {
    descParts.push(`每月 ${day} 号`);
  } else if (week !== '*' && week !== '?') {
    if (week.includes('-')) {
      const [startW, endW] = week.split('-');
      const startName = WEEK_MAP[startW.toUpperCase()] || startW;
      const endName = WEEK_MAP[endW.toUpperCase()] || endW;
      descParts.push(`每周 ${startName}至${endName}`);
    } else {
      const weekNames = week.split(',').map(w => WEEK_MAP[w.toUpperCase()] || w).join('、');
      descParts.push(`每周 ${weekNames}`);
    }
  } else {
    descParts.push('每天');
  }

  // 3. 时间与频率
  if (sec.startsWith('*/')) {
    const step = sec.replace('*/', '');
    descParts.push(`每隔 ${step} 秒`);
  } else if (min.startsWith('*/') || min.includes('/')) {
    const step = min.includes('/') ? min.split('/')[1] : min.replace('*/', '');
    descParts.push(`每隔 ${step} 分钟`);
  } else {
    const h = hour === '*' ? '每小时' : `${pad(hour)}点`;
    const m = min === '*' ? '每分' : `${pad(min)}分`;
    const s = sec === '*' ? '每秒' : `${pad(sec)}秒`;
    descParts.push(`在 ${h}${m}${s}`);
  }

  return `${descParts.join(' ')} 触发`;
}
