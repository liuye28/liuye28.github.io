import { safeGetJSON, safeSetJSON } from './storage.js';

const STORAGE_KEY = 'games_records_v1';

const DEFAULT_RECORDS = {
  snake: { bestScore: 0, playCount: 0 },
  game2048: { bestScore: 0, maxTile: 0, playCount: 0 },
  minesweeper: { bestTimeBeginner: null, bestTimeIntermediate: null, playCount: 0 },
  memory: { bestTurns: null, bestTime: null, playCount: 0 },
};

function createDefaultRecords() {
  return {
    snake: { ...DEFAULT_RECORDS.snake },
    game2048: { ...DEFAULT_RECORDS.game2048 },
    minesweeper: { ...DEFAULT_RECORDS.minesweeper },
    memory: { ...DEFAULT_RECORDS.memory },
  };
}

export function getRecords() {
  const data = safeGetJSON(STORAGE_KEY, null);
  if (!data || typeof data !== 'object') {
    return createDefaultRecords();
  }
  return {
    snake: { ...DEFAULT_RECORDS.snake, ...data.snake },
    game2048: { ...DEFAULT_RECORDS.game2048, ...data.game2048 },
    minesweeper: { ...DEFAULT_RECORDS.minesweeper, ...data.minesweeper },
    memory: { ...DEFAULT_RECORDS.memory, ...data.memory },
  };
}

export function getGameRecord(gameKey) {
  const records = getRecords();
  return records[gameKey] || DEFAULT_RECORDS[gameKey] || {};
}

export function updateRecord(gameKey, payload = {}) {
  const records = getRecords();
  const target = records[gameKey] || { playCount: 0 };
  target.playCount = (target.playCount || 0) + 1;

  if (gameKey === 'snake') {
    const { score = 0 } = payload;
    target.bestScore = Math.max(target.bestScore || 0, score);
  } else if (gameKey === 'game2048') {
    const { score = 0, maxTile = 0 } = payload;
    target.bestScore = Math.max(target.bestScore || 0, score);
    target.maxTile = Math.max(target.maxTile || 0, maxTile);
  } else if (gameKey === 'minesweeper') {
    const { level, time } = payload;
    if (typeof time === 'number' && time > 0) {
      if (level === 'beginner') {
        target.bestTimeBeginner = target.bestTimeBeginner === null
          ? time
          : Math.min(target.bestTimeBeginner, time);
      } else if (level === 'intermediate') {
        target.bestTimeIntermediate = target.bestTimeIntermediate === null
          ? time
          : Math.min(target.bestTimeIntermediate, time);
      }
    }
  } else if (gameKey === 'memory') {
    const { turns, time } = payload;
    if (typeof turns === 'number' && turns > 0) {
      target.bestTurns = target.bestTurns === null ? turns : Math.min(target.bestTurns, turns);
    }
    if (typeof time === 'number' && time > 0) {
      target.bestTime = target.bestTime === null ? time : Math.min(target.bestTime, time);
    }
  }

  records[gameKey] = target;
  safeSetJSON(STORAGE_KEY, records);
  return target;
}

export function resetRecords() {
  const defaults = createDefaultRecords();
  safeSetJSON(STORAGE_KEY, defaults);
  return defaults;
}
